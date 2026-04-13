import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runAlerts } from '../lib/alertsEngine.js';

function isAuthorized(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }
  return req.headers.authorization === `Bearer ${cronSecret}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed — use POST' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized — configure CRON_SECRET e passe Authorization: Bearer <secret>',
    });
  }

  const dryRun = req.body?.dryRun !== false;
  const summary = await runAlerts('manual', dryRun);
  return res.status(summary.success ? 200 : 500).json(summary);
}
