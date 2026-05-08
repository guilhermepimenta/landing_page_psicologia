import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { roiAdsSyncService, leadsService, ROIAdsSync } from '../services/firebaseService';
import { adsService } from '../services/adsService';
import { getGA4Data, isDevMode } from '../services/ga4Service';

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(ym: string) {
  const [year, month] = ym.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
}

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });
}

function fmtN(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}mil` : String(v);
}

function pct(part: number, total: number): string {
  if (total === 0) return '—';
  return `${((part / total) * 100).toFixed(1)}%`;
}

interface Stage {
  id: string;
  label: string;
  value: number;
  source: 'Google Ads' | 'GA4' | 'CRM';
  color: string;
  bg: string;
  border: string;
  badge: string;
  extra?: string;
}

const CampaignFunnel: React.FC = () => {
  const [adsSync, setAdsSync]         = useState<ROIAdsSync | null>(null);
  const [sessions, setSessions]       = useState<number | null>(null);
  const [conversions, setConversions] = useState<number | null>(null);
  const [crmLeads, setCrmLeads]       = useState<number | null>(null);
  const [syncing, setSyncing]         = useState(false);
  const [loadingGA4, setLoadingGA4]   = useState(true);
  const [ga4Error, setGa4Error]       = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const loadAdsAndCRM = useCallback(async () => {
    const [syncSnap, leadsRes] = await Promise.all([
      roiAdsSyncService.get(selectedMonth),
      leadsService.getAll(),
    ]);
    setAdsSync(syncSnap);
    if (leadsRes.success) setCrmLeads(leadsRes.data.length);
  }, [selectedMonth]);

  const loadGA4 = useCallback(() => {
    if (isDevMode) { setLoadingGA4(false); return; }
    setLoadingGA4(true);
    setGa4Error(null);
    getGA4Data()
      .then(data => {
        const m = data.summaryMetrics;
        const sessionsRow  = m.find(r => r.metrica === 'alcance_total');
        const convRow      = m.find(r => r.metrica === 'leads');
        setSessions(sessionsRow?.valor ?? 0);
        setConversions(convRow?.valor ?? 0);
      })
      .catch(err => setGa4Error(String(err?.message ?? 'Erro ao carregar GA4')))
      .finally(() => setLoadingGA4(false));
  }, []);

  useEffect(() => { loadAdsAndCRM(); }, [loadAdsAndCRM]);
  useEffect(() => { loadGA4(); }, [loadGA4]);

  const handleSync = async () => {
    setSyncing(true);
    const { google, meta } = await adsService.getAllAdsSpend(selectedMonth);
    await roiAdsSyncService.save({
      month: selectedMonth,
      googleAds: google.spend,
      googleClicks: google.clicks,
      googleImpressions: google.impressions,
      metaAds: meta.spend,
      googleCampaigns: google.campaigns,
      metaCampaigns: meta.campaigns,
    });
    const snap = await roiAdsSyncService.get(selectedMonth);
    setAdsSync(snap);
    setSyncing(false);
  };

  const imp  = adsSync?.googleImpressions ?? 0;
  const clk  = adsSync?.googleClicks      ?? 0;
  const cost = adsSync?.googleAds         ?? 0;
  const sess = sessions  ?? 0;
  const conv = conversions ?? 0;
  const leads = crmLeads ?? 0;
  const cpc  = clk  > 0 ? cost / clk  : 0;
  const ctr  = imp  > 0 ? clk  / imp  : 0;

  const stages: Stage[] = [
    {
      id: 'impressions',
      label: 'Impressões',
      value: imp,
      source: 'Google Ads',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700',
      extra: 'Total de vezes que o anúncio foi exibido',
    },
    {
      id: 'clicks',
      label: 'Cliques no anúncio',
      value: clk,
      source: 'Google Ads',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700',
      extra: `CTR ${(ctr * 100).toFixed(2)}% · CPC médio ${fmtBRL(cpc)}`,
    },
    {
      id: 'sessions',
      label: 'Sessões no site',
      value: sess,
      source: 'GA4',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700',
      extra: 'Usuários que chegaram ao site (últimos 30 dias)',
    },
    {
      id: 'conversions',
      label: 'Conversões (GA4)',
      value: conv,
      source: 'GA4',
      color: 'text-violet-700',
      bg: 'bg-violet-50',
      border: 'border-violet-200',
      badge: 'bg-violet-100 text-violet-700',
      extra: 'Eventos de conversão rastreados (WhatsApp, formulário)',
    },
    {
      id: 'leads',
      label: 'Leads qualificados',
      value: leads,
      source: 'CRM',
      color: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      badge: 'bg-orange-100 text-orange-700',
      extra: 'Contatos reais com nome e telefone no CRM',
    },
  ];

  const maxValue = Math.max(...stages.map(s => s.value), 1);

  const dropRate = (from: number, to: number) => {
    if (from === 0) return null;
    const r = ((from - to) / from) * 100;
    return r;
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Funil de Campanha</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Do anúncio ao paciente — onde você está perdendo pessoas?
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {monthOptions.map(m => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Ads'}
            </button>
          </div>
        </div>

        {adsSync?.syncedAt && (
          <p className="text-xs text-gray-400 mt-3">
            Dados do Google Ads sincronizados em {adsSync.syncedAt.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · Sessões/Conversões: últimos 30 dias via GA4
          </p>
        )}
        {!adsSync && !syncing && (
          <p className="text-xs text-amber-600 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Clique em "Sincronizar Ads" para carregar os dados do Google Ads para {monthLabel(selectedMonth)}.
          </p>
        )}
        {ga4Error && (
          <p className="text-xs text-red-600 mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            GA4: {ga4Error}
          </p>
        )}
        {isDevMode && (
          <p className="text-xs text-blue-600 mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            Ambiente local — sessões e conversões do GA4 não disponíveis. Em produção os dados reais serão carregados.
          </p>
        )}
      </div>

      {/* KPI cards rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Custo', value: fmtBRL(cost), sub: monthLabel(selectedMonth), color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
          { label: 'CPC Médio', value: clk > 0 ? fmtBRL(cpc) : '—', sub: 'custo por clique', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
          { label: 'CTR', value: imp > 0 ? `${(ctr * 100).toFixed(2)}%` : '—', sub: 'cliques / impressões', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
          { label: 'Taxa de conversão', value: sess > 0 ? pct(conv, sess) : '—', sub: 'conversões / sessões', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-100' },
          { label: 'Custo por lead', value: leads > 0 ? fmtBRL(cost / leads) : '—', sub: `${leads} lead${leads !== 1 ? 's' : ''} no CRM`, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-100' },
        ].map(card => (
          <div key={card.label} className={`rounded-xl p-4 border ${card.bg}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${card.color}`}>{card.label}</p>
            <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Funil visual */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-base font-bold text-gray-900 mb-5">Funil completo</h3>
        <div className="space-y-2">
          {stages.map((stage, i) => {
            const prev  = i > 0 ? stages[i - 1].value : null;
            const drop  = prev !== null ? dropRate(prev, stage.value) : null;
            const width = maxValue > 0 ? Math.max((stage.value / maxValue) * 100, stage.value > 0 ? 2 : 0) : 0;

            return (
              <div key={stage.id}>
                {/* Drop indicator between stages */}
                {drop !== null && (
                  <div className="flex items-center gap-2 py-1 pl-2">
                    <div className="w-px h-5 bg-gray-200 mx-3" />
                    {drop === 0 ? (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Minus size={11} /> Sem queda
                      </span>
                    ) : drop > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-red-500">
                        <TrendingDown size={11} /> {drop.toFixed(1)}% de queda
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <TrendingUp size={11} /> Crescimento
                      </span>
                    )}
                  </div>
                )}

                {/* Stage bar */}
                <div className={`rounded-xl border p-4 ${stage.bg} ${stage.border}`}>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-bold ${stage.color}`}>{stage.label}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${stage.badge}`}>
                          {stage.source}
                        </span>
                      </div>
                      {stage.extra && (
                        <p className="text-xs text-gray-500 mt-0.5">{stage.extra}</p>
                      )}
                    </div>
                    <p className={`text-2xl font-bold shrink-0 ${stage.color}`}>
                      {stage.value > 0 ? fmtN(stage.value) : (loadingGA4 && (stage.id === 'sessions' || stage.id === 'conversions') ? '...' : '0')}
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-white bg-opacity-60 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${
                        stage.source === 'Google Ads' ? 'bg-blue-400' :
                        stage.source === 'GA4' ? (stage.id === 'conversions' ? 'bg-violet-400' : 'bg-emerald-400') :
                        'bg-orange-400'
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights automáticos */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-base font-bold text-gray-900 mb-4">Insights do funil</h3>
        <div className="space-y-3 text-sm">
          {imp > 0 && clk > 0 && (
            <div className={`flex gap-3 p-3 rounded-xl ${ctr >= 0.03 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <span className="text-lg">{ctr >= 0.03 ? '✅' : '⚠️'}</span>
              <div>
                <p className="font-semibold text-gray-800">CTR: {(ctr * 100).toFixed(2)}%</p>
                <p className="text-gray-600 text-xs mt-0.5">
                  {ctr >= 0.05 ? 'Excelente — seu anúncio está atraindo bastante atenção.' :
                   ctr >= 0.03 ? 'Bom — dentro da média de campanhas de saúde (2–5%).' :
                   'Abaixo da média. Tente melhorar o título e extensões do anúncio.'}
                </p>
              </div>
            </div>
          )}

          {clk > 0 && sess > 0 && clk > sess && (
            <div className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="font-semibold text-gray-800">Cliques ({fmtN(clk)}) &gt; Sessões ({fmtN(sess)})</p>
                <p className="text-gray-600 text-xs mt-0.5">
                  Possível queda na landing page. Verifique se o site carrega rápido e se a URL do anúncio está correta.
                </p>
              </div>
            </div>
          )}

          {sess > 0 && conv >= 0 && (
            <div className={`flex gap-3 p-3 rounded-xl ${conv / sess >= 0.02 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
              <span className="text-lg">{conv / sess >= 0.02 ? '✅' : '⚠️'}</span>
              <div>
                <p className="font-semibold text-gray-800">Taxa de conversão: {pct(conv, sess)}</p>
                <p className="text-gray-600 text-xs mt-0.5">
                  {conv / sess >= 0.05 ? 'Excelente — sua landing page está convertendo muito bem.' :
                   conv / sess >= 0.02 ? 'Razoável — há espaço para otimizar o CTA e formulário.' :
                   conv === 0 ? 'Nenhuma conversão rastreada. Confirme se os eventos do GTM estão disparando.' :
                   'Abaixo de 2%. Revise o CTA, formulário e prova social na landing page.'}
                </p>
              </div>
            </div>
          )}

          {cost > 0 && leads === 0 && (
            <div className="flex gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-lg">ℹ️</span>
              <div>
                <p className="font-semibold text-gray-800">Custo investido, leads no CRM ainda em 0</p>
                <p className="text-gray-600 text-xs mt-0.5">
                  As conversões do GA4 são eventos rastreados (cliques no WhatsApp, visitas à página de contato).
                  Leads qualificados aparecem aqui somente quando alguém preencher o formulário de contato do site.
                </p>
              </div>
            </div>
          )}

          {imp === 0 && clk === 0 && !syncing && (
            <div className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
              <span className="text-lg">📊</span>
              <p className="text-gray-600">
                Clique em <strong>"Sincronizar Ads"</strong> para carregar os dados do Google Ads e preencher o funil com dados reais de {monthLabel(selectedMonth)}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignFunnel;
