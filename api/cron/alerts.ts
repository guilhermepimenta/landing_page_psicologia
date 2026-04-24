import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runAlerts } from '../_lib/alertsEngine.js';

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
  const summary = await runAlerts(triggeredBy, dryRun);
  return res.status(summary.success ? 200 : 500).json(summary);
}
