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

export interface GA4Response {
  weeklyEngagement: WeeklyRow[];
  monthlyTrend: MonthlyRow[];
  summaryMetrics: MetricRow[];
}

const API_URL = '/api/analytics';

// Em desenvolvimento local (Vite dev server), a Vercel Function não existe.
// Só chamamos a API em produção (Vercel) ou quando explicitamente forçado.
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
    return await res.json() as Promise<GA4Response>;
  } catch {
    throw new Error('Resposta inválida da API — verifique o deploy no Vercel');
  }
}
