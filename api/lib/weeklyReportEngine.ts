import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from './firebaseAdmin.js';

type TriggeredBy = 'cron' | 'manual';
type Channel = 'Instagram' | 'GMB' | 'Blog' | 'Email';

interface PostLite {
  id: string;
  title: string;
  channel: Channel;
  status: string;
  date: Date;
  engagement: number;
}

interface MessageLite {
  id: string;
  createdAt: Date;
}

interface AlertLite {
  id: string;
  severity: 'warning' | 'critical' | 'info';
  message: string;
}

interface WeeklyStats {
  publishedThisWeek: number;
  publishedPreviousWeek: number;
  scheduledNext7d: number;
  contactsThisWeek: number;
  contactsPreviousWeek: number;
  activeAlerts: number;
  averageEngagementThisWeek: number;
  averageEngagementPreviousWeek: number;
  engagementChange: number;
  contactsChange: number;
  publishedByChannel: Record<Channel, number>;
  scheduledByChannel: Record<Channel, number>;
  topPosts: Array<{ title: string; channel: Channel; date: string; engagement: number }>;
  alertHighlights: string[];
}

interface RunOptions {
  to?: string;
  from?: string;
}

export interface WeeklyReportSummary {
  success: boolean;
  triggeredBy: TriggeredBy;
  dryRun: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  periodStart: string;
  periodEnd: string;
  recipient: string | null;
  subject: string;
  sent: boolean;
  sendId?: string;
  postsPublished: number;
  contactsReceived: number;
  activeAlerts: number;
  scheduledNext7d: number;
  highlights: string[];
  error?: string;
}

function toDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function pctChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round((((current / previous) - 1) * 100) * 10) / 10;
}

function emptyChannelMap(): Record<Channel, number> {
  return { Instagram: 0, GMB: 0, Blog: 0, Email: 0 };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getReportWindow(now: Date) {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const end = new Date(todayStart);
  const start = new Date(todayStart);
  start.setDate(start.getDate() - 7);

  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - 7);

  const nextEnd = new Date(end);
  nextEnd.setDate(nextEnd.getDate() + 7);

  return { start, end, previousStart, nextEnd };
}

async function getRecentPosts(limitCount = 200): Promise<PostLite[]> {
  const db = getAdminDb();
  const snap = await db.collection('posts').orderBy('date', 'desc').limit(limitCount).get();

  const posts: PostLite[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    const date = toDate(data.date);
    if (!date) continue;

    posts.push({
      id: doc.id,
      title: String(data.title ?? 'Sem título'),
      channel: (data.channel ?? 'Instagram') as Channel,
      status: String(data.status ?? ''),
      date,
      engagement: Number(data.engagement ?? 0),
    });
  }

  return posts;
}

async function getRecentMessages(limitCount = 200): Promise<MessageLite[]> {
  const db = getAdminDb();
  const snap = await db.collection('mensagens').orderBy('createdAt', 'desc').limit(limitCount).get();

  const messages: MessageLite[] = [];
  for (const doc of snap.docs) {
    const createdAt = toDate(doc.get('createdAt'));
    if (!createdAt) continue;
    messages.push({ id: doc.id, createdAt });
  }

  return messages;
}

async function getActiveAlerts(limitCount = 20): Promise<AlertLite[]> {
  const db = getAdminDb();
  const snap = await db
    .collection('alerts')
    .where('status', '==', 'active')
    .limit(limitCount)
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    severity: (doc.get('severity') ?? 'warning') as AlertLite['severity'],
    message: String(doc.get('message') ?? ''),
  }));
}

function buildStats(posts: PostLite[], messages: MessageLite[], alerts: AlertLite[], now: Date): {
  stats: WeeklyStats;
  start: Date;
  end: Date;
} {
  const { start, end, previousStart, nextEnd } = getReportWindow(now);

  const publishedThisWeek = posts.filter((post) => post.status === 'published' && post.date >= start && post.date < end);
  const publishedPreviousWeek = posts.filter((post) => post.status === 'published' && post.date >= previousStart && post.date < start);
  const scheduledNext7d = posts.filter((post) => post.status === 'scheduled' && post.date >= end && post.date < nextEnd);

  const contactsThisWeek = messages.filter((message) => message.createdAt >= start && message.createdAt < end);
  const contactsPreviousWeek = messages.filter((message) => message.createdAt >= previousStart && message.createdAt < start);

  const publishedByChannel = emptyChannelMap();
  const scheduledByChannel = emptyChannelMap();

  for (const post of publishedThisWeek) {
    publishedByChannel[post.channel] += 1;
  }
  for (const post of scheduledNext7d) {
    scheduledByChannel[post.channel] += 1;
  }

  const avgEngagementThisWeek = Math.round(average(publishedThisWeek.map((post) => post.engagement)));
  const avgEngagementPreviousWeek = Math.round(average(publishedPreviousWeek.map((post) => post.engagement)));

  const topPosts = [...publishedThisWeek]
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 3)
    .map((post) => ({
      title: post.title,
      channel: post.channel,
      date: formatDate(post.date),
      engagement: post.engagement,
    }));

  const alertHighlights = alerts.slice(0, 3).map((alert) => alert.message);

  return {
    start,
    end,
    stats: {
      publishedThisWeek: publishedThisWeek.length,
      publishedPreviousWeek: publishedPreviousWeek.length,
      scheduledNext7d: scheduledNext7d.length,
      contactsThisWeek: contactsThisWeek.length,
      contactsPreviousWeek: contactsPreviousWeek.length,
      activeAlerts: alerts.length,
      averageEngagementThisWeek: avgEngagementThisWeek,
      averageEngagementPreviousWeek: avgEngagementPreviousWeek,
      engagementChange: pctChange(avgEngagementThisWeek, avgEngagementPreviousWeek),
      contactsChange: pctChange(contactsThisWeek.length, contactsPreviousWeek.length),
      publishedByChannel,
      scheduledByChannel,
      topPosts,
      alertHighlights,
    },
  };
}

