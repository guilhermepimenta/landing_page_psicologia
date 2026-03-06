import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

/**
 * Vercel Serverless Function — chama a GA4 Data API com service account.
 *
 * Variáveis de ambiente necessárias no Vercel Dashboard:
 *   GA4_PROPERTY_ID       → ID da propriedade GA4 (ex: "123456789"), sem o prefixo "properties/"
 *   GA4_CLIENT_EMAIL      → client_email do JSON da service account
 *   GA4_PRIVATE_KEY       → private_key do JSON da service account (com \n literais)
 *
 * Endpoint: GET /api/analytics
 * Retorna:
 * {
 *   weeklyEngagement: [{ dia, Instagram, GMB, Blog, Email }],
 *   monthlyTrend:     [{ mes, leads, conversoes }],
 *   summaryMetrics:   [{ metrica, valor, variacao }]
 * }
 */

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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
  // CORS para requests do frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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

  try {
    const property = `properties/${propertyId}`;

    // --- 1. Engajamento semanal (últimos 7 dias, por canal/source) ---
    const [weeklyResponse] = await analyticsClient.runReport({
      property,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }, { name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'engagedSessions' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    });

    // Agrupa por dia da semana
    const weekMap: Record<string, { Instagram: number; GMB: number; Blog: number; Email: number }> = {};
    for (const row of weeklyResponse.rows ?? []) {
      const dateStr = row.dimensionValues?.[0]?.value ?? '';
      const channel = row.dimensionValues?.[1]?.value ?? '';
      const sessions = Number(row.metricValues?.[0]?.value ?? 0);

      // Converte "20260305" → objeto Date
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

    // --- 2. Tendência mensal de leads (últimos 6 meses) ---
    const [monthlyResponse] = await analyticsClient.runReport({
      property,
      dateRanges: [{ startDate: '180daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'yearMonth' }],
      metrics: [
        { name: 'sessions' },
        { name: 'conversions' },
      ],
      orderBys: [{ dimension: { dimensionName: 'yearMonth' } }],
    });

    const monthlyTrend = (monthlyResponse.rows ?? []).slice(-6).map(row => {
      const ym = row.dimensionValues?.[0]?.value ?? '';
      const monthIdx = parseInt(ym.slice(4, 6), 10) - 1;
      return {
        mes: MONTHS_PT[monthIdx] ?? ym,
        leads: Number(row.metricValues?.[0]?.value ?? 0),
        conversoes: Number(row.metricValues?.[1]?.value ?? 0),
      };
    });

    // --- 3. Métricas de resumo (mês atual vs mês anterior) ---
    const [thisMonth] = await analyticsClient.runReport({
      property,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'engagementRate' },
        { name: 'totalUsers' },
        { name: 'conversions' },
        { name: 'sessionConversionRate' },
      ],
    });

    const [lastMonth] = await analyticsClient.runReport({
      property,
      dateRanges: [{ startDate: '60daysAgo', endDate: '31daysAgo' }],
      metrics: [
        { name: 'engagementRate' },
        { name: 'totalUsers' },
        { name: 'conversions' },
        { name: 'sessionConversionRate' },
      ],
    });

    const curr = thisMonth.rows?.[0]?.metricValues ?? [];
    const prev = lastMonth.rows?.[0]?.metricValues ?? [];

    const pct = (c: number, p: number) =>
      p === 0 ? 0 : Math.round(((c - p) / p) * 100 * 10) / 10;

    const engRate = Math.round(Number(curr[0]?.value ?? 0) * 1000) / 10;
    const prevEngRate = Math.round(Number(prev[0]?.value ?? 0) * 1000) / 10;
    const users = Math.round(Number(curr[1]?.value ?? 0));
    const prevUsers = Math.round(Number(prev[1]?.value ?? 0));
    const conversions = Math.round(Number(curr[2]?.value ?? 0));
    const prevConversions = Math.round(Number(prev[2]?.value ?? 0));
    const convRate = Math.round(Number(curr[3]?.value ?? 0) * 1000) / 10;
    const prevConvRate = Math.round(Number(prev[3]?.value ?? 0) * 1000) / 10;

    const summaryMetrics = [
      { metrica: 'taxa_engajamento', valor: engRate, variacao: pct(engRate, prevEngRate) },
      { metrica: 'alcance_total', valor: users, variacao: pct(users, prevUsers) },
      { metrica: 'leads', valor: conversions, variacao: pct(conversions, prevConversions) },
      { metrica: 'taxa_conversao', valor: convRate, variacao: pct(convRate, prevConvRate) },
    ];

    // Cache de 1 hora no CDN do Vercel
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');

    return res.status(200).json({ weeklyEngagement, monthlyTrend, summaryMetrics });

  } catch (error: any) {
    console.error('GA4 API error:', error);
    return res.status(500).json({ error: error?.message ?? 'Erro ao consultar GA4' });
  }
}
