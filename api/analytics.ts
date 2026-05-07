import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { GoogleGenAI } from '@google/genai';
import { getAdminDb } from './_lib/firebaseAdmin.js';

// ─── Health check helpers (usados pelo modo ?mode=health) ───────────────────

interface CheckResult {
  ok: boolean;
  label: string;
  detail: string;
  hint?: string;
  vars: string[];
}

function humanizeGa4Error(err: any): { detail: string; hint: string } {
  const msg: string = err?.message ?? String(err);
  const code: number = err?.code ?? 0;
  if (code === 7 || msg.includes('PERMISSION_DENIED'))
    return { detail: 'Permissão negada pela GA4 Data API.', hint: 'Adicione a service account como "Viewer" na propriedade GA4: GA4 → Admin → Gerenciamento de acesso à propriedade.' };
  if (code === 16 || msg.includes('UNAUTHENTICATED') || msg.includes('invalid_grant'))
    return { detail: 'Credenciais inválidas ou expiradas.', hint: 'Verifique GA4_CLIENT_EMAIL e GA4_PRIVATE_KEY no Vercel. A chave privada deve ter \\n literais.' };
  if (code === 5 || msg.includes('NOT_FOUND') || msg.includes('property'))
    return { detail: `Propriedade não encontrada: ${process.env.GA4_PROPERTY_ID ?? '(vazio)'}`, hint: 'Confirme GA4_PROPERTY_ID no Vercel. Use apenas o número (ex: "123456789"), sem o prefixo "properties/".' };
  if (msg.includes('INVALID_ARGUMENT'))
    return { detail: 'Argumento inválido na consulta GA4.', hint: 'GA4_PROPERTY_ID pode estar incorreto ou a métrica não existe para esta propriedade.' };
  return { detail: msg.slice(0, 200), hint: 'Verifique os logs do Vercel para mais detalhes.' };
}

async function checkGa4(client: BetaAnalyticsDataClient | null): Promise<CheckResult> {
  const vars = ['GA4_PROPERTY_ID', 'GA4_CLIENT_EMAIL', 'GA4_PRIVATE_KEY'];
  const missing = vars.filter(v => !process.env[v]);
  if (missing.length > 0 || !client)
    return { ok: false, label: 'Google Analytics 4', detail: `Variáveis ausentes: ${missing.join(', ')}`, hint: 'Configure no Vercel Dashboard → Settings → Environment Variables.', vars };
  try {
    const [res] = await client.runReport({ property: `properties/${process.env.GA4_PROPERTY_ID}`, dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }], metrics: [{ name: 'sessions' }], limit: 1 });
    const sessions = Number(res.rows?.[0]?.metricValues?.[0]?.value ?? 0);
    return { ok: true, label: 'Google Analytics 4', detail: `Conectado. Sessões nos últimos 7 dias: ${sessions}`, vars };
  } catch (err: any) {
    const { detail, hint } = humanizeGa4Error(err);
    return { ok: false, label: 'Google Analytics 4', detail, hint, vars };
  }
}

async function checkGoogleAds(client: BetaAnalyticsDataClient | null): Promise<CheckResult> {
  const vars = ['GA4_PROPERTY_ID', 'GA4_CLIENT_EMAIL', 'GA4_PRIVATE_KEY'];
  if (!client) return { ok: false, label: 'Google Ads (via GA4)', detail: 'Credenciais GA4 ausentes.', vars };
  try {
    const [res] = await client.runReport({ property: `properties/${process.env.GA4_PROPERTY_ID}`, dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }], dimensions: [{ name: 'sessionGoogleAdsAdNetworkType' }], metrics: [{ name: 'advertiserAdCost' }], limit: 5 });
    const rows = res.rows ?? [];
    const totalCost = rows.reduce((s, r) => s + parseFloat(r.metricValues?.[0]?.value ?? '0'), 0);
    if (rows.length === 0)
      return { ok: false, label: 'Google Ads (via GA4)', detail: 'Nenhum dado retornado para advertiserAdCost.', hint: 'Vincule o Google Ads à propriedade GA4: GA4 → Admin → Integrações de produtos → Google Ads → Vincular. Se já vinculado, pode não haver campanhas ativas nos últimos 30 dias.', vars };
    return { ok: true, label: 'Google Ads (via GA4)', detail: `Vinculado. Gasto nos últimos 30 dias: R$ ${totalCost.toFixed(2)}`, vars };
  } catch (err: any) {
    const msg: string = err?.message ?? '';
    if (msg.includes('INVALID_ARGUMENT') || msg.includes('advertiserAdCost') || msg.includes('unknown metric'))
      return { ok: false, label: 'Google Ads (via GA4)', detail: 'Métrica advertiserAdCost indisponível.', hint: 'Vincule o Google Ads à propriedade GA4: GA4 → Admin → Integrações de produtos → Google Ads → Vincular.', vars };
    const { detail, hint } = humanizeGa4Error(err);
    return { ok: false, label: 'Google Ads (via GA4)', detail, hint, vars };
  }
}

