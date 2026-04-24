/**
 * Serviço frontend para consumir /api/facebook-metrics
 * que conecta com a Facebook Graph API — insights da Página.
 */

export interface FacebookPage {
  name: string;
  about: string;
  category: string;
  fans: number;
  followers: number;
  picture: string;
  link: string;
}

export interface FacebookSummary {
  totalImpressions: number;
  totalReach: number;
  totalEngagement: number;
  totalViews: number;
  newFans: number;
  impressionsChange: number;
  reachChange: number;
  engagementChange: number;
}

export interface FacebookDailyRow {
  date: string;
  impressions: number;
  reach: number;
  engagement: number;
  views: number;
  newFans: number;
}

export interface FacebookPost {
  id: string;
  message: string;
  createdTime: string;
  picture: string | null;
  permalink: string;
  reactions: number;
  comments: number;
  shares: number;
  totalEngagement: number;
}

export interface FacebookBestDay {
  day: number;
  dayName: string;
  avgEngagement: number;
  posts: number;
}

export interface FacebookMonthlyRow {
  mes: string;
  posts: number;
  engajamento: number;
}

export interface FacebookMetricsResponse {
  page: FacebookPage;
  summary: FacebookSummary;
  dailyData: FacebookDailyRow[];
  topPosts: FacebookPost[];
  bestDays: FacebookBestDay[];
  monthlyTrend: FacebookMonthlyRow[];
}

const API_URL = '/api/facebook-metrics';

export const isDevMode = import.meta.env.DEV;

export async function getFacebookMetrics(): Promise<FacebookMetricsResponse> {
  if (isDevMode) {
    throw new Error('__dev_mode__');
  }

  const res = await fetch(API_URL);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.error ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error ?? 'Erro desconhecido');
  }

  return data as FacebookMetricsResponse;
}
