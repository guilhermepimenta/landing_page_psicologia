import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function — métricas do Instagram via Graph API.
 *
 * GET /api/instagram-metrics
 *   → Retorna: account info, account insights (30d), recent media + per-media insights
 *
 * GET /api/instagram-metrics?mediaId=123
 *   → Retorna: insights detalhados de um post específico
 */

const IG_GRAPH_API = 'https://graph.instagram.com/v21.0';
const FB_GRAPH_API = 'https://graph.facebook.com/v21.0';

function getCredentials() {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!accessToken || !userId) {
    throw new Error('INSTAGRAM_ACCESS_TOKEN ou INSTAGRAM_USER_ID não configurados');
  }
  return { accessToken, userId };
}

async function graphGet(
  path: string,
  params: Record<string, string>,
  accessToken: string,
  baseUrl: string = IG_GRAPH_API,
) {
  const query = new URLSearchParams({ ...params, access_token: accessToken });
  const response = await fetch(`${baseUrl}${path}?${query.toString()}`);
  const data = (await response.json()) as any;
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Graph API error: ${response.status}`);
  }
  return data;
}

/* ── Account info ─────────────────────────────────────────────────── */
async function getAccountInfo(userId: string, accessToken: string) {
  return graphGet(
    `/${userId}`,
    { fields: 'username,name,profile_picture_url,followers_count,follows_count,media_count,biography' },
    accessToken,
  );
}

/* ── Account-level insights (day period) ──────────────────────────── */
async function getAccountInsights(userId: string, accessToken: string) {
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

  const attempts = [
    { metric: 'impressions,reach,profile_views', baseUrl: IG_GRAPH_API, source: 'ig:impressions' },
    { metric: 'impressions,reach,profile_views', baseUrl: FB_GRAPH_API, source: 'fb:impressions' },
    { metric: 'views,reach,profile_views', baseUrl: IG_GRAPH_API, source: 'ig:views' },
    { metric: 'views,reach,profile_views', baseUrl: FB_GRAPH_API, source: 'fb:views' },
  ] as const;

  const errors: string[] = [];

  for (const attempt of attempts) {
    try {
      const data = await graphGet(
        `/${userId}/insights`,
        {
          metric: attempt.metric,
          period: 'day',
          since: String(thirtyDaysAgo),
          until: String(now),
        },
        accessToken,
        attempt.baseUrl,
      );

      const rows = Array.isArray(data.data) ? data.data : [];
      if (rows.length > 0) {
        return { data: rows, source: attempt.source, errors };
      }
    } catch (e: any) {
      errors.push(`${attempt.source}: ${String(e?.message ?? e)}`);
    }
  }

  // Insights may be restricted by account/token. The caller can fallback to media insights.
  return { data: [] as any[], source: 'none', errors };
}

/* ── Recent media ─────────────────────────────────────────────────── */
async function getRecentMedia(userId: string, accessToken: string, limit = 25) {
  const data = await graphGet(
    `/${userId}/media`,
    { fields: 'id,caption,timestamp,like_count,comments_count,media_url,permalink,media_type,thumbnail_url', limit: String(limit) },
    accessToken,
  );
  return data.data ?? [];
}

/* ── Per-media insights ───────────────────────────────────────────── */
async function getMediaInsights(mediaId: string, accessToken: string) {
  const attempts = [
    { metric: 'impressions,reach,total_interactions,saved', baseUrl: IG_GRAPH_API },
    { metric: 'impressions,reach,total_interactions,saved', baseUrl: FB_GRAPH_API },
    { metric: 'views,reach,total_interactions,saved', baseUrl: IG_GRAPH_API },
    { metric: 'views,reach,total_interactions,saved', baseUrl: FB_GRAPH_API },
  ] as const;

  for (const attempt of attempts) {
    try {
      const data = await graphGet(
        `/${mediaId}/insights`,
        { metric: attempt.metric },
        accessToken,
        attempt.baseUrl,
      );
      const result: Record<string, number> = {};
      for (const m of data.data ?? []) {
        result[m.name] = m.values?.[0]?.value ?? 0;
      }
      if (Object.keys(result).length > 0) {
        return result;
      }
    } catch {
      // Try next source/metric combination.
    }
  }

  return null;
}

/* ── Handler ──────────────────────────────────────────────────────── */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  let creds: ReturnType<typeof getCredentials>;
  try {
    creds = getCredentials();
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }

  const { accessToken, userId } = creds;
  const { mediaId } = req.query;

  try {
    // Single media insights
    if (mediaId && typeof mediaId === 'string') {
      const insights = await getMediaInsights(mediaId, accessToken);
      return res.status(200).json({ success: true, insights });
    }

    // Full dashboard payload
    const [account, accountInsightsResult, media] = await Promise.all([
      getAccountInfo(userId, accessToken),
      getAccountInsights(userId, accessToken),
      getRecentMedia(userId, accessToken, 25),
    ]);

    const insights = accountInsightsResult.data;

    // Fetch insights for top 10 media (parallel, limited)
    const mediaWithInsights = await Promise.all(
      media.slice(0, 10).map(async (m: any) => {
        const mi = await getMediaInsights(m.id, accessToken);
        return { ...m, insights: mi };
      }),
    );

    // Parse account insights into daily arrays
    const dailyMetrics: Record<string, { date: string; impressions: number; reach: number; profileViews: number }> = {};

    for (const metric of insights) {
      const metricName = metric.name;
      for (const val of metric.values ?? []) {
        const date = val.end_time?.split('T')[0] ?? '';
        if (!date) continue;
        if (!dailyMetrics[date]) {
          dailyMetrics[date] = { date, impressions: 0, reach: 0, profileViews: 0 };
        }
        if (metricName === 'impressions') dailyMetrics[date].impressions = val.value;
        if (metricName === 'reach') dailyMetrics[date].reach = val.value;
        if (metricName === 'profile_views') dailyMetrics[date].profileViews = val.value;
      }
    }

    let dailyData = Object.values(dailyMetrics).sort((a, b) => a.date.localeCompare(b.date));

    let usedMediaFallback = false;

    // If account-level insights are not available, aggregate from media insights by post day.
    if (dailyData.length === 0) {
      const fallback: Record<string, { date: string; impressions: number; reach: number; profileViews: number }> = {};
      for (const m of mediaWithInsights) {
        if (!m.timestamp || !m.insights) continue;
        const date = String(m.timestamp).split('T')[0];
        if (!date) continue;
        if (!fallback[date]) {
          fallback[date] = { date, impressions: 0, reach: 0, profileViews: 0 };
        }

        const impressions = Number(m.insights.impressions ?? m.insights.views ?? 0);
        const reach = Number(m.insights.reach ?? 0);

        fallback[date].impressions += Number.isFinite(impressions) ? impressions : 0;
        fallback[date].reach += Number.isFinite(reach) ? reach : 0;
      }

      dailyData = Object.values(fallback).sort((a, b) => a.date.localeCompare(b.date));
      usedMediaFallback = dailyData.length > 0;
    }

    // Compute summary
    const totalImpressions = dailyData.reduce((s, d) => s + d.impressions, 0);
    const totalReach = dailyData.reduce((s, d) => s + d.reach, 0);
    const totalProfileViews = dailyData.reduce((s, d) => s + d.profileViews, 0);

    // Compare first half vs second half for trends
    const half = Math.floor(dailyData.length / 2);
    const firstHalf = dailyData.slice(0, half);
    const secondHalf = dailyData.slice(half);
    const sumField = (arr: typeof dailyData, field: 'impressions' | 'reach' | 'profileViews') =>
      arr.reduce((s, d) => s + d[field], 0) || 1;

    const calcChange = (current: number, previous: number) => {
      if (previous <= 0) return current > 0 ? 100 : 0;
      return Math.round(((current / previous) - 1) * 100);
    };

    const impressionsChange = calcChange(sumField(secondHalf, 'impressions'), sumField(firstHalf, 'impressions'));
    const reachChange = calcChange(sumField(secondHalf, 'reach'), sumField(firstHalf, 'reach'));
    const profileViewsChange = calcChange(sumField(secondHalf, 'profileViews'), sumField(firstHalf, 'profileViews'));

    // Top posts by engagement (likes + comments)
    const topPosts = [...mediaWithInsights]
      .sort((a, b) => ((b.like_count ?? 0) + (b.comments_count ?? 0)) - ((a.like_count ?? 0) + (a.comments_count ?? 0)));

    // Best hour analysis
    const hourBuckets: Record<number, { totalEng: number; count: number }> = {};
    for (const m of media) {
      if (!m.timestamp) continue;
      const hour = new Date(m.timestamp).getHours();
      if (!hourBuckets[hour]) hourBuckets[hour] = { totalEng: 0, count: 0 };
      hourBuckets[hour].totalEng += (m.like_count ?? 0) + (m.comments_count ?? 0);
      hourBuckets[hour].count += 1;
    }
    const bestHours = Object.entries(hourBuckets)
      .map(([hour, data]) => ({ hour: Number(hour), avgEngagement: Math.round(data.totalEng / data.count), posts: data.count }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement);

    // Total engagement from media
    const totalEngagement = media.reduce((s: number, m: any) => s + (m.like_count ?? 0) + (m.comments_count ?? 0), 0);
    const engagementRate = account.followers_count > 0
      ? Math.round((totalEngagement / media.length / account.followers_count) * 10000) / 100
      : 0;

    return res.status(200).json({
      success: true,
      account: {
        username: account.username,
        name: account.name,
        profilePicture: account.profile_picture_url,
        followers: account.followers_count,
        following: account.follows_count,
        mediaCount: account.media_count,
        biography: account.biography,
      },
      summary: {
        totalImpressions,
        totalReach,
        totalProfileViews,
        totalEngagement,
        engagementRate,
        impressionsChange,
        reachChange,
        profileViewsChange,
      },
      diagnostics: {
        accountInsightsSource: accountInsightsResult.source,
        usedMediaFallback,
        accountInsightsErrors: accountInsightsResult.errors.slice(0, 4),
      },
      dailyData,
      topPosts,
      bestHours,
      recentMedia: media,
    });
  } catch (e: any) {
    return res.status(502).json({ success: false, error: e.message });
  }
}
