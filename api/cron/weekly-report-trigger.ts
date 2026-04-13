import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runWeeklyReport } from '../lib/weeklyReportEngine.js';

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
  const to = typeof req.body?.to === 'string' ? req.body.to : undefined;
  const from = typeof req.body?.from === 'string' ? req.body.from : undefined;

  const summary = await runWeeklyReport('manual', dryRun, { to, from });
  return res.status(summary.success ? 200 : 500).json(summary);
}