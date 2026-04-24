import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function — Facebook Page: métricas + publicação.
 *
 * GET  /api/facebook  → Insights da Página (30 dias)
 * POST /api/facebook  → Publica post (texto + foto opcional)
 *
 * Variáveis de ambiente (Vercel Dashboard):
 *   FACEBOOK_PAGE_ACCESS_TOKEN  → Page Access Token
 *   FACEBOOK_PAGE_ID            → ID numérico da Página
 */

const FB_GRAPH   = 'https://graph.facebook.com/v21.0';
const MONTHS_PT  = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DAYS_PT    = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getCredentials() {
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId      = process.env.FACEBOOK_PAGE_ID;
  if (!accessToken || !pageId) {
    throw new Error('FACEBOOK_PAGE_ACCESS_TOKEN ou FACEBOOK_PAGE_ID não configurados');
  }
  return { accessToken, pageId };
}

async function graphGet(path: string, params: Record<string, string>, accessToken: string) {
  const query    = new URLSearchParams({ ...params, access_token: accessToken });
  const response = await fetch(`${FB_GRAPH}${path}?${query.toString()}`);
  const data     = (await response.json()) as any;
  if (!response.ok || data.error) throw new Error(data.error?.message ?? `Facebook API error: ${response.status}`);
  return data;
}

/* ── GET helpers ──────────────────────────────────────────────────── */

async function getPageInfo(pageId: string, token: string) {
  return graphGet(`/${pageId}`, {
    fields: 'name,about,category,fan_count,followers_count,picture.type(large),link,website,cover',
  }, token);
}

async function getPageInsights(pageId: string, token: string) {
  const now          = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
  const errors: string[] = [];

  for (const metric of [
    'page_impressions,page_impressions_unique,page_engaged_users,page_views_total,page_fan_adds',
    'page_impressions,page_impressions_unique,page_engaged_users,page_views_total',
  ]) {
    try {
      const data = await graphGet(`/${pageId}/insights`, {
        metric, period: 'day', since: String(thirtyDaysAgo), until: String(now),
      }, token);
      if ((data.data ?? []).length > 0) return { data: data.data, errors };
    } catch (e: any) { errors.push(String(e?.message ?? e)); }
  }
  return { data: [] as any[], errors };
}

async function getPagePosts(pageId: string, token: string, limit = 25) {
  try {
    const data = await graphGet(`/${pageId}/posts`, {
      fields: 'id,message,created_time,full_picture,permalink_url,reactions.summary(true),comments.summary(true),shares',
      limit: String(limit),
    }, token);
    return data.data ?? [];
  } catch { return []; }
}

function buildMonthlyTrend(posts: any[]) {
  const byMonth: Record<string, { posts: number; eng: number }> = {};
  for (const p of posts) {
    if (!p.created_time) continue;
    const d   = new Date(p.created_time);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = { posts: 0, eng: 0 };
    byMonth[key].posts += 1;
    byMonth[key].eng   += (p.reactions?.summary?.total_count ?? 0) + (p.comments?.summary?.total_count ?? 0) + (p.shares?.count ?? 0);
  }
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b)).slice(-6)
    .map(([key, val]) => ({ mes: MONTHS_PT[parseInt(key.slice(5, 7), 10) - 1], posts: val.posts, engajamento: val.eng }));
}

