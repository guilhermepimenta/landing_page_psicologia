import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from './firebaseAdmin.js';

type TriggeredBy = 'cron' | 'manual';
type AlertKey = 'no_post_5d' | 'engagement_drop_20';
type AlertSeverity = 'warning' | 'critical';
type AlertStatus = 'active' | 'resolved';

interface PostLite {
  id: string;
  date: Date;
  engagement: number;
  status: string;
}

interface AlertCandidate {
  key: AlertKey;
  severity: AlertSeverity;
  message: string;
  details: Record<string, unknown>;
}

interface AlertActionResult {
  key: AlertKey;
  action: 'created' | 'already-active' | 'resolved';
  message: string;
}

export interface AlertsRunSummary {
  success: boolean;
  triggeredBy: TriggeredBy;
  dryRun: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  scannedPosts: number;
  created: number;
  resolved: number;
  active: number;
  results: AlertActionResult[];
  errors: string[];
}

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetween(now: Date, other: Date): number {
  const diffMs = now.getTime() - other.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

async function getRecentPublishedPosts(limitCount = 120): Promise<PostLite[]> {
  const db = getAdminDb();
  const snap = await db.collection('posts').orderBy('date', 'desc').limit(limitCount).get();

  const posts: PostLite[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const date = toDate(data.date);
    if (!date) continue;

    posts.push({
      id: doc.id,
      date,
      engagement: Number(data.engagement ?? 0),
      status: String(data.status ?? ''),
    });
  }

  return posts.filter(p => p.status === 'published');
}

function detectNoPostAlert(posts: PostLite[], now: Date): AlertCandidate | null {
  if (posts.length === 0) {
    return {
      key: 'no_post_5d',
      severity: 'critical',
      message: 'Nenhum post publicado encontrado. Recomendado publicar conteúdo hoje.',
      details: { daysWithoutPost: 999 },
    };
  }

  const latest = posts[0];
  const daysWithoutPost = daysBetween(now, latest.date);

  if (daysWithoutPost >= 5) {
    return {
      key: 'no_post_5d',
      severity: daysWithoutPost >= 8 ? 'critical' : 'warning',
      message: `Sem post publicado há ${daysWithoutPost} dias. Recomendado publicar pelo menos 1x por semana.`,
      details: {
        daysWithoutPost,
        lastPublishedAt: latest.date.toISOString(),
      },
    };
  }

  return null;
}

function detectEngagementDropAlert(posts: PostLite[], now: Date): AlertCandidate | null {
  const recentStart = new Date(now);
  recentStart.setDate(recentStart.getDate() - 7);

  const previousStart = new Date(now);
  previousStart.setDate(previousStart.getDate() - 14);

  const recent = posts.filter(p => p.date >= recentStart);
  const previous = posts.filter(p => p.date >= previousStart && p.date < recentStart);

  const recentAvg = average(recent.map(p => p.engagement));
  const previousAvg = average(previous.map(p => p.engagement));

  if (previousAvg <= 0) return null;

  const dropRatio = 1 - (recentAvg / previousAvg);
  const dropPercent = Math.round(dropRatio * 100);

  if (dropPercent >= 20) {
    return {
      key: 'engagement_drop_20',
      severity: dropPercent >= 35 ? 'critical' : 'warning',
      message: `Engajamento médio caiu ${dropPercent}% nos últimos 7 dias (vs semana anterior).`,
      details: {
        recentAvg: Math.round(recentAvg),
        previousAvg: Math.round(previousAvg),
        dropPercent,
        recentPosts: recent.length,
        previousPosts: previous.length,
      },
    };
  }

  return null;
}

async function syncAlerts(candidates: AlertCandidate[], dryRun: boolean): Promise<{
  created: number;
  resolved: number;
  active: number;
  results: AlertActionResult[];
}> {
  const db = getAdminDb();
  const now = Timestamp.now();
  const results: AlertActionResult[] = [];

  const candidateKeys = new Set(candidates.map(c => c.key));
  let created = 0;
  let resolved = 0;

  const activeSnap = await db.collection('alerts').where('status', '==', 'active' satisfies AlertStatus).get();
  const activeByKey = new Map<AlertKey, FirebaseFirestore.QueryDocumentSnapshot[]>();

  for (const doc of activeSnap.docs) {
    const key = String(doc.get('key')) as AlertKey;
    if (!activeByKey.has(key)) activeByKey.set(key, []);
    activeByKey.get(key)!.push(doc);
  }

  for (const candidate of candidates) {
    const existing = activeByKey.get(candidate.key) ?? [];
    if (existing.length > 0) {
      results.push({ key: candidate.key, action: 'already-active', message: candidate.message });
      continue;
    }

    if (!dryRun) {
      await db.collection('alerts').add({
        key: candidate.key,
        severity: candidate.severity,
        message: candidate.message,
        details: candidate.details,
        status: 'active' satisfies AlertStatus,
        source: 'sprint-7-alerts-engine',
        createdAt: now,
        updatedAt: now,
      });
    }

    created += 1;
    results.push({ key: candidate.key, action: 'created', message: candidate.message });
  }

  // Resolve stale active alerts that are no longer triggered.
  for (const [key, docs] of activeByKey.entries()) {
    if (candidateKeys.has(key)) continue;

    for (const doc of docs) {
      if (!dryRun) {
        await doc.ref.update({
          status: 'resolved' satisfies AlertStatus,
          resolvedAt: now,
          updatedAt: now,
        });
      }
      resolved += 1;
      results.push({ key, action: 'resolved', message: 'Condição normalizada automaticamente.' });
    }
  }

  const active = dryRun
    ? candidates.length
    : (await db.collection('alerts').where('status', '==', 'active' satisfies AlertStatus).get()).size;

  return { created, resolved, active, results };
}

export async function runAlerts(triggeredBy: TriggeredBy, dryRun: boolean): Promise<AlertsRunSummary> {
  const startedAt = new Date();
  const errors: string[] = [];

  try {
    const posts = await getRecentPublishedPosts(120);
    const now = new Date();

    const candidates: AlertCandidate[] = [];

    const inactivity = detectNoPostAlert(posts, now);
    if (inactivity) candidates.push(inactivity);

    const engagementDrop = detectEngagementDropAlert(posts, now);
    if (engagementDrop) candidates.push(engagementDrop);

    const sync = await syncAlerts(candidates, dryRun);

    const finishedAt = new Date();
    const summary: AlertsRunSummary = {
      success: true,
      triggeredBy,
      dryRun,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      scannedPosts: posts.length,
      created: sync.created,
      resolved: sync.resolved,
      active: sync.active,
      results: sync.results,
      errors,
    };

    if (!dryRun) {
      const db = getAdminDb();
      await db.collection('alerts_logs').add({ ...summary, createdAt: Timestamp.now() });
    }

    return summary;
  } catch (e: any) {
    const finishedAt = new Date();
    errors.push(String(e?.message ?? e));

    return {
      success: false,
      triggeredBy,
      dryRun,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      scannedPosts: 0,
      created: 0,
      resolved: 0,
      active: 0,
      results: [],
      errors,
    };
  }
}
