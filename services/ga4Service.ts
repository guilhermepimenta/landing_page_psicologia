/**
 * Serviço frontend para consumir a Vercel Function /api/analytics
 * que conecta com o Google Analytics 4 Data API.
 */

export interface WeeklyRow {
  dia: string;
  Instagram: number;
  GMB: number;
  Blog: number;
  Email: number;
}

export interface MonthlyRow {
  mes: string;
  leads: number;
  conversoes: number;
}

export interface MetricRow {
  metrica: string;
  valor: number;
  variacao: number;
}

export interface TopPageRow {
  page: string;
  views: number;
  sessions: number;
}

export interface DeviceRow {
  device: string;
  sessions: number;
}

export interface SourceRow {
  source: string;
  sessions: number;
  conversions: number;
}

export interface GA4Response {
  weeklyEngagement: WeeklyRow[];
  monthlyTrend: MonthlyRow[];
  summaryMetrics: MetricRow[];
  topPages: TopPageRow[];
  deviceBreakdown: DeviceRow[];
  trafficSources: SourceRow[];
}

export interface GA4RealtimeResponse {
  activeUsers: number;
}

const API_URL = '/api/analytics';

// Em desenvolvimento local (Vite dev server), a Vercel Function não existe.
export const isDevMode = import.meta.env.DEV;

export async function getGA4Data(): Promise<GA4Response> {
  if (isDevMode) {
    throw new Error('__dev_mode__');
  }
  const res = await fetch(API_URL);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  try {
    return await res.json() as GA4Response;
  } catch {
    throw new Error('Resposta inválida da API — verifique o deploy no Vercel');
  }
}

export async function getGA4Realtime(): Promise<GA4RealtimeResponse> {
  if (isDevMode) {
    throw new Error('__dev_mode__');
  }
  const res = await fetch(`${API_URL}?mode=realtime`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<GA4RealtimeResponse>;
}
