import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const { GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REDIRECT_URI } = process.env;

  if (!GOOGLE_ADS_CLIENT_ID || !GOOGLE_ADS_CLIENT_SECRET) {
    return res.status(503).json({ error: 'GOOGLE_ADS_CLIENT_ID e GOOGLE_ADS_CLIENT_SECRET não configurados.' });
  }

  const redirectUri = GOOGLE_ADS_REDIRECT_URI || 'http://localhost:5173/api/google-ads-oauth/callback';

  const oauth2Client = new google.auth.OAuth2(GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, redirectUri);

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/adwords'],
  });

  return res.json({ url });
}
