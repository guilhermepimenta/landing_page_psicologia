import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { getAdminDb } from './_lib/firebaseAdmin';

const GADS_BASE = 'https://googleads.googleapis.com/v17';

async function getAccessToken(): Promise<string> {
  const db = getAdminDb();
  const snap = await db.collection('config').doc('google_ads_tokens').get();
  if (!snap.exists) throw Object.assign(new Error('NOT_CONNECTED'), { code: 'NOT_CONNECTED' });

  const { refreshToken } = snap.data()!;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_ADS_CLIENT_ID,
    process.env.GOOGLE_ADS_CLIENT_SECRET,
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { token } = await oauth2Client.getAccessToken();
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID ?? '';

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (err: any) {
    if (err.code === 'NOT_CONNECTED') {
      return res.status(401).json({ error: 'not_connected' });
    }
    console.error('[gads-campaigns] token error', err);
    return res.status(500).json({ error: err.message });
  }

  if (req.method === 'GET') {
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros
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
      console.error('[gads-campaigns] search error', JSON.stringify(data));
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

  if (req.method === 'PATCH') {
    const { campaignId, status } = req.body as { campaignId?: string; status?: string };

    if (!campaignId || !['ENABLED', 'PAUSED'].includes(status ?? '')) {
      return res.status(400).json({ error: 'campaignId e status (ENABLED | PAUSED) são obrigatórios.' });
    }

    const gadsRes = await fetch(`${GADS_BASE}/customers/${customerId}/campaigns:mutate`, {
      method: 'POST',
      headers: gadsHeaders(accessToken),
      body: JSON.stringify({
        operations: [{
          update: {
            resourceName: `customers/${customerId}/campaigns/${campaignId}`,
            status,
          },
          updateMask: 'status',
        }],
      }),
    });

    const data = await gadsRes.json();
    if (!gadsRes.ok) {
      console.error('[gads-campaigns] mutate error', JSON.stringify(data));
      return res.status(gadsRes.status).json({ error: data });
    }

    return res.json({ success: true });
  }

  return res.status(405).end();
}
