/**
 * Serviço frontend para consumir a Vercel Function /api/search-console
 * que conecta com a Google Search Console API.
 */

export interface GSCDailyRow {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCSummary {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  clicksChange: number;
  impressionsChange: number;
  ctrChange: number;
  positionChange: number;
}

export interface GSCResponse {
  dailyData: GSCDailyRow[];
  topPages: GSCPageRow[];
  topQueries: GSCQueryRow[];
  summary: GSCSummary;
}

const API_URL = '/api/search-console';

export const isDevMode = import.meta.env.DEV;

export async function getGSCData(): Promise<GSCResponse> {
  if (isDevMode) {
    throw new Error('__dev_mode__');
  }
  const res = await fetch(API_URL);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}
