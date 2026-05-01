const ASPECT_RATIO_SIZES: Record<'1:1' | '9:16' | '16:9', { width: number; height: number }> = {
  '1:1':  { width: 1024, height: 1024 },
  '9:16': { width: 576,  height: 1024 },
  '16:9': { width: 1024, height: 576  },
};

// Fallback prompt genérico usado quando o prompt original falha
const FALLBACK_PROMPT = 'calming psychology therapy room, soft purple and blue tones, minimalist, no text, no faces, professional';

async function fetchWithRetry(url: string, attempts = 3, delayMs = 1200): Promise<Response> {
  let lastError: Error = new Error('Falha desconhecida');
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
  }
  throw lastError;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror   = reject;
    reader.readAsDataURL(blob);
  });
}

function buildPollinationsUrl(prompt: string, width: number, height: number): string {
  const seed = Math.floor(Math.random() * 1_000_000);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;
}

export async function generateImageFromPrompt(
  prompt: string,
  aspectRatio: '1:1' | '9:16' | '16:9' = '1:1',
): Promise<string> {
  const { width, height } = ASPECT_RATIO_SIZES[aspectRatio];

  // Tenta com o prompt original; se falhar 3x, tenta o fallback
  try {
    const res  = await fetchWithRetry(buildPollinationsUrl(prompt, width, height));
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  } catch {
    // Uma última tentativa com prompt simplificado
    const res  = await fetchWithRetry(buildPollinationsUrl(FALLBACK_PROMPT, width, height), 2, 1500);
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  }
}

export async function suggestImagePrompt(topic: string, format: string, channel: string): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

  // Contexto adicional por formato para prompts mais precisos
  const formatHints: Record<string, string> = {
    post:       'square composition, centered subject, strong single focal point',
    carrossel:  'clean layout, flat illustration style, easy to read at small size',
    reels:      'vertical 9:16 format, bold and dynamic, motion-suggestive',
    artigo:     'wide banner style, editorial photography feel',
    newsletter: 'warm and inviting, email-header appropriate, horizontal',
    atualizacao:'local Brazilian setting, professional context',
  };

  const formatHint = formatHints[format] ?? 'professional social media content';

  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `You are a creative director for a Brazilian neuropsychologist's social media (@fernandamangiaoficial).
Generate a precise English prompt for the Flux AI image generator.

Topic: "${topic}"
Format: ${format} (${formatHint})
Channel: ${channel}

Requirements:
- Professional, warm, calming mental health aesthetic
- NO text, NO letters, NO words in the image
- NO human faces — use silhouettes, objects, or abstract shapes
- Color palette: soft purples, blues, warm neutrals, whites
- Style: modern minimalist illustration or clean photography
- Suitable for a Brazilian professional audience
- Avoid medical clichés (no brain icons, no pills, no couches)

Return ONLY the English prompt. Max 200 characters. No quotes.`,
  });

  return response.text?.trim() ?? `Calming psychology concept, ${topic}, soft purple tones, minimalist, no text, no faces`;
}
