import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

interface CheckResult {
  ok: boolean;
  label: string;
  detail: string;
  hint?: string;
  vars: string[];
}

function getGa4Client() {
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const rawKey = process.env.GA4_PRIVATE_KEY;
  if (!clientEmail || !rawKey) return null;
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: rawKey.replace(/\\n/g, '\n'),
    },
  });
}

function humanizeGa4Error(err: any): { detail: string; hint: string } {
  const msg: string = err?.message ?? String(err);
  const code: number = err?.code ?? 0;

  if (code === 7 || msg.includes('PERMISSION_DENIED'))
    return {
      detail: 'Permissão negada pela GA4 Data API.',
      hint: 'Adicione a service account como "Viewer" na propriedade GA4: GA4 → Admin → Gerenciamento de acesso à propriedade.',
    };
  if (code === 16 || msg.includes('UNAUTHENTICATED') || msg.includes('invalid_grant'))
    return {
      detail: 'Credenciais inválidas ou expiradas.',
      hint: 'Verifique GA4_CLIENT_EMAIL e GA4_PRIVATE_KEY no Vercel. A chave privada deve ter \\n literais (não quebras de linha reais).',
    };
  if (code === 5 || msg.includes('NOT_FOUND') || msg.includes('property'))
    return {
      detail: `Propriedade não encontrada: ${process.env.GA4_PROPERTY_ID ?? '(vazio)'}`,
      hint: 'Confirme GA4_PROPERTY_ID no Vercel. Deve ser apenas o número, ex: "123456789", sem o prefixo "properties/".',
    };
  if (msg.includes('INVALID_ARGUMENT'))
    return {
      detail: 'Argumento inválido na consulta GA4.',
      hint: 'GA4_PROPERTY_ID pode estar incorreto ou a métrica solicitada não existe para esta propriedade.',
    };
  return { detail: msg.slice(0, 200), hint: 'Verifique os logs do Vercel para mais detalhes.' };
}

async function checkGa4(): Promise<CheckResult> {
  const vars = ['GA4_PROPERTY_ID', 'GA4_CLIENT_EMAIL', 'GA4_PRIVATE_KEY'];
  const missing = vars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    return {
      ok: false,
      label: 'Google Analytics 4',
      detail: `Variáveis ausentes: ${missing.join(', ')}`,
      hint: 'Configure essas variáveis no Vercel Dashboard → Settings → Environment Variables.',
      vars,
    };
  }

  const client = getGa4Client();
  if (!client) {
    return { ok: false, label: 'Google Analytics 4', detail: 'Falha ao criar cliente GA4.', vars };
  }

  try {
    const [res] = await client.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      metrics: [{ name: 'sessions' }],
      limit: 1,
    });
    const sessions = Number(res.rows?.[0]?.metricValues?.[0]?.value ?? 0);
    return {
      ok: true,
      label: 'Google Analytics 4',
      detail: `Conectado. Sessões nos últimos 7 dias: ${sessions}`,
      vars,
    };
  } catch (err: any) {
    const { detail, hint } = humanizeGa4Error(err);
    return { ok: false, label: 'Google Analytics 4', detail, hint, vars };
  }
}

async function checkGoogleAds(): Promise<CheckResult> {
  const vars = ['GA4_PROPERTY_ID', 'GA4_CLIENT_EMAIL', 'GA4_PRIVATE_KEY'];
  const client = getGa4Client();
  if (!client) {
    return {
      ok: false,
      label: 'Google Ads (via GA4)',
      detail: 'Credenciais GA4 ausentes — necessárias para buscar dados do Google Ads.',
      vars,
    };
  }

  try {
    const [res] = await client.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionGoogleAdsAdNetworkType' }],
      metrics: [{ name: 'advertiserAdCost' }],
      limit: 5,
    });

    const rows = res.rows ?? [];
    const totalCost = rows.reduce((s, r) => s + parseFloat(r.metricValues?.[0]?.value ?? '0'), 0);

    if (rows.length === 0) {
      return {
        ok: false,
        label: 'Google Ads (via GA4)',
        detail: 'Nenhuma linha de dados retornada para a métrica advertiserAdCost.',
        hint: 'O Google Ads precisa estar VINCULADO à propriedade GA4: GA4 → Admin → Integrações de produtos → Google Ads → Vincular. Se já estiver vinculado, pode não haver campanhas ativas nos últimos 30 dias.',
        vars,
      };
    }

    return {
      ok: true,
      label: 'Google Ads (via GA4)',
      detail: `Vinculado. Gasto nos últimos 30 dias: R$ ${totalCost.toFixed(2)}`,
      vars,
    };
  } catch (err: any) {
    const msg: string = err?.message ?? '';
    if (msg.includes('INVALID_ARGUMENT') || msg.includes('advertiserAdCost') || msg.includes('unknown metric')) {
      return {
        ok: false,
        label: 'Google Ads (via GA4)',
        detail: 'Métrica advertiserAdCost não disponível nesta propriedade.',
        hint: 'Vincule o Google Ads à propriedade GA4: GA4 → Admin → Integrações de produtos → Google Ads → Vincular.',
        vars,
      };
    }
    const { detail, hint } = humanizeGa4Error(err);
    return { ok: false, label: 'Google Ads (via GA4)', detail, hint, vars };
  }
}

