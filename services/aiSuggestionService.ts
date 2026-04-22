import { GoogleGenAI } from '@google/genai';

export interface AISuggestion {
  topic: string;
  channel: 'Instagram' | 'GMB' | 'Blog' | 'Email';
  bestDay: string;
  bestHour: string;
  postFormat: string;
  rationale: string;
  cta: string;
  confidence: number;
  source: 'ai' | 'heuristic';
  generatedAt: string;
}

const SUGGESTION_PROMPT = `Você é um especialista em marketing digital para psicólogos no Brasil.
Gere uma sugestão de conteúdo semanal para a Dra. Fernanda Abreu Mangia, neuropsicóloga em Niterói e Nova Friburgo (RJ).
Áreas de atuação: TDAH, avaliação neuropsicológica, ansiedade, saúde mental no trabalho.

Retorne APENAS este JSON válido (sem texto antes ou depois):
{
  "topic": "tema específico e atual para o post desta semana",
  "channel": "Instagram",
  "bestDay": "Quarta-feira",
  "bestHour": "19h",
  "postFormat": "Carrossel educativo",
  "rationale": "justificativa de por que esse tema e esse horário fazem sentido agora",
  "cta": "chamada para ação recomendada",
  "confidence": 72,
  "source": "ai"
}`;

async function generateSuggestionWithGemini(): Promise<AISuggestion> {
  const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: SUGGESTION_PROMPT,
  });

  const text = response.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Gemini não retornou JSON válido');

  const parsed = JSON.parse(jsonMatch[0]);
  return { ...parsed, generatedAt: new Date().toISOString() } as AISuggestion;
}

export async function getAISuggestion(): Promise<AISuggestion> {
  // Em dev local, o Vite não executa serverless functions — usa Gemini diretamente
  if (import.meta.env.DEV) {
    return generateSuggestionWithGemini();
  }

  const res = await fetch('/api/analytics?mode=suggestion');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.success || !data.suggestion) {
    throw new Error(data?.error ?? 'Erro ao gerar sugestao inteligente');
  }

  return data.suggestion as AISuggestion;
}
