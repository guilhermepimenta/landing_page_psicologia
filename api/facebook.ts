import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function — publica posts na Página do Facebook.
 *
 * POST /api/facebook
 *   Body: { message: string, imageUrl?: string }
 *   → Publica na Página com foto (se imageUrl) ou só texto
 *
 * Variáveis de ambiente necessárias no Vercel Dashboard:
 *   FACEBOOK_PAGE_ACCESS_TOKEN  → Page Access Token com pages_manage_posts
 *   FACEBOOK_PAGE_ID            → ID numérico da Página (ex: "123456789012345")
 *
 * Como obter o token:
 *   1. Graph API Explorer → selecione sua Página
 *   2. Permissões: pages_manage_posts, pages_read_engagement, read_insights
 *   3. Gere → troque por Long-Lived Token (60 dias) ou use System User Token
 */

const FB_GRAPH = 'https://graph.facebook.com/v21.0';

function getCredentials() {
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!accessToken || !pageId) {
    throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN ou FACEBOOK_PAGE_ID não configurados');
  }
  return { accessToken, pageId };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let creds: ReturnType<typeof getCredentials>;
  try {
    creds = getCredentials();
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }

  const { accessToken, pageId } = creds;
  const { message, imageUrl } = req.body ?? {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message é obrigatório' });
  }

  try {
    let endpoint: string;
    const params = new URLSearchParams({ access_token: accessToken });
    let body: Record<string, string>;

    if (imageUrl && typeof imageUrl === 'string') {
      // Post com foto (URL pública)
      endpoint = `${FB_GRAPH}/${pageId}/photos`;
      body = { url: imageUrl, message, published: 'true', access_token: accessToken };
    } else {
      // Post de texto/link
      endpoint = `${FB_GRAPH}/${pageId}/feed`;
      body = { message, access_token: accessToken };
    }

    const fbRes = await fetch(imageUrl ? endpoint : `${endpoint}?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await fbRes.json()) as any;

    if (!fbRes.ok || data.error) {
      throw new Error(data.error?.message ?? `Facebook API error: ${fbRes.status}`);
    }

    return res.status(200).json({
      success: true,
      postId: data.id ?? data.post_id,
      permalink: `https://www.facebook.com/${data.id ?? data.post_id}`,
    });
  } catch (e: any) {
    console.error('Facebook publish error:', e);
    return res.status(502).json({ success: false, error: e.message });
  }
}
