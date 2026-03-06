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

// Em desenvolvimento (sem Vercel), podemos chamar a função via Vercel CLI (vercel dev)
// ou usar os dados fallback. Em produção, /api/analytics é resolvido automaticamente.
const API_URL = '/api/analytics';

export async function getGA4Data(): Promise<GA4Response> {
  const res = await fetch(API_URL);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<GA4Response>;
}
