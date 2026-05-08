import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { getAdminDb } from './_lib/firebaseAdmin';

/**
 * Unified Google Ads handler — replaces api/google-ads.ts, api/gads-auth.ts
 * and api/google-ads-oauth/callback.ts to stay within Vercel Hobby 12-function limit.
 *
 * Routes:
 *   GET  ?action=auth              → OAuth2 authorization URL
 *   GET  ?action=callback&code=X   → OAuth2 callback (via vercel.json rewrite)
 *   GET  ?action=spend&month=YYYY-MM → GA4-based spend (legacy, used by ROI panel)
 *   GET  (no action)               → list campaigns via Google Ads API
 *   PATCH (no action)              → update campaign status
 */

const GADS_BASE = 'https://googleads.googleapis.com/v17';

// ── OAuth helpers ────────────────────────────────────────────────────────────

function getOAuth2Client() {
  const redirectUri =
    process.env.GOOGLE_ADS_REDIRECT_URI ||
    'http://localhost:5173/api/google-ads-oauth/callback';
  return new google.auth.OAuth2(
    process.env.GOOGLE_ADS_CLIENT_ID,
    process.env.GOOGLE_ADS_CLIENT_SECRET,
    redirectUri,
  );
}

async function getAccessToken(): Promise<string> {
  const db = getAdminDb();
  const snap = await db.collection('config').doc('google_ads_tokens').get();
  if (!snap.exists) throw Object.assign(new Error('NOT_CONNECTED'), { code: 'NOT_CONNECTED' });

  const { refreshToken } = snap.data()!;
  const client = getOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });

  const { token } = await client.getAccessToken();
  if (!token) throw new Error('Falha ao obter access token do Google.');
  return token;
}

function gadsHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
    'login-customer-id': process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ?? '',
    'Content-Type': 'application/json',
  };
}

// ── Action: auth URL ─────────────────────────────────────────────────────────

async function handleAuth(res: VercelResponse) {
  if (!process.env.GOOGLE_ADS_CLIENT_ID || !process.env.GOOGLE_ADS_CLIENT_SECRET) {
    return res.status(503).json({ error: 'GOOGLE_ADS_CLIENT_ID / CLIENT_SECRET não configurados.' });
  }
  const url = getOAuth2Client().generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/adwords'],
  });
  return res.json({ url });
}

// ── Action: OAuth callback ───────────────────────────────────────────────────

function closePopup(errorMsg: string | null): string {
  if (errorMsg) {
    return `<html><body><p style="font-family:sans-serif;color:red;padding:20px">${errorMsg}</p></body></html>`;
  }
  return `<html><body>
    <p style="font-family:sans-serif;padding:20px">Conectado! Fechando...</p>
    <script>
      if (window.opener) { window.opener.postMessage('google-ads-connected', '*'); }
      window.close();
    </script>
  </body></html>`;
}

async function handleCallback(req: VercelRequest, res: VercelResponse) {
  const { code, error } = req.query as Record<string, string>;
  if (error) return res.send(closePopup(`Autorização negada: ${error}`));
  if (!code) return res.status(400).send(closePopup('Código OAuth não fornecido.'));

  try {
    const { tokens } = await getOAuth2Client().getToken(code);
    if (!tokens.refresh_token) {
      return res.send(closePopup(
        'Refresh token não retornado. Revogue o acesso em myaccount.google.com e tente novamente.',
      ));
    }
    const db = getAdminDb();
    await db.collection('config').doc('google_ads_tokens').set(
      { refreshToken: tokens.refresh_token, updatedAt: new Date().toISOString() },
      { merge: true },
    );
    return res.send(closePopup(null));
  } catch (err: any) {
    console.error('[gads callback]', err);
    return res.status(500).send(closePopup(`Erro: ${err.message}`));
  }
}

// ── Action: GA4-based spend (used by ROI panel via /api/google-ads rewrite) ──

