import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleGenAI } from '@google/genai';
import { getAdminDb } from './lib/firebaseAdmin.js';

/**
 * Vercel Serverless Function — chama a GA4 Data API com service account.
 *
 * Variáveis de ambiente necessárias no Vercel Dashboard:
 *   GA4_PROPERTY_ID       → ID da propriedade GA4 (ex: "123456789"), sem o prefixo "properties/"
 *   GA4_CLIENT_EMAIL      → client_email do JSON da service account
 *   GA4_PRIVATE_KEY       → private_key do JSON da service account (com \n literais)
 *
 * Modos disponíveis:
 *   GET /api/analytics             → dados históricos completos
 *   GET /api/analytics?mode=realtime  → usuários ativos agora (cache 60s)
 *   GET /api/analytics?mode=suggestion → sugestão de conteúdo via AI
 */

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DAY_NAMES = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
const DEVICE_LABELS: Record<string, string> = { mobile: 'Celular', desktop: 'Desktop', tablet: 'Tablet' };

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

async function getSuggestionResponse() {
  const posts = await getRecentPublishedPosts(120);
  const heuristic = buildHeuristicSuggestion(posts);
  const suggestion = await buildAiSuggestion(heuristic, posts);
  return {
    success: true,
    suggestion,
    diagnostics: {
      totalPublishedPostsAnalyzed: posts.length,
      source: suggestion.source,
    },
  };
}

