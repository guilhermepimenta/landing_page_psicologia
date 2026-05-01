import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

// Modelo principal: gemini-2.5-flash — melhor custo-benefício, suporta pensamento estruturado
const MAIN_MODEL   = 'gemini-2.5-flash';
const FAST_MODEL   = 'gemini-2.0-flash';

export type ContentChannel = 'Instagram' | 'GMB' | 'Blog' | 'Email' | 'Facebook';
export type InstagramFormat = 'post' | 'carrossel' | 'reels';
export type ContentTone = 'informativo' | 'empático' | 'educativo' | 'motivacional';

export interface GeneratedContent {
  title: string;
  content: string;
  hashtags: string[];
  channel: ContentChannel;
  format?: InstagramFormat;
}

// Contexto imutável da profissional — injetado em todos os prompts
const SYSTEM_CONTEXT = `Você é um especialista em marketing de saúde mental para a Dra. Fernanda Abreu Mangia,
neuropsicóloga em Niterói e Nova Friburgo (RJ). Ela realiza avaliações neuropsicológicas, atende casos de
TDAH, dificuldades de aprendizagem e saúde mental no trabalho.
REGRAS ÉTICAS: Linguagem clara e acessível. Nunca fazer diagnósticos. Sempre orientar a buscar profissional.
CRP sempre citado quando pertinente. Confidencialidade garantida. Não prometer curas. Respeitar resoluções do CFP.`;

const TONE_LABELS: Record<ContentTone, string> = {
  informativo:  'informativo e claro, com dados e explicações objetivas, sem jargão técnico',
  empático:     'empático e acolhedor, mostrando compreensão e humanidade, na primeira pessoa do plural',
  educativo:    'educativo e didático, explicando passo a passo de forma simples, com exemplos práticos',
  motivacional: 'motivacional e encorajador, que inspira a buscar ajuda profissional sem criar urgência artificial',
};

// ─────────────────────────────────────────────
// Prompts Instagram — regras reais da plataforma
// ─────────────────────────────────────────────

const INSTAGRAM_POST_RULES = `REGRAS DO INSTAGRAM POST (obedeça rigorosamente):
- Total da legenda: máximo 2200 caracteres
- Primeiros 125 caracteres (antes do "ver mais"): hook obrigatório — frase que para o scroll, sem hashtags aqui
- Estrutura: hook → 3 parágrafos curtos (máx 3 linhas cada) → CTA final
- Use 1 emoji por parágrafo, com moderação — nunca mais de 1 seguido
- Quebre linhas a cada parágrafo (linha em branco entre blocos)
- CTA final: uma ação clara (ex: "Salve esse post 💾", "Agende sua avaliação — link na bio")
- Hashtags: 5 a 8, separadas por espaço, NO FINAL da legenda (não misture com o texto)
- Não use ponto final em parágrafos — use reticências ou travessão para pausas`;

const INSTAGRAM_CARROSSEL_RULES = `REGRAS DO CARROSSEL (obedeça rigorosamente):
- Total de slides: 7 a 9
- Slide 1 (CAPA): máximo 6 palavras — deve parar o scroll. Sem subtítulo. Ex: "Seu filho tem TDAH?"
- Slides 2 a penúltimo: UM tópico por slide. Título em 1 linha + explicação em máx 2 linhas. Use linguagem direta.
- Último slide: CTA claro + "@fernandamangiaoficial" mencionado. Ex: "Agende sua avaliação 👉 link na bio"
- Cada slide deve fazer sentido sozinho (o usuário pode ver fora de ordem)
- Hashtags: 5 a 8, só no campo "hashtags" do JSON — não aparecem nos slides`;

const INSTAGRAM_REELS_RULES = `REGRAS DO ROTEIRO DE REELS (obedeça rigorosamente):
- Duração total: 15 a 30 segundos
- Hook (0–3s): UMA frase de impacto dita ou exibida na tela — gera curiosidade imediata. Ex: "Você está ignorando um sinal de alerta do seu cérebro"
- Desenvolvimento (3–22s): 3 pontos RÁPIDOS, uma frase por ponto, ordem crescente de valor
- CTA (22–30s): chamada direta (ex: "Salve pra não esquecer", "Comente TDAH e te mando o link")
- Legenda do Reel: 1 parágrafo curto (máx 150 chars) + hashtags no final
- Hashtags: 5 a 8`;