async function checkMetaAds(): Promise<CheckResult> {
  const vars = ['META_ADS_ACCESS_TOKEN', 'META_ADS_AD_ACCOUNT_ID'];
  const token = process.env.META_ADS_ACCESS_TOKEN;
  const accountId = process.env.META_ADS_AD_ACCOUNT_ID;

  if (!token || !accountId) {
    const missing = vars.filter(v => !process.env[v]);
    return {
      ok: false,
      label: 'Meta Ads',
      detail: `Variáveis ausentes: ${missing.join(', ')}`,
      hint: 'Configure no Vercel Dashboard. META_ADS_AD_ACCOUNT_ID é o número do Ad Account (sem "act_").',
      vars,
    };
  }

  const normalizedId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;

  try {
    // Validate token via /me endpoint
    const meRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${token}`,
    );
    const meData = await meRes.json() as { id?: string; name?: string; error?: { message: string; code: number } };

    if (meData.error) {
      const code = meData.error.code;
      const isExpired = code === 190;
      return {
        ok: false,
        label: 'Meta Ads',
        detail: `Token inválido: ${meData.error.message}`,
        hint: isExpired
          ? 'O token de acesso expirou. Gere um novo System User Token no Meta Business Manager com permissão ads_read.'
          : 'Verifique META_ADS_ACCESS_TOKEN. Use um System User Token de longa duração, não um token temporário de usuário.',
        vars,
      };
    }

    // Check account access
    const acctRes = await fetch(
      `https://graph.facebook.com/v21.0/${normalizedId}?fields=id,name,account_status&access_token=${token}`,
    );
    const acctData = await acctRes.json() as { id?: string; name?: string; account_status?: number; error?: { message: string } };

    if (acctData.error) {
      return {
        ok: false,
        label: 'Meta Ads',
        detail: `Sem acesso à conta ${normalizedId}: ${acctData.error.message}`,
        hint: 'Verifique META_ADS_AD_ACCOUNT_ID e se o System User tem permissão na conta de anúncios.',
        vars,
      };
    }

    const statusMap: Record<number, string> = {
      1: 'Ativa', 2: 'Desativada', 3: 'Não confirmada', 7: 'Pendente', 9: 'Em análise',
    };
    const statusLabel = statusMap[acctData.account_status ?? 0] ?? `Status ${acctData.account_status}`;

    return {
      ok: acctData.account_status === 1,
      label: 'Meta Ads',
      detail: `Conectado como "${meData.name}". Conta: ${acctData.name ?? normalizedId} (${statusLabel})`,
      hint: acctData.account_status !== 1 ? 'A conta de anúncios não está ativa.' : undefined,
      vars,
    };
  } catch (err: any) {
    return {
      ok: false,
      label: 'Meta Ads',
      detail: `Erro de rede: ${err?.message ?? 'Desconhecido'}`,
      hint: 'Verifique se a função Vercel tem acesso à internet (sem restrições de egress).',
      vars,
    };
  }
}

async function checkFirebase(): Promise<CheckResult> {
  const vars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];

  try {
    const { getAdminDb } = await import('./_lib/firebaseAdmin.js');
    const db = getAdminDb();
    const snap = await db.collection('posts').limit(1).get();
    return {
      ok: true,
      label: 'Firebase Admin (Firestore)',
      detail: `Conectado. Coleção 'posts' acessível (${snap.size} doc encontrado).`,
      vars,
    };
  } catch (err: any) {
    const msg: string = err?.message ?? String(err);
    return {
      ok: false,
      label: 'Firebase Admin (Firestore)',
      detail: msg.slice(0, 200),
      hint: 'Verifique FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY no Vercel.',
      vars,
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const checks = await Promise.allSettled([
    checkGa4(),
    checkGoogleAds(),
    checkMetaAds(),
    checkFirebase(),
  ]);

  const results: CheckResult[] = checks.map((c, i) => {
    if (c.status === 'fulfilled') return c.value;
    const labels = ['Google Analytics 4', 'Google Ads (via GA4)', 'Meta Ads', 'Firebase Admin'];
    return {
      ok: false,
      label: labels[i] ?? 'Desconhecido',
      detail: String((c as PromiseRejectedResult).reason?.message ?? 'Erro inesperado'),
      vars: [],
    };
  });

  const allOk = results.every(r => r.ok);
  return res.status(allOk ? 200 : 207).json({
    status: allOk ? 'ok' : 'degraded',
    checkedAt: new Date().toISOString(),
    checks: results,
  });
}
