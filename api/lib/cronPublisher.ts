import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from './firebaseAdmin';

export type Channel = 'Instagram' | 'GMB' | 'Blog' | 'Email';

export interface ScheduledPost {
  title: string;
  content?: string;
  channel: Channel;
  imageUrls?: string[];
}

export interface PostResult {
  postId: string;
  channel: Channel;
  action: 'published' | 'skipped' | 'error';
  detail: string;
  instagramPostId?: string;
  durationMs: number;
}

export interface RunSummary {
  success: boolean;
  triggeredBy: 'cron' | 'manual';
  dryRun: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  scanned: number;
  published: number;
  errors: number;
  skipped: number;
  byChannel: Record<string, number>;
  results: PostResult[];
  error?: string;
}

const GRAPH_API = 'https://graph.facebook.com/v19.0';

function getInstagramCredentials() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !userId) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN ou INSTAGRAM_USER_ID não configurados');
  }
  return { accessToken, userId };
}

async function graphPost(path: string, body: Record<string, string>, accessToken: string) {
  const params = new URLSearchParams({ ...body, access_token: accessToken });
  const response = await fetch(`${GRAPH_API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await response.json() as any;
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Erro na Graph API: ${response.status}`);
  }
  return data;
}

async function graphGet(path: string, params: Record<string, string>, accessToken: string) {
  const qs = new URLSearchParams({ ...params, access_token: accessToken });
  const response = await fetch(`${GRAPH_API}${path}?${qs.toString()}`);
  const data = await response.json() as any;
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Erro na Graph API: ${response.status}`);
  }
  return data;
}

async function publishSingle(
  userId: string,
  accessToken: string,
  imageUrl: string,
  caption: string,
): Promise<{ instagramPostId: string; instagramPermalink: string }> {
  const container = await graphPost(`/${userId}/media`, { image_url: imageUrl, caption }, accessToken);
  const publish = await graphPost(`/${userId}/media_publish`, { creation_id: container.id }, accessToken);
  const post = await graphGet(`/${publish.id}`, { fields: 'permalink' }, accessToken);
  return {
    instagramPostId: publish.id as string,
    instagramPermalink: (post.permalink as string) ?? `https://www.instagram.com/p/${publish.id}`,
  };
}

async function publishCarousel(
  userId: string,
  accessToken: string,
  imageUrls: string[],
  caption: string,
): Promise<{ instagramPostId: string; instagramPermalink: string }> {
  const childIds: string[] = [];
  for (const imageUrl of imageUrls) {
    const child = await graphPost(`/${userId}/media`, { image_url: imageUrl, is_carousel_item: 'true' }, accessToken);
    childIds.push(child.id);
  }
  const carousel = await graphPost(
    `/${userId}/media`,
    { media_type: 'CAROUSEL', caption, children: childIds.join(',') },
    accessToken,
  );
  const publish = await graphPost(`/${userId}/media_publish`, { creation_id: carousel.id }, accessToken);
  const post = await graphGet(`/${publish.id}`, { fields: 'permalink' }, accessToken);
  return {
    instagramPostId: publish.id as string,
    instagramPermalink: (post.permalink as string) ?? `https://www.instagram.com/p/${publish.id}`,
  };
}

/**
 * Lógica central de auto-publicação.
 * - dryRun: consulta e retorna o que seria feito, sem escrever nada.
 * - triggeredBy: indica se foi disparado pelo cron automático ou por trigger manual.
 */
export async function runPublishScheduled(
  triggeredBy: 'cron' | 'manual',
  dryRun = false,
): Promise<RunSummary> {
  const startedAt = new Date();
  const db = getAdminDb();
  const now = Timestamp.now();

  let igCredentials: { accessToken: string; userId: string } | null = null;
  try {
    igCredentials = getInstagramCredentials();
  } catch {
    igCredentials = null;
  }

  const results: PostResult[] = [];

  try {
    const snapshot = await db
      .collection('posts')
      .where('status', '==', 'scheduled')
      .where('date', '<=', now)
      .get();

    for (const docSnap of snapshot.docs) {
      const tStart = Date.now();
      const post = docSnap.data() as ScheduledPost;
      const postId = docSnap.id;
      const channel = post.channel ?? ('Unknown' as Channel);

      try {
        if (channel !== 'Instagram') {
          if (!dryRun) {
            await db.collection('posts').doc(postId).update({
              status: 'published',
              updatedAt: Timestamp.now(),
            });
          }
          results.push({
            postId,
            channel,
            action: 'published',
            detail: dryRun
              ? `[dry-run] Post ${channel} seria marcado como publicado`
              : `Post ${channel} marcado como publicado automaticamente`,
            durationMs: Date.now() - tStart,
          });
          continue;
        }

        if (!igCredentials) {
          throw new Error('Credenciais do Instagram não configuradas no servidor');
        }

        const imageUrls = Array.isArray(post.imageUrls) ? post.imageUrls.filter(Boolean) : [];
        if (imageUrls.length === 0) {
          throw new Error('Post Instagram agendado sem imageUrls');
        }

        const caption = (post.content || post.title || '').trim();
        if (!caption) {
          throw new Error('Post sem título/conteúdo para legenda');
        }

        if (dryRun) {
          results.push({
            postId,
            channel,
            action: 'skipped',
            detail: `[dry-run] Publicaria no Instagram: "${caption.slice(0, 60)}..." (${imageUrls.length} imagem(ns))`,
            durationMs: Date.now() - tStart,
          });
          continue;
        }

        const publishResult =
          imageUrls.length === 1
            ? await publishSingle(igCredentials.userId, igCredentials.accessToken, imageUrls[0], caption)
            : await publishCarousel(igCredentials.userId, igCredentials.accessToken, imageUrls, caption);

        await db.collection('posts').doc(postId).update({
          status: 'published',
          instagramPostId: publishResult.instagramPostId,
          instagramPermalink: publishResult.instagramPermalink,
          updatedAt: Timestamp.now(),
        });

        results.push({
          postId,
          channel,
          action: 'published',
          detail: 'Publicado no Instagram com sucesso',
          instagramPostId: publishResult.instagramPostId,
          durationMs: Date.now() - tStart,
        });
      } catch (err: any) {
        results.push({
          postId,
          channel,
          action: 'error',
          detail: err?.message || 'Erro desconhecido ao processar post agendado',
          durationMs: Date.now() - tStart,
        });
      }
    }

    const finishedAt = new Date();
    const byChannel: Record<string, number> = {};
    for (const r of results) {
      byChannel[r.channel] = (byChannel[r.channel] ?? 0) + 1;
    }

    const summary: RunSummary = {
      success: true,
      triggeredBy,
      dryRun,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      scanned: snapshot.size,
      published: results.filter((r) => r.action === 'published').length,
      errors: results.filter((r) => r.action === 'error').length,
      skipped: results.filter((r) => r.action === 'skipped').length,
      byChannel,
      results,
    };

    // Persiste 1 documento de log por execução
    if (!dryRun) {
      await db.collection('cron_logs').add({ ...summary, createdAt: Timestamp.now() });
    }

    return summary;
  } catch (err: any) {
    const finishedAt = new Date();
    const summary: RunSummary = {
      success: false,
      triggeredBy,
      dryRun,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      scanned: 0,
      published: 0,
      errors: 1,
      skipped: 0,
      byChannel: {},
      results,
      error: err?.message || 'Falha geral na execução do cron',
    };

    try {
      if (!dryRun) {
        await db.collection('cron_logs').add({ ...summary, createdAt: Timestamp.now() });
      }
    } catch {
      // no-op: evita mascarar erro principal
    }

    return summary;
  }
}
