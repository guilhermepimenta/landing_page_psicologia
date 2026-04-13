import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runWeeklyReport } from '../lib/weeklyReportEngine.js';

function isAuthorized(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return req.headers.authorization === `Bearer ${cronSecret}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const summary = await runWeeklyReport('cron', false);
  return res.status(summary.success ? 200 : 500).json(summary);
}