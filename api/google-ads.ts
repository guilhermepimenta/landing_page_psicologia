import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

/**
 * GET /api/google-ads?month=YYYY-MM
 *
 * Retorna o gasto mensal do Google Ads via GA4 Data API.
 * Requer que o Google Ads esteja vinculado à propriedade GA4:
 *   GA4 → Admin → Integrações de produtos → Google Ads → Vincular
 *
 * Usa as mesmas variáveis de ambiente do GA4 já configuradas:
 *   GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY
 *
 * Métricas disponíveis após vinculação:
 *   advertiserAdCost, advertiserAdClicks, advertiserAdImpressions
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY } = process.env;

  if (!GA4_PROPERTY_ID || !GA4_CLIENT_EMAIL || !GA4_PRIVATE_KEY) {
    return res.status(503).json({ error: 'GA4 não configurado', configured: false });
  }

  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
  const [year, m] = month.split('-');
  const startDate = `${year}-${m}-01`;
  const daysInMonth = new Date(parseInt(year), parseInt(m), 0).getDate();
  const endDate = `${year}-${m}-${String(daysInMonth).padStart(2, '0')}`;

  try {
    const analytics = new BetaAnalyticsDataClient({
      credentials: {
        client_email: GA4_CLIENT_EMAIL,
        private_key: GA4_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    });

    const [response] = await analytics.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionGoogleAdsAdNetworkType' }],
      metrics: [
        { name: 'advertiserAdCost' },
        { name: 'advertiserAdClicks' },
        { name: 'advertiserAdImpressions' },
      ],
    });

    let totalCost = 0;
    let totalClicks = 0;
    let totalImpressions = 0;
    const campaigns: { name: string; spend: number }[] = [];

    (response.rows ?? []).forEach(row => {
      const network = row.dimensionValues?.[0]?.value ?? 'Google Ads';
      const cost    = parseFloat(row.metricValues?.[0]?.value ?? '0');
      const clicks  = parseInt(row.metricValues?.[1]?.value ?? '0', 10);
      const impr    = parseInt(row.metricValues?.[2]?.value ?? '0', 10);
      if (cost > 0) {
        totalCost        += cost;
        totalClicks      += clicks;
        totalImpressions += impr;
        campaigns.push({ name: network, spend: cost });
      }
    });

    return res.json({
      spend: totalCost,
      clicks: totalClicks,
      impressions: totalImpressions,
      month,
      currency: 'BRL',
      campaigns,
      source: 'ga4',
    });
  } catch (err: any) {
    // Se a métrica não está disponível, provavelmente o Google Ads ainda não foi vinculado
    const msg: string = err.message ?? '';
    if (msg.includes('INVALID_ARGUMENT') || msg.includes('advertiserAdCost')) {
      return res.status(503).json({
        error: 'Vincule o Google Ads ao GA4 primeiro: GA4 → Admin → Integrações → Google Ads',
        configured: false,
      });
    }
    console.error('[google-ads via ga4]', err);
    return res.status(500).json({ error: msg || 'Erro interno' });
  }
}
