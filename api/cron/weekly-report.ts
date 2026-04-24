import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runWeeklyReport } from '../_lib/weeklyReportEngine.js';

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
  const to = req.method === 'POST' && typeof req.body?.to === 'string' ? req.body.to : undefined;
  const from = req.method === 'POST' && typeof req.body?.from === 'string' ? req.body.from : undefined;
  const triggeredBy = req.method === 'POST' ? 'manual' : 'cron';

  const summary = await runWeeklyReport(triggeredBy, dryRun, { to, from });
  return res.status(summary.success ? 200 : 500).json(summary);
}