function buildHighlights(stats: WeeklyStats): string[] {
  const highlights: string[] = [];

  highlights.push(`${stats.publishedThisWeek} posts publicados na última semana.`);
  highlights.push(`${stats.contactsThisWeek} novos contatos recebidos pela landing page.`);

  if (stats.averageEngagementThisWeek > 0) {
    const signal = stats.engagementChange >= 0 ? 'subiu' : 'caiu';
    highlights.push(`Engajamento médio ${signal} ${Math.abs(stats.engagementChange)}% vs semana anterior.`);
  }

  if (stats.scheduledNext7d > 0) {
    highlights.push(`${stats.scheduledNext7d} conteúdos já estão agendados para os próximos 7 dias.`);
  }

  if (stats.activeAlerts > 0) {
    highlights.push(`${stats.activeAlerts} alerta(s) ativo(s) exigem atenção no dashboard.`);
  }

  return highlights;
}

function buildSubject(start: Date, end: Date): string {
  const endInclusive = new Date(end);
  endInclusive.setDate(endInclusive.getDate() - 1);
  return `Resumo semanal do dashboard • ${formatDate(start)} a ${formatDate(endInclusive)}`;
}

function buildEmailContent(start: Date, end: Date, stats: WeeklyStats) {
  const endInclusive = new Date(end);
  endInclusive.setDate(endInclusive.getDate() - 1);

  const lines = [
    `Resumo semanal do dashboard`,
    `Período: ${formatDate(start)} a ${formatDate(endInclusive)}`,
    '',
    `Posts publicados: ${stats.publishedThisWeek} (${stats.publishedByChannel.Instagram} Instagram, ${stats.publishedByChannel.GMB} GMB, ${stats.publishedByChannel.Blog} Blog, ${stats.publishedByChannel.Email} Email)`,
    `Novos contatos: ${stats.contactsThisWeek}`,
    `Engajamento médio: ${stats.averageEngagementThisWeek} (${stats.engagementChange >= 0 ? '+' : ''}${stats.engagementChange}% vs semana anterior)`,
    `Alertas ativos: ${stats.activeAlerts}`,
    `Agendados para os próximos 7 dias: ${stats.scheduledNext7d}`,
    '',
    `Top posts da semana:`,
    ...(
      stats.topPosts.length > 0
        ? stats.topPosts.map((post, index) => `${index + 1}. [${post.channel}] ${post.title} — ${post.engagement} interações (${post.date})`)
        : ['Nenhum post publicado na semana.']
    ),
    '',
    `Alertas em destaque:`,
    ...(stats.alertHighlights.length > 0 ? stats.alertHighlights.map((alert) => `- ${alert}`) : ['Nenhum alerta ativo.']),
  ];

  const htmlTopPosts = stats.topPosts.length > 0
    ? stats.topPosts.map((post) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(post.title)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(post.channel)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${post.engagement}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">${post.date}</td>
        </tr>`).join('')
    : '<tr><td colspan="4" style="padding:8px 0;color:#666;">Nenhum post publicado no período.</td></tr>';

  const htmlAlerts = stats.alertHighlights.length > 0
    ? `<ul style="padding-left:18px; margin:8px 0; color:#334155;">${stats.alertHighlights.map((alert) => `<li style="margin:6px 0;">${escapeHtml(alert)}</li>`).join('')}</ul>`
    : '<p style="color:#16a34a; margin:8px 0;">Nenhum alerta ativo no momento.</p>';

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
        <div style="padding:28px 28px 18px;background:linear-gradient(135deg,#1e293b,#334155);color:#fff;">
          <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.75;">Dashboard Fernanda</div>
          <h1 style="margin:10px 0 6px;font-size:28px;line-height:1.2;">Resumo semanal</h1>
          <p style="margin:0;font-size:15px;opacity:.9;">Período: ${formatDate(start)} a ${formatDate(endInclusive)}</p>
        </div>

        <div style="padding:24px 28px;">
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;">
              <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Posts publicados</div>
              <div style="font-size:30px;font-weight:700;margin-top:6px;">${stats.publishedThisWeek}</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;">
              <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Novos contatos</div>
              <div style="font-size:30px;font-weight:700;margin-top:6px;">${stats.contactsThisWeek}</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;">
              <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Engajamento médio</div>
              <div style="font-size:30px;font-weight:700;margin-top:6px;">${stats.averageEngagementThisWeek}</div>
              <div style="font-size:13px;color:${stats.engagementChange >= 0 ? '#15803d' : '#b91c1c'};margin-top:6px;">${stats.engagementChange >= 0 ? '+' : ''}${stats.engagementChange}% vs semana anterior</div>
            </div>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;">
              <div style="font-size:12px;color:#64748b;text-transform:uppercase;">Alertas ativos</div>
              <div style="font-size:30px;font-weight:700;margin-top:6px;">${stats.activeAlerts}</div>
            </div>
          </div>

          <div style="margin-top:26px;">
            <h2 style="font-size:18px;margin:0 0 10px;">Canais publicados na semana</h2>
            <p style="margin:0;color:#334155;line-height:1.7;">Instagram: ${stats.publishedByChannel.Instagram} · GMB: ${stats.publishedByChannel.GMB} · Blog: ${stats.publishedByChannel.Blog} · Email: ${stats.publishedByChannel.Email}</p>
          </div>

          <div style="margin-top:26px;">
            <h2 style="font-size:18px;margin:0 0 10px;">Top posts</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="text-align:left;color:#64748b;">
                  <th style="padding:0 0 8px;">Título</th>
                  <th style="padding:0 0 8px;">Canal</th>
                  <th style="padding:0 0 8px;">Interações</th>
                  <th style="padding:0 0 8px;">Data</th>
                </tr>
              </thead>
              <tbody>${htmlTopPosts}</tbody>
            </table>
          </div>

          <div style="margin-top:26px;">
            <h2 style="font-size:18px;margin:0 0 10px;">Alertas em destaque</h2>
            ${htmlAlerts}
          </div>

          <div style="margin-top:26px;padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;">
            <strong>Próximos 7 dias:</strong> ${stats.scheduledNext7d} conteúdo(s) agendado(s).<br />
            <span style="color:#475569;">Instagram: ${stats.scheduledByChannel.Instagram} · GMB: ${stats.scheduledByChannel.GMB} · Blog: ${stats.scheduledByChannel.Blog} · Email: ${stats.scheduledByChannel.Email}</span>
          </div>
        </div>
      </div>
    </div>`;

  return { text: lines.join('\n'), html };
}

function getEmailConfig(options?: RunOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = options?.from || process.env.REPORT_EMAIL_FROM || 'onboarding@resend.dev';
  const to = options?.to || process.env.REPORT_EMAIL_TO || '';

  if (!apiKey) {
    throw new Error('RESEND_API_KEY não configurado');
  }

  if (!to) {
    throw new Error('REPORT_EMAIL_TO não configurado');
  }

  return { apiKey, from, to };
}

async function sendViaResend(config: { apiKey: string; from: string; to: string }, subject: string, html: string, text: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      subject,
      html,
      text,
    }),
  });

  const data = await response.json() as any;
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Erro ao enviar email (${response.status})`);
  }

  return String(data?.id ?? '');
}

export async function runWeeklyReport(
  triggeredBy: TriggeredBy,
  dryRun: boolean,
  options?: RunOptions,
): Promise<WeeklyReportSummary> {
  const startedAt = new Date();

  try {
    const [posts, messages, alerts] = await Promise.all([
      getRecentPosts(200),
      getRecentMessages(200),
      getActiveAlerts(20),
    ]);

    const { stats, start, end } = buildStats(posts, messages, alerts, startedAt);
    const subject = buildSubject(start, end);
    const { html, text } = buildEmailContent(start, end, stats);
    const highlights = buildHighlights(stats);

    let recipient: string | null = options?.to || process.env.REPORT_EMAIL_TO || null;
    let sendId: string | undefined;
    let sent = false;

    if (!dryRun) {
      const emailConfig = getEmailConfig(options);
      recipient = emailConfig.to;
      sendId = await sendViaResend(emailConfig, subject, html, text);
      sent = true;
    }

    const finishedAt = new Date();
    const summary: WeeklyReportSummary = {
      success: true,
      triggeredBy,
      dryRun,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      recipient,
      subject,
      sent,
      sendId,
      postsPublished: stats.publishedThisWeek,
      contactsReceived: stats.contactsThisWeek,
      activeAlerts: stats.activeAlerts,
      scheduledNext7d: stats.scheduledNext7d,
      highlights,
    };

    if (!dryRun) {
      const db = getAdminDb();
      await db.collection('weekly_reports_logs').add({
        ...summary,
        createdAt: Timestamp.now(),
        generatedAt: formatDateTime(startedAt),
      });
    }

    return summary;
  } catch (error: any) {
    const finishedAt = new Date();
    return {
      success: false,
      triggeredBy,
      dryRun,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      periodStart: '',
      periodEnd: '',
      recipient: options?.to || process.env.REPORT_EMAIL_TO || null,
      subject: 'Resumo semanal do dashboard',
      sent: false,
      postsPublished: 0,
      contactsReceived: 0,
      activeAlerts: 0,
      scheduledNext7d: 0,
      highlights: [],
      error: String(error?.message ?? error),
    };
  }
}