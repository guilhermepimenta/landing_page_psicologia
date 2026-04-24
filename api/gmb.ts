import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function — chama a Google Business Profile Performance API.
 *
 * Variáveis de ambiente necessárias no Vercel Dashboard:
 *   GMB_ACCOUNT_ID         → ID da conta GMB (ex: "accounts/123456789")
 *   GMB_LOCATION_ID        → ID da localização (ex: "locations/987654321")
 *   GMB_CLIENT_EMAIL       → client_email do JSON da service account
 *   GMB_PRIVATE_KEY        → private_key do JSON da service account (com \n literais)
 *
 * Endpoint: GET /api/gmb
 */

import { google } from 'googleapis';

function normalizeGMBError(error: any): string {
  const raw = String(
    error?.response?.data?.error?.message
      ?? error?.message
      ?? 'Erro ao consultar Google Meu Negocio',
  );
  const lower = raw.toLowerCase();

  if (
    lower.includes('service_disabled')
    || lower.includes('api has not been used')
    || lower.includes('has not been used in project')
  ) {
    return 'Google Business Profile Performance API nao habilitada no projeto GCP. Ative a API no Google Cloud Console e aguarde alguns minutos para propagacao.';
  }

  if (
    lower.includes('insufficient permission')
    || lower.includes('permission denied')
    || lower.includes('forbidden')
  ) {
    return 'Permissao insuficiente no Google Meu Negocio. Adicione a service account como gerente/proprietario do perfil e confira os escopos de acesso.';
  }

  if (lower.includes('not found')) {
    return 'Conta ou localizacao nao encontrada. Verifique GMB_ACCOUNT_ID e GMB_LOCATION_ID no Vercel.';
  }

  if (lower.includes('private key')) {
    return 'Chave privada invalida. Revise GMB_PRIVATE_KEY no Vercel (com quebras de linha corretas).';
  }

  return raw;
}