/* ── Handler ──────────────────────────────────────────────────────── */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let creds: ReturnType<typeof getCredentials>;
  try { creds = getCredentials(); } catch (e: any) { return res.status(500).json({ error: e.message }); }

  const { accessToken, pageId } = creds;

  /* ── POST: publicar na Página ─────────────────────────────────── */
  if (req.method === 'POST') {
    const { message, imageUrl } = req.body ?? {};
    if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message é obrigatório' });

    try {
      let endpoint: string;
      let body: Record<string, string>;

      if (imageUrl && typeof imageUrl === 'string') {
        endpoint = `${FB_GRAPH}/${pageId}/photos`;
        body     = { url: imageUrl, message, published: 'true', access_token: accessToken };
      } else {
        endpoint = `${FB_GRAPH}/${pageId}/feed`;
        body     = { message, access_token: accessToken };
      }

      const fbRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await fbRes.json()) as any;
      if (!fbRes.ok || data.error) throw new Error(data.error?.message ?? `Facebook API error: ${fbRes.status}`);

      return res.status(200).json({
        success:   true,
        postId:    data.id ?? data.post_id,
        permalink: `https://www.facebook.com/${data.id ?? data.post_id}`,
      });
    } catch (e: any) {
      return res.status(502).json({ success: false, error: e.message });
    }
  }

  /* ── GET: métricas da Página ──────────────────────────────────── */
  if (req.method === 'GET') {
    try {
      const [pageInfo, insightsResult, posts] = await Promise.all([
        getPageInfo(pageId, accessToken),
        getPageInsights(pageId, accessToken),
        getPagePosts(pageId, accessToken),
      ]);

      const dailyMap: Record<string, { date: string; impressions: number; reach: number; engagement: number; views: number; newFans: number }> = {};
      for (const metric of insightsResult.data) {
        for (const val of metric.values ?? []) {
          const date: string = (val.end_time ?? '').split('T')[0];
          if (!date) continue;
          if (!dailyMap[date]) dailyMap[date] = { date, impressions: 0, reach: 0, engagement: 0, views: 0, newFans: 0 };
          if (metric.name === 'page_impressions')        dailyMap[date].impressions = val.value;
          if (metric.name === 'page_impressions_unique') dailyMap[date].reach       = val.value;
          if (metric.name === 'page_engaged_users')      dailyMap[date].engagement  = val.value;
          if (metric.name === 'page_views_total')        dailyMap[date].views       = val.value;
          if (metric.name === 'page_fan_adds')           dailyMap[date].newFans     = val.value;
        }
      }
      const dailyData = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

      const totalImpressions = dailyData.reduce((s, d) => s + d.impressions, 0);
      const totalReach       = dailyData.reduce((s, d) => s + d.reach,       0);
      const totalEngagement  = dailyData.reduce((s, d) => s + d.engagement,  0);
      const totalViews       = dailyData.reduce((s, d) => s + d.views,       0);
      const newFans          = dailyData.reduce((s, d) => s + d.newFans,     0);

      const half   = Math.floor(dailyData.length / 2);
      const first  = dailyData.slice(0, half);
      const second = dailyData.slice(half);
      const sumF   = (arr: typeof dailyData, f: keyof (typeof dailyData)[0]) => arr.reduce((s, d) => s + (d[f] as number), 0) || 1;
      const pct    = (c: number, p: number) => p <= 0 ? (c > 0 ? 100 : 0) : Math.round(((c / p) - 1) * 100);

      const topPosts = [...posts]
        .map((p: any) => ({
          id: p.id, message: p.message ?? '', createdTime: p.created_time,
          picture: p.full_picture ?? null,
          permalink: p.permalink_url ?? `https://www.facebook.com/${p.id}`,
          reactions: p.reactions?.summary?.total_count ?? 0,
          comments:  p.comments?.summary?.total_count  ?? 0,
          shares:    p.shares?.count ?? 0,
          totalEngagement: (p.reactions?.summary?.total_count ?? 0) + (p.comments?.summary?.total_count ?? 0) + (p.shares?.count ?? 0),
        }))
        .sort((a, b) => b.totalEngagement - a.totalEngagement).slice(0, 5);

      const dayBuckets: Record<number, { totalEng: number; count: number }> = {};
      for (const p of posts) {
        if (!p.created_time) continue;
        const day = new Date(p.created_time).getDay();
        if (!dayBuckets[day]) dayBuckets[day] = { totalEng: 0, count: 0 };
        dayBuckets[day].totalEng += (p.reactions?.summary?.total_count ?? 0) + (p.comments?.summary?.total_count ?? 0) + (p.shares?.count ?? 0);
        dayBuckets[day].count    += 1;
      }
      const bestDays = Object.entries(dayBuckets)
        .map(([day, d]) => ({ day: Number(day), dayName: DAYS_PT[Number(day)], avgEngagement: Math.round(d.totalEng / d.count), posts: d.count }))
        .sort((a, b) => a.day - b.day);

      res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300');
      return res.status(200).json({
        success: true,
        page: {
          name: pageInfo.name, about: pageInfo.about ?? '', category: pageInfo.category ?? '',
          fans: pageInfo.fan_count ?? 0, followers: pageInfo.followers_count ?? 0,
          picture: pageInfo.picture?.data?.url ?? '',
          link: pageInfo.link ?? `https://www.facebook.com/${pageId}`,
        },
        summary: {
          totalImpressions, totalReach, totalEngagement, totalViews, newFans,
          impressionsChange: pct(sumF(second, 'impressions'), sumF(first, 'impressions')),
          reachChange:       pct(sumF(second, 'reach'),       sumF(first, 'reach')),
          engagementChange:  pct(sumF(second, 'engagement'),  sumF(first, 'engagement')),
        },
        diagnostics: { insightsErrors: insightsResult.errors.slice(0, 3), postsAnalyzed: posts.length },
        dailyData, topPosts, bestDays, monthlyTrend: buildMonthlyTrend(posts),
      });
    } catch (e: any) {
      return res.status(502).json({ success: false, error: (e as Error).message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