const buildInstagramPrompt = (topic: string, tone: ContentTone, format: InstagramFormat, recentTopics: string[]): string => {
  const avoidNote = recentTopics.length > 0
    ? `\nTemas recentes JÁ publicados (EVITE repetir): ${recentTopics.join(', ')}.`
    : '';

  const formatRules: Record<InstagramFormat, string> = {
    post: `${INSTAGRAM_POST_RULES}

Retorne APENAS JSON válido:
{"title": "hook inicial (primeiros 125 chars)", "content": "legenda completa sem hashtags", "hashtags": ["tag1","tag2","tag3","tag4","tag5"]}`,

    carrossel: `${INSTAGRAM_CARROSSEL_RULES}

Retorne APENAS JSON válido:
{"title": "texto da capa (slide 1, máx 6 palavras)", "content": "SLIDE 1: [capa]\\nSLIDE 2: [título] | [explicação]\\nSLIDE 3: ...\\nSLIDE FINAL: [CTA + @menção]", "hashtags": ["tag1","tag2","tag3","tag4","tag5"]}`,

    reels: `${INSTAGRAM_REELS_RULES}

Retorne APENAS JSON válido:
{"title": "hook (0-3s)", "content": "ROTEIRO:\\nHook (0-3s): ...\\nPonto 1 (3-10s): ...\\nPonto 2 (10-17s): ...\\nPonto 3 (17-22s): ...\\nCTA (22-30s): ...\\n\\nLEGENDA:\\n[1 parágrafo curto]", "hashtags": ["tag1","tag2","tag3","tag4","tag5"]}`,
  };

  return `${SYSTEM_CONTEXT}
${avoidNote}

Tema: "${topic}"
Tom: ${TONE_LABELS[tone]}
Canal: Instagram — Formato: ${format}

${formatRules[format]}

IMPORTANTE: Retorne APENAS o JSON válido, sem texto antes ou depois.`;
};

// ─────────────────────────────────────────────
// Prompts outros canais
// ─────────────────────────────────────────────

const buildChannelPrompt = (
  topic: string,
  channel: Exclude<ContentChannel, 'Instagram'>,
  tone: ContentTone,
  recentTopics: string[],
): string => {
  const avoidNote = recentTopics.length > 0
    ? `\nTemas recentes JÁ publicados nesse canal (EVITE repetir): ${recentTopics.join(', ')}.`
    : '';

  const formats: Record<Exclude<ContentChannel, 'Instagram'>, string> = {
    GMB: `Post para Google Meu Negócio (máximo 1500 caracteres).
Foco local: mencione Niterói e/ou Nova Friburgo. Inclua uma chamada para agendamento.
Tom direto e profissional. Sem hashtags.
Retorne JSON: {"title": "título da publicação (máx 60 chars)", "content": "texto completo", "hashtags": []}`,

    Blog: `Artigo de blog SEO-friendly (800 a 1000 palavras).
Estrutura obrigatória: H1 → introdução (2 parágrafos) → 3 seções com subtítulo H2 → conclusão com CTA para agendar avaliação.
Use linguagem acessível. Inclua perguntas retóricas para engajar o leitor.
Retorne JSON: {"title": "título H1 com palavra-chave principal", "content": "artigo completo usando **texto** para negrito e ## Título para H2", "hashtags": ["palavra-chave-1","palavra-chave-2","palavra-chave-3"]}`,

    Email: `Newsletter por e-mail (máximo 500 palavras).
Estrutura: assunto impactante (máx 50 chars, sem spam triggers) → saudação calorosa → conteúdo de valor (2 parágrafos) → 1 dica prática → CTA claro para agendar → assinatura "Fernanda Mangia | Neuropsicóloga".
Retorne JSON: {"title": "assunto do e-mail (máx 50 chars)", "content": "corpo completo do e-mail", "hashtags": []}`,

    Facebook: `Post para Página do Facebook (150 a 350 palavras — não ultrapasse).
Estrutura: abertura que gera identificação (1 linha) → 2 parágrafos de valor → pergunta aberta no final para estimular comentários → CTA.
Use parágrafos curtos. Máx 2 emojis no post inteiro. Linguagem conversacional e empática.
Retorne JSON: {"title": "tema resumido (máx 60 chars)", "content": "texto completo do post", "hashtags": []}`,
  };

  return `${SYSTEM_CONTEXT}
${avoidNote}

Tema: "${topic}"
Tom: ${TONE_LABELS[tone]}
Canal: ${channel}

${formats[channel]}

IMPORTANTE: Retorne APENAS o JSON válido, sem texto antes ou depois.`;
};

