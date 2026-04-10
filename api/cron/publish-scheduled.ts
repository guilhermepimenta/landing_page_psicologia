import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '../lib/firebaseAdmin';

const GRAPH_API = 'https://graph.facebook.com/v19.0';

type Channel = 'Instagram' | 'GMB' | 'Blog' | 'Email';

interface ScheduledPost {
  title: string;
  content?: string;
  channel: Channel;
  imageUrls?: string[];
}

function getInstagramCredentials() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !userId) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN ou INSTAGRAM_USER_ID não configurados');
  }

  return { accessToken, userId };
}

function isAuthorizedCron(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true;
  }

  const auth = req.headers.authorization;
  return auth === `Bearer ${cronSecret}`;
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
  const query = new URLSearchParams({ ...params, access_token: accessToken });
  const response = await fetch(`${GRAPH_API}${path}?${query.toString()}`);
  const data = await response.json() as any;

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Erro na Graph API: ${response.status}`);
  }

  return data;
}

async function publishSingle(userId: string, accessToken: string, imageUrl: string, caption: string) {
  const container = await graphPost(
    `/${userId}/media`,
    { image_url: imageUrl, caption },
    accessToken,
  );

  const publish = await graphPost(
    `/${userId}/media_publish`,
    { creation_id: container.id },
    accessToken,
  );

  const post = await graphGet(
    `/${publish.id}`,
    { fields: 'permalink' },
    accessToken,
  );

  return {
    instagramPostId: publish.id as string,
    instagramPermalink: (post.permalink as string) ?? `https://www.instagram.com/p/${publish.id}`,
  };
}

async function publishCarousel(userId: string, accessToken: string, imageUrls: string[], caption: string) {
  const childIds: string[] = [];

  for (const imageUrl of imageUrls) {
    const child = await graphPost(
      `/${userId}/media`,
      { image_url: imageUrl, is_carousel_item: 'true' },
      accessToken,
    );
    childIds.push(child.id);
  }

  const carousel = await graphPost(
    `/${userId}/media`,
    { media_type: 'CAROUSEL', caption, children: childIds.join(',') },
    accessToken,
  );

  const publish = await graphPost(
    `/${userId}/media_publish`,
    { creation_id: carousel.id },
    accessToken,
  );

  const post = await graphGet(
    `/${publish.id}`,
    { fields: 'permalink' },
    accessToken,
  );

  return {
    instagramPostId: publish.id as string,
    instagramPermalink: (post.permalink as string) ?? `https://www.instagram.com/p/${publish.id}`,
  };
}

async function logCron(payload: Record<string, unknown>) {
  const db = getAdminDb();
  await db.collection('cron_logs').add({
    ...payload,
    createdAt: Timestamp.now(),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized cron request' });
  }

  const now = Timestamp.now();
  const db = getAdminDb();

  let instagramCredentials: { accessToken: string; userId: string } | null = null;
  try {
    instagramCredentials = getInstagramCredentials();
  } catch {
    instagramCredentials = null;
  }

  try {
    const snapshot = await db
      .collection('posts')
      .where('status', '==', 'scheduled')
      .where('date', '<=', now)
      .get();

    const results: Array<{ postId: string; status: 'published' | 'skipped' | 'error'; detail: string }> = [];

    for (const doc of snapshot.docs) {
      const post = doc.data() as ScheduledPost;
      const postId = doc.id;

      try {
        if (post.channel !== 'Instagram') {
          await db.collection('posts').doc(postId).update({
            status: 'published',
            updatedAt: Timestamp.now(),
          });

          const detail = 'Post não-Instagram marcado como publicado automaticamente';
          results.push({ postId, status: 'published', detail });
          await logCron({ postId, level: 'info', detail });
          continue;
        }

        if (!instagramCredentials) {
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

        const publishResult =
          imageUrls.length === 1
            ? await publishSingle(instagramCredentials.userId, instagramCredentials.accessToken, imageUrls[0], caption)
            : await publishCarousel(instagramCredentials.userId, instagramCredentials.accessToken, imageUrls, caption);

        await db.collection('posts').doc(postId).update({
          status: 'published',
          instagramPostId: publishResult.instagramPostId,
          instagramPermalink: publishResult.instagramPermalink,
          updatedAt: Timestamp.now(),
        });

        const detail = 'Post publicado no Instagram via cron';
        results.push({ postId, status: 'published', detail });
        await logCron({
          postId,
          level: 'info',
          detail,
          instagramPostId: publishResult.instagramPostId,
        });
      } catch (error: any) {
        const detail = error?.message || 'Erro desconhecido ao publicar post agendado';
        results.push({ postId, status: 'error', detail });
        await logCron({ postId, level: 'error', detail });
      }
    }

    const summary = {
      success: true,
      scanned: snapshot.size,
      published: results.filter((item) => item.status === 'published').length,
      errors: results.filter((item) => item.status === 'error').length,
      results,
    };

    return res.status(200).json(summary);
  } catch (error: any) {
    const detail = error?.message || 'Falha na execução do cron';
    try {
      await logCron({ postId: null, level: 'error', detail });
    } catch {
      // No-op: evita mascarar o erro principal por falha de log.
    }

    return res.status(500).json({ success: false, error: detail });
  }
}
