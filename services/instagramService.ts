export interface InstagramPublishResult {
  instagramPostId: string;
  instagramPermalink: string;
}

export async function publishToInstagram(
  imageUrls: string[],
  caption: string,
): Promise<InstagramPublishResult> {
  const response = await fetch('/api/instagram/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrls, caption }),
  });

  const data = await response.json() as any;

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Falha ao publicar no Instagram');
  }

  return {
    instagramPostId: data.instagramPostId,
    instagramPermalink: data.instagramPermalink,
  };
}

export async function getInstagramPost(postId: string) {
  const response = await fetch(`/api/instagram?id=${encodeURIComponent(postId)}`);
  const data = await response.json() as any;

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Falha ao buscar post do Instagram');
  }

  return data;
}
