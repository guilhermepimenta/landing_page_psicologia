import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { getAdminDb } from './lib/firebaseAdmin.js';

type Channel = 'Instagram' | 'GMB' | 'Blog' | 'Email';

interface SuggestionPayload {
  topic: string;
  channel: Channel;
  bestDay: string;
  bestHour: string;
  postFormat: string;
  rationale: string;
  cta: string;
  confidence: number;
  source: 'ai' | 'heuristic';
  generatedAt: string;
}

interface PostLite {
  title: string;
  channel: Channel;
  date: Date;
  engagement: number;
  status: string;
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 60;
  return Math.max(30, Math.min(95, Math.round(value)));
}

async function getRecentPublishedPosts(limitCount = 120): Promise<PostLite[]> {
  const db = getAdminDb();
  const snap = await db.collection('posts').orderBy('date', 'desc').limit(limitCount).get();

  const posts: PostLite[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const date = toDate(data.date);
    if (!date) continue;

    posts.push({
      title: String(data.title ?? 'Sem titulo'),
      channel: (data.channel ?? 'Instagram') as Channel,
      date,
      engagement: Number(data.engagement ?? 0),
      status: String(data.status ?? ''),
    });
  }

  return posts.filter((p) => p.status === 'published');
}

function buildHeuristicSuggestion(posts: PostLite[]): SuggestionPayload {
  const recent = posts.slice(0, 40);

  const byChannel: Record<Channel, { total: number; count: number }> = {
    Instagram: { total: 0, count: 0 },
    GMB: { total: 0, count: 0 },
    Blog: { total: 0, count: 0 },
    Email: { total: 0, count: 0 },
  };

  const dayHourMap: Record<string, { total: number; count: number }> = {};
  for (const post of recent) {
    byChannel[post.channel].total += post.engagement;
    byChannel[post.channel].count += 1;

    const day = DAY_NAMES[post.date.getDay()];
    const hour = String(post.date.getHours()).padStart(2, '0');
    const key = `${day} ${hour}:00`;
    if (!dayHourMap[key]) dayHourMap[key] = { total: 0, count: 0 };
    dayHourMap[key].total += post.engagement;
    dayHourMap[key].count += 1;
  }

  const bestChannel = (Object.entries(byChannel) as Array<[Channel, { total: number; count: number }]>).sort((a, b) => {
    const avgA = a[1].count > 0 ? a[1].total / a[1].count : 0;
    const avgB = b[1].count > 0 ? b[1].total / b[1].count : 0;
    return avgB - avgA;
  })[0]?.[0] ?? 'Instagram';

  const bestSlot = Object.entries(dayHourMap).sort((a, b) => {
    const avgA = a[1].count > 0 ? a[1].total / a[1].count : 0;
    const avgB = b[1].count > 0 ? b[1].total / b[1].count : 0;
    return avgB - avgA;
  })[0]?.[0] ?? 'Quinta 10:00';

  const [bestDay, bestHour] = bestSlot.split(' ');

  return {
    topic: 'Sinais de sobrecarga mental e quando procurar avaliacao neuropsicologica',
    channel: bestChannel,
    bestDay,
    bestHour: bestHour ?? '10:00',
    postFormat: bestChannel === 'Instagram' ? 'Carrossel educativo (5 cards)' : 'Post educativo com CTA',
    rationale: `Nos ultimos posts, ${bestChannel} teve melhor media de engajamento e o horario ${bestSlot} concentrou os melhores resultados.`,
    cta: 'Convide para agendar avaliacao pelo WhatsApp/contato da landing page.',
    confidence: clampConfidence(65 + Math.min(recent.length, 30) * 0.6),
    source: 'heuristic',
    generatedAt: new Date().toISOString(),
  };
}

function parseAiJson(text: string): Partial<SuggestionPayload> | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Partial<SuggestionPayload>;
  } catch {
    return null;
  }
}

async function buildAiSuggestion(base: SuggestionPayload, posts: PostLite[]): Promise<SuggestionPayload> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return base;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const compactPosts = posts.slice(0, 18).map((p) => ({
      title: p.title,
      channel: p.channel,
      date: p.date.toISOString().slice(0, 10),
      hour: p.date.getHours(),
      engagement: p.engagement,
    }));

    const prompt = `Voce e estrategista de marketing para clinica de psicologia/neuropsicologia.
Com base nos dados abaixo, gere uma unica sugestao de proximo conteudo.

BASE_HEURISTICA:\n${JSON.stringify(base)}
POSTS_RECENTES:\n${JSON.stringify(compactPosts)}

Retorne APENAS JSON valido neste formato:
{
  "topic": "...",
  "channel": "Instagram|GMB|Blog|Email",
  "bestDay": "Segunda|Terca|Quarta|Quinta|Sexta|Sabado|Domingo",
  "bestHour": "HH:MM",
  "postFormat": "...",
  "rationale": "...",
  "cta": "...",
  "confidence": 0-100
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const parsed = parseAiJson(response.text ?? '');
    if (!parsed) return base;

    const channel = (['Instagram', 'GMB', 'Blog', 'Email'].includes(String(parsed.channel))
      ? parsed.channel
      : base.channel) as Channel;

    return {
      topic: String(parsed.topic ?? base.topic),
      channel,
      bestDay: String(parsed.bestDay ?? base.bestDay),
      bestHour: String(parsed.bestHour ?? base.bestHour),
      postFormat: String(parsed.postFormat ?? base.postFormat),
      rationale: String(parsed.rationale ?? base.rationale),
      cta: String(parsed.cta ?? base.cta),
      confidence: clampConfidence(Number(parsed.confidence ?? base.confidence)),
      source: 'ai',
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return base;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const posts = await getRecentPublishedPosts(120);
    const heuristic = buildHeuristicSuggestion(posts);
    const suggestion = await buildAiSuggestion(heuristic, posts);

    return res.status(200).json({
      success: true,
      suggestion,
      diagnostics: {
        totalPublishedPostsAnalyzed: posts.length,
        source: suggestion.source,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: String(e?.message ?? e) });
  }
}