// ─────────────────────────────────────────────
// Adaptação de conteúdo entre canais
// ─────────────────────────────────────────────

export interface AdaptedContent {
  channel: ContentChannel;
  title: string;
  content: string;
  hashtags: string[];
}

const ADAPT_FORMATS: Record<ContentChannel, string> = {
  Instagram: `Post para Instagram (máximo 2200 caracteres).
Hook nos primeiros 125 chars. Parágrafos curtos. 1 emoji por parágrafo. CTA no final. 5 a 8 hashtags separadas.
Retorne JSON: {"title": "hook inicial", "content": "legenda sem hashtags", "hashtags": ["tag1","tag2","tag3","tag4","tag5"]}`,

  Facebook: `Post para Página do Facebook (150 a 350 palavras).
Linguagem conversacional. Pergunta aberta no final. Máx 2 emojis. Sem hashtags.
Retorne JSON: {"title": "tema resumido", "content": "texto completo", "hashtags": []}`,

  Blog: `Artigo de blog SEO-friendly (800 a 1000 palavras).
H1 com palavra-chave, introdução, 3 seções H2, conclusão com CTA.
Retorne JSON: {"title": "título H1", "content": "artigo com **negrito** e ## H2", "hashtags": ["palavra-chave-1","palavra-chave-2"]}`,

  Email: `Newsletter por e-mail (máximo 500 palavras).
Assunto impactante (máx 50 chars), conteúdo de valor, CTA claro, assinatura da Fernanda.
Retorne JSON: {"title": "assunto (máx 50 chars)", "content": "corpo do e-mail", "hashtags": []}`,

  GMB: `Post para Google Meu Negócio (máximo 1500 caracteres).
Foco local (Niterói/Nova Friburgo). Mencione agendamento presencial ou online.
Retorne JSON: {"title": "título da publicação", "content": "texto completo", "hashtags": []}`,
};

export const adaptContent = async (
  sourceTitle: string,
  sourceContent: string,
  sourceChannel: ContentChannel,
  targetChannels: ContentChannel[],
): Promise<AdaptedContent[]> => {
  const results: AdaptedContent[] = [];

  await Promise.all(
    targetChannels.map(async (targetChannel) => {
      const prompt = `${SYSTEM_CONTEXT}

Conteúdo original criado para ${sourceChannel}:
TÍTULO: ${sourceTitle}
CONTEÚDO: ${sourceContent}

Adapte para ${targetChannel}, mantendo a essência mas adequando linguagem, tamanho e formato.

${ADAPT_FORMATS[targetChannel]}

IMPORTANTE: Retorne APENAS o JSON válido, sem texto antes ou depois.`;

      try {
        const response = await genAI.models.generateContent({
          model: FAST_MODEL,
          contents: prompt,
        });
        const text = response.text ?? '';
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return;
        const parsed = JSON.parse(match[0]);
        results.push({
          channel:  targetChannel,
          title:    parsed.title   ?? sourceTitle,
          content:  parsed.content ?? '',
          hashtags: parsed.hashtags ?? [],
        });
      } catch { /* ignora canais que falharem */ }
    }),
  );

  return results;
};

// ─────────────────────────────────────────────
// Campanha de posts em série
// ─────────────────────────────────────────────

export interface CampaignPost {
  title: string;
  content: string;
  hashtags: string[];
  dayOffset: number;
}

export interface CampaignResult {
  campaignTitle: string;
  posts: CampaignPost[];
}

export const generateCampaign = async (
  theme: string,
  channel: ContentChannel,
  tone: ContentTone,
  postCount: number = 5,
): Promise<CampaignResult> => {
  const offsets = [0, 2, 4, 7, 10, 14, 17].slice(0, postCount);
  const prompt = `${SYSTEM_CONTEXT}

Crie uma série de ${postCount} posts conectados para uma campanha temática no canal ${channel}.
Tema: "${theme}"
Tom: ${TONE_LABELS[tone]}

Narrativa progressiva obrigatória:
- Post 1: gancho/introdução — apresenta o tema com curiosidade
- Posts intermediários: subtemas diferentes, aprofundamento gradual
- Último post: conclusão + CTA para agendar avaliação

Cada post deve seguir as regras do canal ${channel}: tamanho correto, estrutura adequada, linguagem do canal.

Retorne APENAS JSON válido:
{
  "campaignTitle": "Nome da campanha",
  "posts": [
    {"title": "...", "content": "...", "hashtags": ["tag1","tag2","tag3","tag4","tag5"], "dayOffset": ${offsets[0]}},
    ${offsets.slice(1).map((d) => `{"title": "...", "content": "...", "hashtags": ["tag1","tag2","tag3","tag4","tag5"], "dayOffset": ${d}}`).join(',\n    ')}
  ]
}`;

  const response = await genAI.models.generateContent({
    model: MAIN_MODEL,
    contents: prompt,
  });

  const text = response.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    campaignTitle: parsed.campaignTitle ?? theme,
    posts: (parsed.posts ?? []).map((p: any, i: number) => ({
      title:     p.title     ?? `Post ${i + 1}`,
      content:   p.content   ?? '',
      hashtags:  p.hashtags  ?? [],
      dayOffset: p.dayOffset ?? offsets[i] ?? i * 2,
    })),
  };
};

