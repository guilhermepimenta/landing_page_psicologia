import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runPublishScheduled } from '../lib/cronPublisher';

/**
 * Endpoint de trigger manual para o cron de publicação agendada.
 *
 * Permite testar o pipeline completo sem esperar o intervalo de 15 min do cron automático.
 *
 * Uso:
 *   POST /api/cron/trigger
 *   Authorization: Bearer <CRON_SECRET>
 *   Content-Type: application/json
 *   { "dryRun": true }    → simulação (consulta mas não publica/escreve)
 *   { "dryRun": false }   → execução real
 *
 * Resposta (RunSummary):
 *   { success, triggeredBy: "manual", dryRun, startedAt, finishedAt, durationMs,
 *     scanned, published, errors, skipped, byChannel, results }
 *
 * Variáveis de ambiente:
 *   CRON_SECRET (obrigatória aqui) → proteção do trigger manual
 */

function isAuthorized(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Sem segredo configurado: bloqueia o trigger manual para evitar execução acidental
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

  const summary = await runPublishScheduled('manual', dryRun);
  return res.status(summary.success ? 200 : 500).json(summary);
}
