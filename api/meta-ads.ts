import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/meta-ads?month=YYYY-MM
 *
 * Retorna o total gasto no Meta Ads (Facebook + Instagram) para o mês informado.
 *
 * Variáveis de ambiente necessárias no Vercel:
 *   META_ADS_ACCESS_TOKEN   → token de acesso (System User token ou user long-lived token)
 *   META_ADS_AD_ACCOUNT_ID  → ID da conta de anúncios (ex: "123456789" ou "act_123456789")
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { META_ADS_ACCESS_TOKEN, META_ADS_AD_ACCOUNT_ID } = process.env;

  if (!META_ADS_ACCESS_TOKEN || !META_ADS_AD_ACCOUNT_ID) {
    return res.status(503).json({ error: 'Meta Ads não configurado', configured: false });
  }

  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
  const [year, m] = month.split('-');
  const since = `${year}-${m}-01`;
  const daysInMonth = new Date(parseInt(year), parseInt(m), 0).getDate();
  const until = `${year}-${m}-${String(daysInMonth).padStart(2, '0')}`;

  const accountId = META_ADS_AD_ACCOUNT_ID.startsWith('act_')
    ? META_ADS_AD_ACCOUNT_ID
    : `act_${META_ADS_AD_ACCOUNT_ID}`;

  try {
    // Buscar insights da conta — nível conta agrega todas as campanhas
    const params = new URLSearchParams({
      fields: 'spend,campaign_name',
      time_range: JSON.stringify({ since, until }),
      level: 'account',
      access_token: META_ADS_ACCESS_TOKEN,
    });

    const insightsRes = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}/insights?${params.toString()}`,
    );
    const insightsData = await insightsRes.json() as { data?: any[]; error?: any; paging?: any };

    if (!insightsRes.ok || insightsData.error) {
      const msg = insightsData.error?.message ?? 'Erro na Meta Ads API';
      return res.status(400).json({ error: msg });
    }

    const spend = parseFloat(insightsData.data?.[0]?.spend ?? '0');

    // Buscar breakdown por campanha para detalhe
    const campaignParams = new URLSearchParams({
      fields: 'spend,campaign_name',
      time_range: JSON.stringify({ since, until }),
      level: 'campaign',
      access_token: META_ADS_ACCESS_TOKEN,
    });

    const campaignRes = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}/insights?${campaignParams.toString()}`,
    );
    const campaignData = await campaignRes.json() as { data?: any[] };

    const campaigns = (campaignData.data ?? []).map((c: any) => ({
      name: c.campaign_name ?? 'Campanha',
      spend: parseFloat(c.spend ?? '0'),
    }));

    return res.json({ spend, month, currency: 'BRL', campaigns });
  } catch (err: any) {
    console.error('[meta-ads]', err);
    return res.status(500).json({ error: err.message ?? 'Erro interno' });
  }
}