function getClient() {
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('GA4_CLIENT_EMAIL ou GA4_PRIVATE_KEY não configurados');
  }

  return new BetaAnalyticsDataClient({
    credentials: { client_email: clientEmail, private_key: privateKey },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // --- Modo: sugestão de conteúdo ---
  if (req.query.mode === 'suggestion') {
    try {
      const payload = await getSuggestionResponse();
      return res.status(200).json(payload);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: String(error?.message ?? error) });
    }
  }

  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    return res.status(500).json({ error: 'GA4_PROPERTY_ID não configurado' });
  }

  let analyticsClient: BetaAnalyticsDataClient;
  try {
    analyticsClient = getClient();
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }

  const property = `properties/${propertyId}`;

  // --- Modo: usuários em tempo real (últimos 30 min) ---
  if (req.query.mode === 'realtime') {
    try {
      const [rtResponse] = await analyticsClient.runRealtimeReport({
        property,
        metrics: [{ name: 'activeUsers' }],
      });
      const activeUsers = Number(rtResponse.rows?.[0]?.metricValues?.[0]?.value ?? 0);
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
      return res.status(200).json({ activeUsers });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // --- Modo principal: dados históricos completos ---
  try {
    // Todas as 7 chamadas em paralelo para máxima performance
    const [
      [weeklyResponse],
      [monthlyResponse],
      [thisMonth],
      [lastMonth],
      [topPagesResponse],
      [deviceResponse],
      [sourcesResponse],
    ] = await Promise.all([
      // 1. Engajamento semanal (7 dias, por canal)
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }, { name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'engagedSessions' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),
      // 2. Tendência mensal de sessões/conversões (6 meses)
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate: '180daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'yearMonth' }],
        metrics: [{ name: 'sessions' }, { name: 'conversions' }],
        orderBys: [{ dimension: { dimensionName: 'yearMonth' } }],
      }),
      // 3. Métricas do mês atual (8 métricas)
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'engagementRate' },
          { name: 'totalUsers' },
          { name: 'conversions' },
          { name: 'sessionConversionRate' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'newUsers' },
        ],
      }),
      // 4. Métricas do mês anterior (para comparação)
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate: '60daysAgo', endDate: '31daysAgo' }],
        metrics: [
          { name: 'engagementRate' },
          { name: 'totalUsers' },
          { name: 'conversions' },
          { name: 'sessionConversionRate' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'newUsers' },
        ],
      }),
      // 5. Top 6 páginas mais visitadas (30 dias)
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 6,
      }),
      // 6. Sessões por dispositivo (30 dias)
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
      // 7. Fontes de tráfego (30 dias)
      analyticsClient.runReport({
        property,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }, { name: 'conversions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 6,
      }),
    ]);

    // --- Processar engajamento semanal ---
    const weekMap: Record<string, { Instagram: number; GMB: number; Blog: number; Email: number }> = {};
    for (const row of weeklyResponse.rows ?? []) {
      const dateStr = row.dimensionValues?.[0]?.value ?? '';
      const channel = row.dimensionValues?.[1]?.value ?? '';
      const sessions = Number(row.metricValues?.[0]?.value ?? 0);

      const d = new Date(`${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`);
      const dia = DAYS_PT[d.getDay()];

      if (!weekMap[dia]) weekMap[dia] = { Instagram: 0, GMB: 0, Blog: 0, Email: 0 };

      const ch = channel.toLowerCase();
      if (ch.includes('organic social') || ch.includes('instagram')) weekMap[dia].Instagram += sessions;
      else if (ch.includes('organic search') || ch.includes('gmb')) weekMap[dia].GMB += sessions;
      else if (ch.includes('organic') || ch.includes('referral')) weekMap[dia].Blog += sessions;
      else if (ch.includes('email')) weekMap[dia].Email += sessions;
      else weekMap[dia].Blog += sessions;
    }
    const weeklyEngagement = Object.entries(weekMap).map(([dia, vals]) => ({ dia, ...vals }));

    // --- Processar tendência mensal ---
    const monthlyTrend = (monthlyResponse.rows ?? []).slice(-6).map(row => {
      const ym = row.dimensionValues?.[0]?.value ?? '';
      const monthIdx = parseInt(ym.slice(4, 6), 10) - 1;
      return {
        mes: MONTHS_PT[monthIdx] ?? ym,
        leads: Number(row.metricValues?.[0]?.value ?? 0),
        conversoes: Number(row.metricValues?.[1]?.value ?? 0),
      };
    });

    // --- Processar métricas de resumo (8 métricas com comparação) ---
    const curr = thisMonth.rows?.[0]?.metricValues ?? [];
    const prev = lastMonth.rows?.[0]?.metricValues ?? [];

    const pct = (c: number, p: number) =>
      p === 0 ? 0 : Math.round(((c - p) / p) * 100 * 10) / 10;

    const engRate       = Math.round(Number(curr[0]?.value ?? 0) * 1000) / 10;
    const prevEngRate   = Math.round(Number(prev[0]?.value ?? 0) * 1000) / 10;
    const users         = Math.round(Number(curr[1]?.value ?? 0));
    const prevUsers     = Math.round(Number(prev[1]?.value ?? 0));
    const conversions   = Math.round(Number(curr[2]?.value ?? 0));
    const prevConversions = Math.round(Number(prev[2]?.value ?? 0));
    const convRate      = Math.round(Number(curr[3]?.value ?? 0) * 1000) / 10;
    const prevConvRate  = Math.round(Number(prev[3]?.value ?? 0) * 1000) / 10;
    const pageViews     = Math.round(Number(curr[4]?.value ?? 0));
    const prevPageViews = Math.round(Number(prev[4]?.value ?? 0));
    const avgDuration   = Math.round(Number(curr[5]?.value ?? 0));
    const prevAvgDuration = Math.round(Number(prev[5]?.value ?? 0));
    const bounceRate    = Math.round(Number(curr[6]?.value ?? 0) * 1000) / 10;
    const prevBounceRate = Math.round(Number(prev[6]?.value ?? 0) * 1000) / 10;
    const newUsers      = Math.round(Number(curr[7]?.value ?? 0));
    const prevNewUsers  = Math.round(Number(prev[7]?.value ?? 0));

    const summaryMetrics = [
      { metrica: 'taxa_engajamento', valor: engRate,    variacao: pct(engRate, prevEngRate) },
      { metrica: 'alcance_total',    valor: users,      variacao: pct(users, prevUsers) },
      { metrica: 'leads',            valor: conversions, variacao: pct(conversions, prevConversions) },
      { metrica: 'taxa_conversao',   valor: convRate,   variacao: pct(convRate, prevConvRate) },
      { metrica: 'visualizacoes',    valor: pageViews,  variacao: pct(pageViews, prevPageViews) },
      { metrica: 'duracao_media',    valor: avgDuration, variacao: pct(avgDuration, prevAvgDuration) },
      { metrica: 'taxa_rejeicao',    valor: bounceRate, variacao: pct(bounceRate, prevBounceRate) },
      { metrica: 'novos_usuarios',   valor: newUsers,   variacao: pct(newUsers, prevNewUsers) },
    ];

    // --- Processar top páginas ---
    const topPages = (topPagesResponse.rows ?? [])
      .filter(row => {
        const title = row.dimensionValues?.[0]?.value ?? '';
        return title.trim() !== '' && title !== '(not set)';
      })
      .slice(0, 5)
      .map(row => ({
        page: (row.dimensionValues?.[0]?.value ?? '').slice(0, 50),
        views: Number(row.metricValues?.[0]?.value ?? 0),
        sessions: Number(row.metricValues?.[1]?.value ?? 0),
      }));

    // --- Processar breakdown por dispositivo ---
    const deviceBreakdown = (deviceResponse.rows ?? []).map(row => ({
      device: DEVICE_LABELS[row.dimensionValues?.[0]?.value ?? ''] ?? row.dimensionValues?.[0]?.value ?? '',
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
    }));

    // --- Processar fontes de tráfego ---
    const trafficSources = (sourcesResponse.rows ?? []).map(row => ({
      source: row.dimensionValues?.[0]?.value ?? '',
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
      conversions: Number(row.metricValues?.[1]?.value ?? 0),
    }));

    // Cache de 15 minutos — dados mais frescos
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300');

    return res.status(200).json({
      weeklyEngagement,
      monthlyTrend,
      summaryMetrics,
      topPages,
      deviceBreakdown,
      trafficSources,
    });

  } catch (error: any) {
    console.error('GA4 API error:', error);
    return res.status(500).json({ error: error?.message ?? 'Erro ao consultar GA4' });
  }
}