async function checkMetaAds(): Promise<CheckResult> {
  const vars = ['META_ADS_ACCESS_TOKEN', 'META_ADS_AD_ACCOUNT_ID'];
  const token = process.env.META_ADS_ACCESS_TOKEN;
  const accountId = process.env.META_ADS_AD_ACCOUNT_ID;
  if (!token || !accountId) {
    const missing = vars.filter(v => !process.env[v]);
    return { ok: false, label: 'Meta Ads', detail: `Variáveis ausentes: ${missing.join(', ')}`, hint: 'Configure no Vercel. META_ADS_AD_ACCOUNT_ID é o número da conta (sem "act_").', vars };
  }
  try {
    const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${token}`);
    const meData = await meRes.json() as { id?: string; name?: string; error?: { message: string; code: number } };
    if (meData.error) {
      const isExpired = meData.error.code === 190;
      return { ok: false, label: 'Meta Ads', detail: `Token inválido: ${meData.error.message}`, hint: isExpired ? 'Token expirado. Gere um novo System User Token no Meta Business Manager com permissão ads_read.' : 'Use um System User Token de longa duração.', vars };
    }
    const normalizedId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    const acctRes = await fetch(`https://graph.facebook.com/v21.0/${normalizedId}?fields=id,name,account_status&access_token=${token}`);
    const acctData = await acctRes.json() as { id?: string; name?: string; account_status?: number; error?: { message: string } };
    if (acctData.error) return { ok: false, label: 'Meta Ads', detail: `Sem acesso à conta ${normalizedId}: ${acctData.error.message}`, hint: 'Verifique META_ADS_AD_ACCOUNT_ID e permissões no Meta Business Manager.', vars };
    const statusMap: Record<number, string> = { 1: 'Ativa', 2: 'Desativada', 3: 'Não confirmada', 7: 'Pendente', 9: 'Em análise' };
    const statusLabel = statusMap[acctData.account_status ?? 0] ?? `Status ${acctData.account_status}`;
    return { ok: acctData.account_status === 1, label: 'Meta Ads', detail: `Conectado como "${meData.name}". Conta: ${acctData.name ?? normalizedId} (${statusLabel})`, hint: acctData.account_status !== 1 ? 'A conta de anúncios não está ativa.' : undefined, vars };
  } catch (err: any) {
    return { ok: false, label: 'Meta Ads', detail: `Erro de rede: ${err?.message ?? 'Desconhecido'}`, vars };
  }
}

async function checkFirebase(): Promise<CheckResult> {
  const vars = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
  try {
    const db = getAdminDb();
    const snap = await db.collection('posts').limit(1).get();
    return { ok: true, label: 'Firebase Admin (Firestore)', detail: `Conectado. Coleção 'posts' acessível (${snap.size} doc).`, vars };
  } catch (err: any) {
    return { ok: false, label: 'Firebase Admin (Firestore)', detail: String(err?.message ?? err).slice(0, 200), hint: 'Verifique FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no Vercel.', vars };
  }
}

// ─── Vercel Serverless Function — GA4 Data API ────────────────────────────────
/**
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

  // --- Modo: health check de todas as integrações ---
  if (req.query.mode === 'health') {
    let client: BetaAnalyticsDataClient | null = null;
    try { client = getClient(); } catch { /* credenciais ausentes — checkGa4/checkGoogleAds reportam isso */ }
    const checks = await Promise.allSettled([checkGa4(client), checkGoogleAds(client), checkMetaAds(), checkFirebase()]);
    const results: CheckResult[] = checks.map((c, i) => {
      if (c.status === 'fulfilled') return c.value;
      const labels = ['Google Analytics 4', 'Google Ads (via GA4)', 'Meta Ads', 'Firebase Admin'];
      return { ok: false, label: labels[i] ?? 'Desconhecido', detail: String((c as PromiseRejectedResult).reason?.message ?? 'Erro inesperado'), vars: [] };
    });
    const allOk = results.every(r => r.ok);
    return res.status(allOk ? 200 : 207).json({ status: allOk ? 'ok' : 'degraded', checkedAt: new Date().toISOString(), checks: results });
  }

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
    const msg: string = error?.message ?? '';
    const code: number = error?.code ?? 0;

    if (code === 7 || msg.includes('PERMISSION_DENIED')) {
      return res.status(403).json({
        error: 'Permissão negada pela GA4 Data API.',
        hint: 'Adicione a service account como Viewer na propriedade GA4: GA4 → Admin → Gerenciamento de acesso à propriedade → Adicionar usuários.',
      });
    }
    if (code === 16 || msg.includes('UNAUTHENTICATED') || msg.includes('invalid_grant')) {
      return res.status(401).json({
        error: 'Credenciais GA4 inválidas ou expiradas.',
        hint: 'Verifique GA4_CLIENT_EMAIL e GA4_PRIVATE_KEY no Vercel. A chave privada deve estar com \\n literais (não quebras de linha reais).',
      });
    }
    if (code === 5 || msg.includes('NOT_FOUND')) {
      return res.status(404).json({
        error: `Propriedade GA4 não encontrada: ${propertyId}`,
        hint: 'Confirme GA4_PROPERTY_ID no Vercel. Use apenas o número (ex: "123456789"), sem o prefixo "properties/".',
      });
    }

    return res.status(500).json({ error: msg || 'Erro ao consultar GA4' });
  }
}
