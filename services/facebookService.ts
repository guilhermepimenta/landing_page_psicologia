/**
 * Serviço frontend para publicar posts na Página do Facebook
 * via a Vercel Function /api/facebook.
 */

export interface FacebookPublishResult {
  postId: string;
  permalink: string;
}

const API_URL = '/api/facebook';

export const isDevMode = import.meta.env.DEV;

export async function publishToFacebook(
  message: string,
  imageUrl?: string,
): Promise<FacebookPublishResult> {
  if (isDevMode) {
    throw new Error('__dev_mode__');
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, imageUrl }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }

  return { postId: data.postId, permalink: data.permalink };
}
