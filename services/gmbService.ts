/**
 * Serviço frontend para consumir a Vercel Function /api/gmb
 * que conecta com a Google Business Profile Performance API.
 */

export interface GMBDailyView {
  date: string;
  views: number;
}

export interface GMBSummary {
  totalViews: number;
  searchViews: number;
  mapsViews: number;
  websiteClicks: number;
  callClicks: number;
  directionRequests: number;
  viewsChange: number;
  clicksChange: number;
  callsChange: number;
  directionsChange: number;
}

export interface GMBResponse {
  location: { title: string } | null;
  summary: GMBSummary;
  dailyViews: GMBDailyView[];
  error?: string;
}

const API_URL = '/api/gmb';

export const isDevMode = import.meta.env.DEV;

export async function getGMBData(): Promise<GMBResponse> {
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
