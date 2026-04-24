const ASPECT_RATIO_SIZES: Record<'1:1' | '9:16' | '16:9', { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '9:16': { width: 576, height: 1024 },
  '16:9': { width: 1024, height: 576 },
};

export async function generateImageFromPrompt(
  prompt: string,
  aspectRatio: '1:1' | '9:16' | '16:9' = '1:1',
): Promise<string> {
  const { width, height } = ASPECT_RATIO_SIZES[aspectRatio];
  const seed = Math.floor(Math.random() * 1000000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Erro ao gerar imagem');

  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function suggestImagePrompt(topic: string, format: string, channel: string): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `You are a creative director for a Brazilian psychologist's social media.
Generate a concise English prompt for an AI image generator to create a professional image.

Topic: "${topic}"
Format: ${format}
Channel: ${channel}

Requirements:
- Professional, warm, calming psychology/mental health aesthetic
- No text or faces — use abstract shapes, silhouettes, or objects
- Soft colors (purples, blues, warm neutrals)
- Modern minimalist illustration or photography style
- Suitable for a Brazilian professional audience

Return ONLY the English prompt, nothing else. Max 180 characters.`,
  });
  return response.text?.trim() ?? `Calming psychology concept, ${topic}, soft purple tones, minimalist, no text`;
}
