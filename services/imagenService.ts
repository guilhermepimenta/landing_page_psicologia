import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export async function generateImageFromPrompt(
  prompt: string,
  aspectRatio: '1:1' | '9:16' | '16:9' = '1:1',
): Promise<string> {
  const response = await genAI.models.generateImages({
    model: 'imagen-3.0-fast-generate-001',
    prompt,
    config: { numberOfImages: 1, aspectRatio },
  });
  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (!imageBytes) throw new Error('Nenhuma imagem gerada');
  return `data:image/png;base64,${imageBytes}`;
}

export async function suggestImagePrompt(topic: string, format: string, channel: string): Promise<string> {
  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `You are a creative director for a Brazilian psychologist's social media.
Generate a concise English prompt for Imagen 3 to create a professional image.

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
