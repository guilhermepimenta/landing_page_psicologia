import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export type ContentChannel = 'Instagram' | 'GMB' | 'Blog' | 'Email';
export type InstagramFormat = 'post' | 'carrossel' | 'reels';
export type ContentTone = 'informativo' | 'empático' | 'educativo' | 'motivacional';

export interface GeneratedContent {
  title: string;
  content: string;
  hashtags: string[];
  channel: ContentChannel;
  format?: InstagramFormat;
}

const SYSTEM_CONTEXT = `Você é um especialista em marketing de saúde mental para a Dra. Fernanda Abreu Mangia,
neuropsicóloga em Niterói e Nova Friburgo (RJ). Ela realiza avaliações neuropsicológicas, atende casos de
TDAH, dificuldades de aprendizagem e saúde mental no trabalho.
REGRAS: Linguagem clara e acessível. Nunca fazer diagnósticos. Sempre orientar buscar profissional.
CRP sempre citado. Confidencialidade garantida. Não prometer curas. Respeitar resoluções do CFP.`;

const TONE_LABELS: Record<ContentTone, string> = {
  informativo: 'informativo e claro, com dados e explicações objetivas',
  empático: 'empático e acolhedor, mostrando compreensão e humanidade',
  educativo: 'educativo e didático, explicando passo a passo de forma simples',
  motivacional: 'motivacional e inspirador, encorajando a buscar ajuda profissional',
};

const buildInstagramPrompt = (topic: string, tone: ContentTone, format: InstagramFormat): string => {
  const formats: Record<InstagramFormat, string> = {
    post: `Post para Instagram (máximo 2200 caracteres).
Inclua: gancho inicial forte na primeira linha, 3-5 parágrafos curtos, call-to-action no final.
Retorne um JSON com: {"title": "título do post", "content": "texto completo", "hashtags": ["tag1","tag2","tag3","tag4","tag5"]}`,

    carrossel: `Roteiro de carrossel para Instagram com 7 a 9 slides.
Slide 1 (capa): título/gancho impactante — deve parar o scroll.
Slides 2 a N-1: um tópico por slide, texto curto (máximo 3 linhas por slide), use linguagem direta.
Slide final: call-to-action + menção ao perfil @fernandamangiaoficial.
Retorne um JSON com: {"title": "título da capa (slide 1)", "content": "SLIDE 1: ...\nSLIDE 2: ...\nSLIDE 3: ...", "hashtags": ["tag1","tag2","tag3","tag4","tag5"]}`,

    reels: `Roteiro de Reels para Instagram (15 a 30 segundos).
Hook (0–3s): frase de impacto que aparece na tela ou é dita em voz — deve gerar curiosidade imediata.
Desenvolvimento (3–25s): 3 a 4 pontos rápidos e visuais, um por cena.
CTA final (25–30s): chamada para ação clara (ex: salve, comente, agende).
Legenda sugerida: texto para a legenda do Reel com hashtags separados.
Retorne um JSON com: {"title": "hook inicial (frase dos primeiros 3s)", "content": "ROTEIRO:\nHook: ...\nDesenvolvimento:\n- ...\n- ...\nCTA: ...\n\nLEGENDA SUGERIDA:\n...", "hashtags": ["tag1","tag2","tag3","tag4","tag5"]}`,
  };

  return `${SYSTEM_CONTEXT}

Crie um conteúdo de marketing para o seguinte tema: "${topic}"
Tom desejado: ${TONE_LABELS[tone]}
Canal: Instagram — Formato: ${format}

${formats[format]}

IMPORTANTE: Retorne APENAS o JSON válido, sem texto adicional antes ou depois.`;
};

const buildChannelPrompt = (topic: string, channel: Exclude<ContentChannel, 'Instagram'>, tone: ContentTone): string => {
  const formats: Record<Exclude<ContentChannel, 'Instagram'>, string> = {
    GMB: `Post para Google Meu Negócio (máximo 1500 caracteres).
Texto direto, foco local (Niterói/Nova Friburgo), mencione agendamento.
Retorne um JSON com: {"title": "título da publicação", "content": "texto completo", "hashtags": []}`,

    Blog: `Artigo de blog SEO-friendly (800–1200 palavras).
Inclua: H1 atraente, introdução, 3–4 seções com subtítulos (H2), conclusão com CTA.
Retorne um JSON com: {"title": "título SEO do artigo", "content": "texto completo com ** para negrito", "hashtags": ["palavra-chave1","palavra-chave2"]}`,

    Email: `Newsletter por e-mail (máximo 600 palavras).
Inclua: assunto impactante, saudação personalizada, conteúdo de valor, CTA claro, assinatura.
Retorne um JSON com: {"title": "assunto do e-mail", "content": "corpo completo do e-mail", "hashtags": []}`,
  };

  return `${SYSTEM_CONTEXT}

Crie um conteúdo de marketing para o seguinte tema: "${topic}"
Tom desejado: ${TONE_LABELS[tone]}
Canal: ${channel}

${formats[channel]}

IMPORTANTE: Retorne APENAS o JSON válido, sem texto adicional antes ou depois.`;
};

export const generateContent = async (
  topic: string,
  channel: ContentChannel,
  tone: ContentTone,
  instagramFormat?: InstagramFormat
): Promise<GeneratedContent> => {
  const prompt =
    channel === 'Instagram'
      ? buildInstagramPrompt(topic, tone, instagramFormat ?? 'post')
      : buildChannelPrompt(topic, channel as Exclude<ContentChannel, 'Instagram'>, tone);

  const response = await genAI.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: prompt,
  });

  const text = response.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido');

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    title: parsed.title ?? topic,
    content: parsed.content ?? text,
    hashtags: parsed.hashtags ?? [],
    channel,
    format: channel === 'Instagram' ? (instagramFormat ?? 'post') : undefined,
  };
};
