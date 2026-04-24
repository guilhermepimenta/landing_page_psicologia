/**
 * Serviço frontend para consumir a Vercel Function /api/instagram-metrics
 * que conecta com a Instagram Graph API.
 */

export interface InstagramAccount {
  username: string;
  name: string;
  profilePicture: string;
  followers: number;
  following: number;
  mediaCount: number;
  biography: string;
  website?: string;
}

export interface InstagramSummary {
  totalImpressions: number;
  totalReach: number;
  totalProfileViews: number;
  totalEngagement: number;
  engagementRate: number;
  totalSaves: number;
  totalShares: number;
  websiteClicks: number;
  emailContacts: number;
  phoneClicks: number;
  followersGained: number;
  impressionsChange: number;
  reachChange: number;
  profileViewsChange: number;
}

export interface InstagramDailyRow {
  date: string;
  impressions: number;
  reach: number;
  profileViews: number;
}

export interface InstagramMediaItem {
  id: string;
  caption: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  media_url: string;
  permalink: string;
  media_type: string;
  thumbnail_url?: string;
  insights?: {
    impressions?: number;
    reach?: number;
    total_interactions?: number;
    saved?: number;
    shares?: number;
    video_views?: number;
  } | null;
}

export interface InstagramBestHour {
  hour: number;
  avgEngagement: number;
  posts: number;
}

export interface InstagramBestDay {
  day: number;
  dayName: string;
  avgEngagement: number;
  posts: number;
}

export interface InstagramOnlineHour {
  hour: number;
  avgFollowers: number;
}

export interface InstagramMetricsResponse {
  account: InstagramAccount;
  summary: InstagramSummary;
  dailyData: InstagramDailyRow[];
  topPosts: InstagramMediaItem[];
  bestHours: InstagramBestHour[];
  bestDays: InstagramBestDay[];
  onlineFollowers: InstagramOnlineHour[];
  recentMedia: InstagramMediaItem[];
}

const API_URL = '/api/instagram-metrics';

export const isDevMode = import.meta.env.DEV;

export async function getInstagramMetrics(): Promise<InstagramMetricsResponse> {
  if (isDevMode) {
    throw new Error('__dev_mode__');
  }

  const res = await fetch(API_URL);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error ?? 'Erro desconhecido');
  }

  return data as InstagramMetricsResponse;
}

export async function getInstagramMediaInsights(mediaId: string) {
  if (isDevMode) {
    throw new Error('__dev_mode__');
  }

  const res = await fetch(`${API_URL}?mediaId=${encodeURIComponent(mediaId)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.insights;
}
