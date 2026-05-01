import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export type TrendFormat = 'post' | 'carrossel' | 'reels';

export interface TrendSuggestion {
  topic: string;
  format: TrendFormat;
  rationale: string;
  angle: string;
  trendSource: string;
}

export interface TrendScoutResult {
  suggestions: TrendSuggestion[];
  scannedAt: Date;
}

const SCOUT_PROMPT = `Você é um agente de inteligência de conteúdo especializado em psicologia no Instagram Brasil.

Sua tarefa é fazer uma varredura em tempo real e retornar sugestões de conteúdo altamente relevantes para a Dra. Fernanda Abreu Mangia, neuropsicóloga em Niterói e Nova Friburgo (RJ), com foco em TDAH, avaliação neuropsicológica, ansiedade e saúde mental.

EXECUTE as seguintes pesquisas:
1. Quais temas de saúde mental e psicologia estão em alta AGORA no Brasil (últimos 7 dias) — Google Trends BR, portais como Mind, Psicologia Viva, Veja Saúde
2. O que os maiores perfis de psicologia do Instagram Brasil estão postando com mais engajamento recentemente (ex: @psicodelicia, @eu_sem_fronteiras, @praticamentepsico, @rodrigopsiquiatra)
3. Vídeos de psicologia com mais visualizações no YouTube Brasil nos últimos 7 dias
4. Notícias e eventos recentes que gerem pauta de saúde mental (campanhas, pesquisas divulgadas, casos virais)

Com base nessa pesquisa, sugira EXATAMENTE 5 temas para o Instagram da Dra. Fernanda. Para cada sugestão considere:
- Relevância atual (está em alta agora, não é tema genérico atemporal)
- Ângulo diferenciado pela perspectiva neuropsicológica dela
- Formato ideal para o Instagram no momento (reels tem mais alcance orgânico, carrossel tem mais salvamentos)

Retorne APENAS este JSON válido (sem texto antes ou depois):
{
  "suggestions": [
    {
      "topic": "tema exato do conteúdo",
      "format": "post" ou "carrossel" ou "reels",
      "rationale": "por que esse tema está em alta agora — cite a fonte específica",
      "angle": "como Fernanda pode abordar com sua perspectiva de neuropsicóloga",
      "trendSource": "fonte da tendência (ex: 'Viral no YouTube', 'Trending no Instagram BR', 'Google Trends BR')"
    }
  ]
}`;

export const runTrendScout = async (): Promise<TrendScoutResult> => {
  const response = await genAI.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: SCOUT_PROMPT,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Agente não retornou JSON válido');

  const parsed = JSON.parse(jsonMatch[0]);

  const suggestions: TrendSuggestion[] = (parsed.suggestions ?? []).map((s: Record<string, string>) => ({
    topic: s.topic ?? '',
    format: (['post', 'carrossel', 'reels'].includes(s.format) ? s.format : 'carrossel') as TrendFormat,
    rationale: s.rationale ?? '',
    angle: s.angle ?? '',
    trendSource: s.trendSource ?? '',
  }));

  return { suggestions, scannedAt: new Date() };
};
