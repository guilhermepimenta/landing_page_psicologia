import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function — publica posts no Instagram via Graph API.
 *
 * Variáveis de ambiente necessárias no Vercel Dashboard:
 *   INSTAGRAM_ACCESS_TOKEN → Token de acesso da conta do Instagram (nunca VITE_)
 *   INSTAGRAM_USER_ID      → ID do usuário do Instagram (ex: "17841407475341821")
 *
 * POST /api/instagram/publish
 * Body: { imageUrls: string[], caption: string }
 * Retorna: { success: true, instagramPostId: string, instagramPermalink: string }
 *
 * GET /api/instagram/post/:id
 * Retorna: { id, permalink, timestamp, media_type }
 */

const GRAPH_API = 'https://graph.instagram.com/v21.0';

function getCredentials() {
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
  const query = new URLSearchParams({ ...params, access_token: accessToken });
  const response = await fetch(`${GRAPH_API}${path}?${query.toString()}`);
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
  // Etapa 1: criar container de mídia
  const container = await graphPost(
    `/${userId}/media`,
    { image_url: imageUrl, caption },
    accessToken,
  );

  // Etapa 2: publicar o container
  const publish = await graphPost(
    `/${userId}/media_publish`,
    { creation_id: container.id },
    accessToken,
  );

  // Etapa 3: buscar permalink
  const post = await graphGet(
    `/${publish.id}`,
    { fields: 'permalink' },
    accessToken,
  );

  return {
    instagramPostId: publish.id,
    instagramPermalink: post.permalink ?? `https://www.instagram.com/p/${publish.id}`,
  };
}

async function publishCarousel(
  userId: string,
  accessToken: string,
  imageUrls: string[],
  caption: string,
): Promise<{ instagramPostId: string; instagramPermalink: string }> {
  // Etapa 1: criar um container de mídia para cada imagem (sem caption)
  const childIds: string[] = [];
  for (const imageUrl of imageUrls) {
    const child = await graphPost(
      `/${userId}/media`,
      { image_url: imageUrl, is_carousel_item: 'true' },
      accessToken,
    );
    childIds.push(child.id);
  }

  // Etapa 2: criar container do carrossel
  const carousel = await graphPost(
    `/${userId}/media`,
    { media_type: 'CAROUSEL', caption, children: childIds.join(',') },
    accessToken,
  );

  // Etapa 3: publicar o carrossel
  const publish = await graphPost(
    `/${userId}/media_publish`,
    { creation_id: carousel.id },
    accessToken,
  );

  // Etapa 4: buscar permalink
  const post = await graphGet(
    `/${publish.id}`,
    { fields: 'permalink' },
    accessToken,
  );

  return {
    instagramPostId: publish.id,
    instagramPermalink: post.permalink ?? `https://www.instagram.com/p/${publish.id}`,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let credentials: { accessToken: string; userId: string };
  try {
    credentials = getCredentials();
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e.message });
  }

  const { accessToken, userId } = credentials;

  // GET /api/instagram/post/:id — busca dados de um post publicado
  if (req.method === 'GET') {
    const postId = req.query.id as string;
    if (!postId) {
      return res.status(400).json({ success: false, error: 'Parâmetro id obrigatório' });
    }
    try {
      const data = await graphGet(
        `/${postId}`,
        { fields: 'id,permalink,timestamp,media_type' },
        accessToken,
      );
      return res.status(200).json({ success: true, ...data });
    } catch (e: any) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  // POST /api/instagram/publish
  if (req.method === 'POST') {
    const { imageUrls, caption } = req.body as { imageUrls?: string[]; caption?: string };

    if (!imageUrls || imageUrls.length === 0) {
      return res.status(400).json({ success: false, error: 'imageUrls é obrigatório e não pode estar vazio' });
    }
    if (typeof caption !== 'string') {
      return res.status(400).json({ success: false, error: 'caption é obrigatório' });
    }
    if (imageUrls.length > 10) {
      return res.status(400).json({ success: false, error: 'Máximo de 10 imagens por post' });
    }

    try {
      const result =
        imageUrls.length === 1
          ? await publishSingle(userId, accessToken, imageUrls[0], caption)
          : await publishCarousel(userId, accessToken, imageUrls, caption);

      return res.status(200).json({ success: true, ...result });
    } catch (e: any) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
