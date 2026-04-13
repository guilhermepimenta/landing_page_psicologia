import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runPublishScheduled } from '../lib/cronPublisher.js';

/**
 * Vercel Cron Function — disparada automaticamente a cada 15 minutos.
 * Configuração em vercel.json:
 *   "crons": [{ "path": "/api/cron/publish-scheduled", "schedule": "*\/15 * * * *" }]
 *
 * Variáveis de ambiente necessárias:
 *   CRON_SECRET (opcional)      → a Vercel injeta Authorization: Bearer <secret>
 *   INSTAGRAM_ACCESS_TOKEN      → token do Instagram
 *   INSTAGRAM_USER_ID           → ID do usuário do Instagram
 *   FIREBASE_PROJECT_ID         → Firebase project ID
 *   FIREBASE_CLIENT_EMAIL       → service account client_email
 *   FIREBASE_PRIVATE_KEY        → service account private_key (com \n)
 */

function isAuthorized(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return req.method === 'GET';
  return req.headers.authorization === `Bearer ${cronSecret}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const dryRun = req.method === 'POST' ? req.body?.dryRun !== false : false;
  const triggeredBy = req.method === 'POST' ? 'manual' : 'cron';
  const summary = await runPublishScheduled(triggeredBy, dryRun);
  return res.status(summary.success ? 200 : 500).json(summary);
}
