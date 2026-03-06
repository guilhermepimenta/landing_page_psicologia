import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export type ContentChannel = 'Instagram' | 'GMB' | 'Blog' | 'Email';
export type ContentTone = 'informativo' | 'empático' | 'educativo' | 'motivacional';

export interface GeneratedContent {
  title: string;
  content: string;
  hashtags: string[];
  channel: ContentChannel;
}

const SYSTEM_CONTEXT = `Você é um especialista em marketing de saúde mental para a Dra. Fernanda Abreu Mangia, 
neuropsicóloga em Niterói e Nova Friburgo (RJ). Ela realiza avaliações neuropsicológicas, atende casos de 
TDAH, dificuldades de aprendizagem e saúde mental no trabalho. 
REGRAS: Linguagem clara e acessível. Nunca fazer diagnósticos. Sempre orientar buscar profissional. 
CRP sempre citado. Confidencialidade garantida. Não prometer curas. Respeitar resoluções do CFP.`;

const buildPrompt = (topic: string, channel: ContentChannel, tone: ContentTone): string => {
  const tones = {
    informativo: 'informativo e claro, com dados e explicações objetivas',
    empático: 'empático e acolhedor, mostrando compreensão e humanidade',
    educativo: 'educativo e didático, explicando passo a passo de forma simples',
    motivacional: 'motivacional e inspirador, encorajando a buscar ajuda profissional',
  };

  const formats: Record<ContentChannel, string> = {
    Instagram: `Post para Instagram (máximo 2200 caracteres). 
              Inclua: gancho inicial forte na primeira linha, 3-5 parágrafos curtos, call-to-action no final.
              Retorne um JSON com: {"title": "título do post", "content": "texto completo", "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"]}`,

    GMB: `Post para Google Meu Negócio (máximo 1500 caracteres).
          Texto direto, foco local (Niterói/Nova Friburgo), mencione agendamento.
          Retorne um JSON com: {"title": "título da publicação", "content": "texto completo", "hashtags": []}`,

    Blog: `Artigo de blog SEO-friendly (800-1200 palavras).
           Inclua: H1 atraente, introdução, 3-4 seções com subtítulos (H2), conclusão com CTA.
           Retorne um JSON com: {"title": "título SEO do artigo", "content": "texto completo com marcação ** para negrito", "hashtags": ["palavra-chave1", "palavra-chave2"]}`,

    Email: `Newsletter por e-mail (máximo 600 palavras).
            Inclua: assunto impactante, saudação personalizada, conteúdo de valor, CTA claro, assinatura.
            Retorne um JSON com: {"title": "assunto do e-mail", "content": "corpo completo do e-mail", "hashtags": []}`,
  };

  return `${SYSTEM_CONTEXT}

Crie um conteúdo de marketing para o seguinte tema: "${topic}"

Tom desejado: ${tones[tone]}
Canal: ${channel}

${formats[channel]}

IMPORTANTE: Retorne APENAS o JSON válido, sem texto adicional antes ou depois.`;
};

export const generateContent = async (
  topic: string,
  channel: ContentChannel,
  tone: ContentTone
): Promise<GeneratedContent> => {
  const prompt = buildPrompt(topic, channel, tone);

  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  const text = response.text ?? '';

  // Extrair JSON da resposta (remover possíveis blocos de código)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Resposta da IA não contém JSON válido');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    title: parsed.title ?? topic,
    content: parsed.content ?? text,
    hashtags: parsed.hashtags ?? [],
    channel,
  };
};