async function handleSpend(req: VercelRequest, res: VercelResponse) {
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

    let totalCost = 0, totalClicks = 0, totalImpressions = 0;
    const campaigns: { name: string; spend: number }[] = [];

    (response.rows ?? []).forEach(row => {
      const network = row.dimensionValues?.[0]?.value ?? 'Google Ads';
      const cost    = parseFloat(row.metricValues?.[0]?.value ?? '0');
      const clicks  = parseInt(row.metricValues?.[1]?.value ?? '0', 10);
      const impr    = parseInt(row.metricValues?.[2]?.value ?? '0', 10);
      if (cost > 0) {
        totalCost += cost; totalClicks += clicks; totalImpressions += impr;
        campaigns.push({ name: network, spend: cost });
      }
    });

    const noRows = (response.rows ?? []).length === 0;
    return res.json({
      spend: totalCost, clicks: totalClicks, impressions: totalImpressions,
      month, currency: 'BRL', campaigns, source: 'ga4',
      hint: noRows
        ? 'Nenhuma campanha encontrada no período. Verifique se o Google Ads está vinculado à propriedade GA4.'
        : undefined,
    });
  } catch (err: any) {
    const msg: string = err?.message ?? '';
    const code: number = err?.code ?? 0;
    if (msg.includes('INVALID_ARGUMENT') || msg.includes('advertiserAdCost') || msg.includes('unknown metric')) {
      return res.status(503).json({ error: 'Métrica de Google Ads indisponível nesta propriedade GA4.', configured: false });
    }
    if (code === 7 || msg.includes('PERMISSION_DENIED')) {
      return res.status(403).json({ error: 'Permissão negada.', configured: false });
    }
    if (code === 16 || msg.includes('UNAUTHENTICATED') || msg.includes('invalid_grant')) {
      return res.status(401).json({ error: 'Credenciais GA4 inválidas.', configured: false });
    }
    console.error('[gads spend via ga4]', err);
    return res.status(500).json({ error: msg || 'Erro interno' });
  }
}

// ── GET campaigns ────────────────────────────────────────────────────────────

async function handleListCampaigns(res: VercelResponse) {
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (err: any) {
    if (err.code === 'NOT_CONNECTED') return res.status(401).json({ error: 'not_connected' });
    console.error('[gads list]', err);
    return res.status(500).json({ error: err.message });
  }

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID ?? '';
  const query = `
    SELECT campaign.id, campaign.name, campaign.status,
           campaign.advertising_channel_type, campaign_budget.amount_micros
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.name ASC
  `;

  const gadsRes = await fetch(`${GADS_BASE}/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers: gadsHeaders(accessToken),
    body: JSON.stringify({ query }),
  });

  const data = await gadsRes.json();
  if (!gadsRes.ok) {
    console.error('[gads list] search error', JSON.stringify(data));
    return res.status(gadsRes.status).json({ error: data });
  }

  const campaigns = (data.results ?? []).map((row: any) => ({
    id: String(row.campaign?.id ?? ''),
    name: row.campaign?.name ?? '',
    status: row.campaign?.status ?? 'UNKNOWN',
    channelType: row.campaign?.advertisingChannelType ?? '',
    dailyBudgetBRL: row.campaignBudget?.amountMicros
      ? (parseInt(row.campaignBudget.amountMicros, 10) / 1_000_000).toFixed(2)
      : null,
  }));

  return res.json({ campaigns });
}

// ── PATCH campaign status ────────────────────────────────────────────────────

async function handleUpdateCampaign(req: VercelRequest, res: VercelResponse) {
  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (err: any) {
    if (err.code === 'NOT_CONNECTED') return res.status(401).json({ error: 'not_connected' });
    return res.status(500).json({ error: err.message });
  }

  const { campaignId, status } = req.body as { campaignId?: string; status?: string };
  if (!campaignId || !['ENABLED', 'PAUSED'].includes(status ?? '')) {
    return res.status(400).json({ error: 'campaignId e status (ENABLED | PAUSED) são obrigatórios.' });
  }

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID ?? '';
  const gadsRes = await fetch(`${GADS_BASE}/customers/${customerId}/campaigns:mutate`, {
    method: 'POST',
    headers: gadsHeaders(accessToken),
    body: JSON.stringify({
      operations: [{
        update: { resourceName: `customers/${customerId}/campaigns/${campaignId}`, status },
        updateMask: 'status',
      }],
    }),
  });

  const data = await gadsRes.json();
  if (!gadsRes.ok) {
    console.error('[gads mutate]', JSON.stringify(data));
    return res.status(gadsRes.status).json({ error: data });
  }

  return res.json({ success: true });
}

// ── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = req.query.action as string | undefined;

  if (req.method === 'GET') {
    if (action === 'auth')     return handleAuth(res);
    if (action === 'callback') return handleCallback(req, res);
    if (action === 'spend')    return handleSpend(req, res);
    return handleListCampaigns(res);
  }

  if (req.method === 'PATCH') return handleUpdateCampaign(req, res);

  return res.status(405).end();
}
