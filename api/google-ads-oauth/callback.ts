import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';
import { getAdminDb } from '../_lib/firebaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error } = req.query as Record<string, string>;

  if (error) {
    return res.send(closePopup(`Autorização negada: ${error}`));
  }

  if (!code) {
    return res.status(400).send(closePopup('Código OAuth não fornecido.'));
  }

  const { GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REDIRECT_URI } = process.env;
  const redirectUri = GOOGLE_ADS_REDIRECT_URI || 'http://localhost:5173/api/google-ads-oauth/callback';

  const oauth2Client = new google.auth.OAuth2(GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, redirectUri);

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return res.send(closePopup('Refresh token não retornado. Revogue o acesso em myaccount.google.com e tente novamente.'));
    }

    const db = getAdminDb();
    await db.collection('config').doc('google_ads_tokens').set({
      refreshToken: tokens.refresh_token,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return res.send(closePopup(null));
  } catch (err: any) {
    console.error('[gads-oauth callback]', err);
    return res.status(500).send(closePopup(`Erro ao trocar código: ${err.message}`));
  }
}

function closePopup(errorMsg: string | null): string {
  if (errorMsg) {
    return `<html><body>
      <p style="font-family:sans-serif;color:red;padding:20px;">${errorMsg}</p>
    </body></html>`;
  }
  return `<html><body>
    <p style="font-family:sans-serif;padding:20px;">Conectado! Fechando...</p>
    <script>
      if (window.opener) { window.opener.postMessage('google-ads-connected', '*'); }
      window.close();
    </script>
  </body></html>`;
}
