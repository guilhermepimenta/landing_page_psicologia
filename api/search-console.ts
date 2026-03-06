import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function — chama a Google Search Console API com service account.
 *
 * Variáveis de ambiente necessárias no Vercel Dashboard:
 *   GSC_SITE_URL           → URL da propriedade no Search Console (ex: "https://fernandamangia.com.br")
 *   GSC_CLIENT_EMAIL       → client_email do JSON da service account
 *   GSC_PRIVATE_KEY        → private_key do JSON da service account (com \n literais)
 *
 * Endpoint: GET /api/search-console
 */

import { google } from 'googleapis';

function getAuth() {
  const clientEmail = process.env.GSC_CLIENT_EMAIL || process.env.GA4_CLIENT_EMAIL;
  const privateKey = (process.env.GSC_PRIVATE_KEY || process.env.GA4_PRIVATE_KEY)?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('GSC_CLIENT_EMAIL ou GSC_PRIVATE_KEY não configurados');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) {
    return res.status(500).json({ error: 'GSC_SITE_URL não configurado' });
  }

  let auth;
  try {
    auth = getAuth();
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }

  try {
    const searchconsole = google.searchconsole({ version: 'v1', auth });

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() - 3); // GSC data has ~3 day delay
    const start30 = new Date(end);
    start30.setDate(start30.getDate() - 30);
    const start7 = new Date(end);
    start7.setDate(start7.getDate() - 7);
    const prevStart = new Date(start30);
    prevStart.setDate(prevStart.getDate() - 30);
    const prevEnd = new Date(start30);
    prevEnd.setDate(prevEnd.getDate() - 1);

    // 1. Performance últimos 30 dias (por dia)
    const dailyResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(start30),
        endDate: formatDate(end),
        dimensions: ['date'],
        rowLimit: 30,
      },
    });

    const dailyData = (dailyResponse.data.rows ?? []).map(row => ({
      date: row.keys?.[0] ?? '',
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: Math.round((row.ctr ?? 0) * 1000) / 10,
      position: Math.round((row.position ?? 0) * 10) / 10,
    }));

    // 2. Top páginas (últimos 30 dias)
    const pagesResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(start30),
        endDate: formatDate(end),
        dimensions: ['page'],
        rowLimit: 10,
      },
    });

    const topPages = (pagesResponse.data.rows ?? []).map(row => ({
      page: row.keys?.[0]?.replace(siteUrl, '') || '/',
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: Math.round((row.ctr ?? 0) * 1000) / 10,
      position: Math.round((row.position ?? 0) * 10) / 10,
    }));

    // 3. Top queries (últimos 30 dias)
    const queriesResponse = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(start30),
        endDate: formatDate(end),
        dimensions: ['query'],
        rowLimit: 10,
      },
    });

    const topQueries = (queriesResponse.data.rows ?? []).map(row => ({
      query: row.keys?.[0] ?? '',
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: Math.round((row.ctr ?? 0) * 1000) / 10,
      position: Math.round((row.position ?? 0) * 10) / 10,
    }));

    // 4. Resumo com comparação (30d atuais vs 30d anteriores)
    const currentSummaryRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(start30),
        endDate: formatDate(end),
      },
    });

    const prevSummaryRes = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(prevStart),
        endDate: formatDate(prevEnd),
      },
    });

    const currRow = currentSummaryRes.data.rows?.[0];
    const prevRow = prevSummaryRes.data.rows?.[0];

    const pct = (c: number, p: number) =>
      p === 0 ? 0 : Math.round(((c - p) / p) * 100 * 10) / 10;

    const summary = {
      clicks: currRow?.clicks ?? 0,
      impressions: currRow?.impressions ?? 0,
      ctr: Math.round((currRow?.ctr ?? 0) * 1000) / 10,
      position: Math.round((currRow?.position ?? 0) * 10) / 10,
      clicksChange: pct(currRow?.clicks ?? 0, prevRow?.clicks ?? 0),
      impressionsChange: pct(currRow?.impressions ?? 0, prevRow?.impressions ?? 0),
      ctrChange: pct(
        Math.round((currRow?.ctr ?? 0) * 1000) / 10,
        Math.round((prevRow?.ctr ?? 0) * 1000) / 10,
      ),
      positionChange: pct(
        Math.round((prevRow?.position ?? 0) * 10) / 10,
        Math.round((currRow?.position ?? 0) * 10) / 10,
      ), // inverted: lower position is better
    };

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json({ dailyData, topPages, topQueries, summary });

  } catch (error: any) {
    console.error('Search Console API error:', error);
    return res.status(500).json({ error: error?.message ?? 'Erro ao consultar Search Console' });
  }
}