// ─────────────────────────────────────────────
// Calendário editorial
// ─────────────────────────────────────────────

export interface EditorialSuggestion {
  date: string;
  theme: string;
  channel: ContentChannel;
  format: string;
  tone: ContentTone;
}

export const generateEditorialCalendar = async (
  month: number,
  year: number,
): Promise<EditorialSuggestion[]> => {
  const monthName  = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(year, month, 1));
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mm = String(month + 1).padStart(2, '0');

  const prompt = `${SYSTEM_CONTEXT}

Crie um calendário editorial para ${monthName} de ${year} para a Dra. Fernanda Mangia.
- Distribua em ~15 dias (3-4 por semana, evite sábado e domingo)
- Varie canais: Instagram, Facebook, Blog, Email, GMB
- Varie formatos: post, carrossel, reels, artigo, newsletter, atualizacao
- Temas: TDAH, ansiedade, neuropsicologia, avaliação psicológica, saúde mental no trabalho, dificuldades de aprendizagem, bem-estar
- Não repita tema + canal na mesma semana

Retorne APENAS JSON array:
[
  {"date": "${year}-${mm}-02", "theme": "...", "channel": "Instagram", "format": "post", "tone": "informativo"},
  ...
]
Use datas entre ${year}-${mm}-01 e ${year}-${mm}-${String(daysInMonth).padStart(2, '0')}.`;

  const response = await genAI.models.generateContent({
    model: FAST_MODEL,
    contents: prompt,
  });

  const text      = response.text ?? '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido');

  return JSON.parse(jsonMatch[0]);
};

// ─────────────────────────────────────────────
// Geração de hashtags
// ─────────────────────────────────────────────

export const generateHashtags = async (theme: string): Promise<string[]> => {
  const prompt = `${SYSTEM_CONTEXT}

Gere 25 hashtags para Instagram sobre: "${theme}"
Distribuição obrigatória:
- 8 amplas (>1M posts) — ex: saúdemental, psicologia
- 10 médias (100K–1M posts) — ex: neuropsicologia, tdahnainfancia
- 7 de nicho (<100K, específicas) — ex: avaliacaoneuropsicologica, niteroi

Sem o símbolo #. Apenas o texto. Sem espaços nas hashtags.
Retorne APENAS JSON array: ["hashtag1", "hashtag2", ...]`;

  const response = await genAI.models.generateContent({
    model: FAST_MODEL,
    contents: prompt,
  });

  const text = response.text ?? '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  return JSON.parse(jsonMatch[0]);
};

// ─────────────────────────────────────────────
// Geração principal de conteúdo (com contexto)
// ─────────────────────────────────────────────

export const generateContent = async (
  topic: string,
  channel: ContentChannel,
  tone: ContentTone,
  instagramFormat?: InstagramFormat,
  recentTopics: string[] = [],
): Promise<GeneratedContent> => {
  const prompt =
    channel === 'Instagram'
      ? buildInstagramPrompt(topic, tone, instagramFormat ?? 'post', recentTopics)
      : buildChannelPrompt(topic, channel as Exclude<ContentChannel, 'Instagram'>, tone, recentTopics);

  const response = await genAI.models.generateContent({
    model: MAIN_MODEL,
    contents: prompt,
  });

  const text = response.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Resposta da IA não contém JSON válido');

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    title:    parsed.title    ?? topic,
    content:  parsed.content  ?? text,
    hashtags: parsed.hashtags ?? [],
    channel,
    format: channel === 'Instagram' ? (instagramFormat ?? 'post') : undefined,
  };
};