function getAuth() {
  const clientEmail = process.env.GMB_CLIENT_EMAIL || process.env.GA4_CLIENT_EMAIL;
  const privateKey = (process.env.GMB_PRIVATE_KEY || process.env.GA4_PRIVATE_KEY)?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('GMB_CLIENT_EMAIL ou GMB_PRIVATE_KEY não configurados');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/business.manage'],
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const locationId = process.env.GMB_LOCATION_ID;

  if (!locationId) {
    return res.status(500).json({ error: 'GMB_LOCATION_ID não configurado' });
  }

  let auth;
  try {
    auth = getAuth();
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }

  // Auto-discover Account ID if not explicitly set
  async function resolveAccountId(): Promise<string> {
    const configured = process.env.GMB_ACCOUNT_ID;
    if (configured) return configured;
    try {
      const token = await auth.getAccessToken();
      const t = typeof token === 'string' ? token : token?.token ?? '';
      const res = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json() as any;
      return (data.accounts?.[0]?.name as string) ?? '';
    } catch {
      return '';
    }
  }

  try {
    const mybusiness = google.mybusinessbusinessinformation({ version: 'v1', auth });

    const accountId = await resolveAccountId();
    // Combine into full resource name when account is available
    const locationName = accountId ? `${accountId}/${locationId}` : locationId;
    let locationData: any = null;
    try {
      const locRes = await mybusiness.locations.get({
        name: locationName,
        readMask: 'name,title,phoneNumbers,websiteUri',
      });
      locationData = locRes.data;
    } catch {
      // Location info is optional; continue if it fails
    }

    // ---- Business Profile Performance API ----
    // The Performance API uses a different endpoint accessed via generic Google API
    const accessToken = await auth.getAccessToken();
    const token = typeof accessToken === 'string' ? accessToken : accessToken?.token;

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 30);
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - 30);

    const fmtDate = (d: Date) => ({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    });

    // Fetch current period metrics via REST
    const metricsUrl = `https://businessprofileperformance.googleapis.com/v1/${locationName}:fetchMultiDailyMetricsTimeSeries`;

    const fetchMetrics = async (start: Date, end: Date) => {
      const params = new URLSearchParams({
        'dailyRange.startDate.year': String(start.getFullYear()),
        'dailyRange.startDate.month': String(start.getMonth() + 1),
        'dailyRange.startDate.day': String(start.getDate()),
        'dailyRange.endDate.year': String(end.getFullYear()),
        'dailyRange.endDate.month': String(end.getMonth() + 1),
        'dailyRange.endDate.day': String(end.getDate()),
      });

      // Add each metric as separate param
      const metricsList = [
        'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
        'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
        'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
        'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
        'CALL_CLICKS',
        'WEBSITE_CLICKS',
        'BUSINESS_DIRECTION_REQUESTS',
      ];
      metricsList.forEach(m => params.append('dailyMetrics', m));

      const response = await fetch(`${metricsUrl}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`GMB Performance API error ${response.status}: ${errBody}`);
      }

      return response.json();
    };

    let currentMetrics: any;
    let prevMetrics: any;

    try {
      [currentMetrics, prevMetrics] = await Promise.all([
        fetchMetrics(startDate, endDate),
        fetchMetrics(prevStartDate, prevEndDate),
      ]);
    } catch (perfErr: any) {
      // If Performance API fails, return basic data
      console.error('GMB Performance API error:', perfErr?.message);
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
      return res.status(200).json({
        location: locationData ? { title: locationData.title } : null,
        summary: {
          totalViews: 0,
          searchViews: 0,
          mapsViews: 0,
          websiteClicks: 0,
          callClicks: 0,
          directionRequests: 0,
          viewsChange: 0,
          clicksChange: 0,
          callsChange: 0,
          directionsChange: 0,
        },
        dailyViews: [],
        error: normalizeGMBError(perfErr),
      });
    }

    // Aggregate metric time series
    const sumMetric = (data: any, metricName: string): number => {
      const series = data?.multiDailyMetricTimeSeries ?? [];
      for (const s of series) {
        if (s.dailyMetricTimeSeries?.dailyMetric === metricName) {
          return (s.dailyMetricTimeSeries?.timeSeries?.datedValues ?? [])
            .reduce((acc: number, v: any) => acc + (Number(v.value) || 0), 0);
        }
      }
      return 0;
    };

    const getDailyViewsTimeSeries = (data: any): Array<{ date: string; views: number }> => {
      const dayMap: Record<string, number> = {};
      const impressionMetrics = [
        'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
        'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
        'BUSINESS_IMPRESSIONS_MOBILE_MAPS',
        'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
      ];
      const series = data?.multiDailyMetricTimeSeries ?? [];
      for (const s of series) {
        const metric = s.dailyMetricTimeSeries?.dailyMetric;
        if (impressionMetrics.includes(metric)) {
          for (const dv of s.dailyMetricTimeSeries?.timeSeries?.datedValues ?? []) {
            const d = dv.date;
            const key = `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
            dayMap[key] = (dayMap[key] || 0) + (Number(dv.value) || 0);
          }
        }
      }
      return Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, views]) => ({ date, views }));
    };

    const currViews =
      sumMetric(currentMetrics, 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS') +
      sumMetric(currentMetrics, 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH') +
      sumMetric(currentMetrics, 'BUSINESS_IMPRESSIONS_MOBILE_MAPS') +
      sumMetric(currentMetrics, 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH');

    const prevViews =
      sumMetric(prevMetrics, 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS') +
      sumMetric(prevMetrics, 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH') +
      sumMetric(prevMetrics, 'BUSINESS_IMPRESSIONS_MOBILE_MAPS') +
      sumMetric(prevMetrics, 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH');

    const currWebClicks = sumMetric(currentMetrics, 'WEBSITE_CLICKS');
    const prevWebClicks = sumMetric(prevMetrics, 'WEBSITE_CLICKS');
    const currCallClicks = sumMetric(currentMetrics, 'CALL_CLICKS');
    const prevCallClicks = sumMetric(prevMetrics, 'CALL_CLICKS');
    const currDirReqs = sumMetric(currentMetrics, 'BUSINESS_DIRECTION_REQUESTS');
    const prevDirReqs = sumMetric(prevMetrics, 'BUSINESS_DIRECTION_REQUESTS');

    const pct = (c: number, p: number) =>
      p === 0 ? 0 : Math.round(((c - p) / p) * 100 * 10) / 10;

    const summary = {
      totalViews: currViews,
      searchViews:
        sumMetric(currentMetrics, 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH') +
        sumMetric(currentMetrics, 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH'),
      mapsViews:
        sumMetric(currentMetrics, 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS') +
        sumMetric(currentMetrics, 'BUSINESS_IMPRESSIONS_MOBILE_MAPS'),
      websiteClicks: currWebClicks,
      callClicks: currCallClicks,
      directionRequests: currDirReqs,
      viewsChange: pct(currViews, prevViews),
      clicksChange: pct(currWebClicks, prevWebClicks),
      callsChange: pct(currCallClicks, prevCallClicks),
      directionsChange: pct(currDirReqs, prevDirReqs),
    };

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json({
      location: locationData ? { title: locationData.title } : null,
      summary,
      dailyViews: getDailyViewsTimeSeries(currentMetrics),
    });

  } catch (error: any) {
    console.error('GMB API error:', error);
    return res.status(500).json({ error: normalizeGMBError(error) });
  }
}
