import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/google-ads?month=YYYY-MM
 *
 * Retorna o total gasto no Google Ads para o mês informado.
 *
 * Variáveis de ambiente necessárias no Vercel:
 *   GOOGLE_ADS_DEVELOPER_TOKEN  → token de desenvolvedor da conta MCC
 *   GOOGLE_ADS_CLIENT_ID        → OAuth2 client_id (Google Cloud Console)
 *   GOOGLE_ADS_CLIENT_SECRET    → OAuth2 client_secret
 *   GOOGLE_ADS_REFRESH_TOKEN    → refresh_token gerado uma vez via OAuth2
 *   GOOGLE_ADS_CUSTOMER_ID      → ID da conta de anúncios (ex: "123-456-7890")
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const {
    GOOGLE_ADS_DEVELOPER_TOKEN,
    GOOGLE_ADS_CUSTOMER_ID,
    GOOGLE_ADS_CLIENT_ID,
    GOOGLE_ADS_CLIENT_SECRET,
    GOOGLE_ADS_REFRESH_TOKEN,
  } = process.env;

  if (!GOOGLE_ADS_DEVELOPER_TOKEN || !GOOGLE_ADS_CUSTOMER_ID || !GOOGLE_ADS_CLIENT_ID || !GOOGLE_ADS_CLIENT_SECRET || !GOOGLE_ADS_REFRESH_TOKEN) {
    return res.status(503).json({ error: 'Google Ads não configurado', configured: false });
  }

  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
  const [year, m] = month.split('-');
  const startDate = `${year}-${m}-01`;
  const daysInMonth = new Date(parseInt(year), parseInt(m), 0).getDate();
  const endDate = `${year}-${m}-${String(daysInMonth).padStart(2, '0')}`;
  const customerId = GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');

  try {
    // Obter access token via refresh token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_ADS_CLIENT_ID,
        client_secret: GOOGLE_ADS_CLIENT_SECRET,
        refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }).toString(),
    });

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      return res.status(401).json({ error: 'Falha na autenticação OAuth: ' + (tokenData.error ?? 'token inválido') });
    }

    // Consultar Google Ads via GAQL
    const query = `
      SELECT
        campaign.name,
        metrics.cost_micros
      FROM campaign
      WHERE
        segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
        AND metrics.cost_micros > 0
    `;

    const searchRes = await fetch(
      `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      },
    );

    const searchData = await searchRes.json() as { results?: any[]; error?: any };

    if (!searchRes.ok) {
      const msg = searchData.error?.message ?? searchData.error?.details?.[0]?.errors?.[0]?.message ?? 'Erro na Google Ads API';
      return res.status(400).json({ error: msg });
    }

    const totalMicros = (searchData.results ?? []).reduce(
      (sum: number, r: any) => sum + Number(r.metrics?.costMicros ?? 0),
      0,
    );
    const totalBRL = totalMicros / 1_000_000;

    const campaigns = (searchData.results ?? []).map((r: any) => ({
      name: r.campaign?.name ?? '',
      spend: Number(r.metrics?.costMicros ?? 0) / 1_000_000,
    }));

    return res.json({ spend: totalBRL, month, currency: 'BRL', campaigns });
  } catch (err: any) {
    console.error('[google-ads]', err);
    return res.status(500).json({ error: err.message ?? 'Erro interno' });
  }
}
