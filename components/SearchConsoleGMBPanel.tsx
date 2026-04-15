import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { getGSCData, isDevMode as gscDevMode, GSCDailyRow, GSCPageRow, GSCQueryRow, GSCSummary } from '../services/gscService';
import { getGMBData, isDevMode as gmbDevMode, GMBDailyView, GMBSummary } from '../services/gmbService';

// ── Fallback data (dev mode) ──────────────────────────────────────────────────

const FALLBACK_GSC_DAILY: GSCDailyRow[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - 14 + i);
  return {
    date: d.toISOString().split('T')[0],
    clicks: Math.round(8 + Math.random() * 15),
    impressions: Math.round(120 + Math.random() * 200),
    ctr: Math.round((3 + Math.random() * 5) * 10) / 10,
    position: Math.round((8 + Math.random() * 12) * 10) / 10,
  };
});

const FALLBACK_GSC_PAGES: GSCPageRow[] = [
  { page: '/', clicks: 42, impressions: 890, ctr: 4.7, position: 6.2 },
  { page: '/blog/ansiedade-terapia', clicks: 28, impressions: 520, ctr: 5.4, position: 4.8 },
  { page: '/servicos', clicks: 18, impressions: 340, ctr: 5.3, position: 7.1 },
  { page: '/blog/autoestima', clicks: 15, impressions: 290, ctr: 5.2, position: 8.3 },
  { page: '/contato', clicks: 12, impressions: 180, ctr: 6.7, position: 5.5 },
];

const FALLBACK_GSC_QUERIES: GSCQueryRow[] = [
  { query: 'psicóloga barra da tijuca', clicks: 35, impressions: 420, ctr: 8.3, position: 3.2 },
  { query: 'terapia ansiedade rio', clicks: 22, impressions: 380, ctr: 5.8, position: 5.1 },
  { query: 'fernanda mangia psicologia', clicks: 18, impressions: 95, ctr: 18.9, position: 1.2 },
  { query: 'psicologia online rj', clicks: 14, impressions: 310, ctr: 4.5, position: 7.8 },
  { query: 'autoestima terapia', clicks: 11, impressions: 240, ctr: 4.6, position: 9.4 },
];

const FALLBACK_GSC_SUMMARY: GSCSummary = {
  clicks: 186, impressions: 3420, ctr: 5.4, position: 7.2,
  clicksChange: 12.5, impressionsChange: 8.3, ctrChange: 3.8, positionChange: 5.1,
};

const FALLBACK_GMB_DAILY: GMBDailyView[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - 14 + i);
  return { date: d.toISOString().split('T')[0], views: Math.round(30 + Math.random() * 50) };
});

const FALLBACK_GMB_SUMMARY: GMBSummary = {
  totalViews: 1240, searchViews: 820, mapsViews: 420,
  websiteClicks: 68, callClicks: 24, directionRequests: 15,
  viewsChange: 14.2, clicksChange: 8.5, callsChange: -3.1, directionsChange: 22.0,
};

const EMPTY_GSC_SUMMARY: GSCSummary = {
  clicks: 0,
  impressions: 0,
  ctr: 0,
  position: 0,
  clicksChange: 0,
  impressionsChange: 0,
  ctrChange: 0,
  positionChange: 0,
};

const EMPTY_GMB_SUMMARY: GMBSummary = {
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
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const COLORS_GSC = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-100 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const TrendBadge = ({ value }: { value: number }) => {
  const positive = value >= 0;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {positive ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

type SubTab = 'search-console' | 'gmb';

const SearchConsoleGMBPanel: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('search-console');

  // GSC state
  const [gscDaily, setGscDaily] = useState<GSCDailyRow[]>([]);
  const [gscPages, setGscPages] = useState<GSCPageRow[]>([]);
  const [gscQueries, setGscQueries] = useState<GSCQueryRow[]>([]);
  const [gscSummary, setGscSummary] = useState<GSCSummary>(EMPTY_GSC_SUMMARY);
  const [gscMock, setGscMock] = useState(gscDevMode);
  const [gscLoading, setGscLoading] = useState(true);
  const [gscError, setGscError] = useState<string | null>(null);

  // GMB state
  const [gmbDaily, setGmbDaily] = useState<GMBDailyView[]>([]);
  const [gmbSummary, setGmbSummary] = useState<GMBSummary>(EMPTY_GMB_SUMMARY);
  const [gmbLocationTitle, setGmbLocationTitle] = useState<string | null>(null);
  const [gmbMock, setGmbMock] = useState(gmbDevMode);
  const [gmbLoading, setGmbLoading] = useState(true);
  const [gmbError, setGmbError] = useState<string | null>(null);

  const loadGSC = () => {
    setGscLoading(true);
    setGscError(null);
    getGSCData()
      .then(data => {
        setGscDaily(data.dailyData);
        setGscPages(data.topPages);
        setGscQueries(data.topQueries);
        setGscSummary(data.summary);
        setGscMock(false);
      })
      .catch(err => {
        const message = String(err?.message ?? 'Erro');
        setGscError(message);
        if (message === '__dev_mode__') {
          setGscDaily(FALLBACK_GSC_DAILY);
          setGscPages(FALLBACK_GSC_PAGES);
          setGscQueries(FALLBACK_GSC_QUERIES);
          setGscSummary(FALLBACK_GSC_SUMMARY);
          setGscMock(true);
        } else {
          setGscDaily([]);
          setGscPages([]);
          setGscQueries([]);
          setGscSummary(EMPTY_GSC_SUMMARY);
          setGscMock(false);
        }
      })
      .finally(() => setGscLoading(false));
  };

  const loadGMB = () => {
    setGmbLoading(true);
    setGmbError(null);
    getGMBData()
      .then(data => {
        setGmbDaily(data.dailyViews);
        setGmbSummary(data.summary);
        setGmbLocationTitle(data.location?.title ?? null);
        setGmbMock(false);
        if (data.error) setGmbError(data.error);
      })
      .catch(err => {
        const message = String(err?.message ?? 'Erro');
        setGmbError(message);
        if (message === '__dev_mode__') {
          setGmbDaily(FALLBACK_GMB_DAILY);
          setGmbSummary(FALLBACK_GMB_SUMMARY);
          setGmbLocationTitle('Dados de demonstracao');
          setGmbMock(true);
        } else {
          setGmbDaily([]);
          setGmbSummary(EMPTY_GMB_SUMMARY);
          setGmbLocationTitle(null);
          setGmbMock(false);
        }
      })
      .finally(() => setGmbLoading(false));
  };

  useEffect(() => { loadGSC(); loadGMB(); }, []);

  // ── Status Banner ──
  const StatusBanner = ({ mock, error, devMode, onRetry, source }: {
    mock: boolean; error: string | null; devMode: boolean; onRetry: () => void; source: string;
  }) => {
    if (!error) return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
        <span>✅</span>
        <p className="text-sm text-green-800 font-medium">Dados reais do {source}</p>
        <button onClick={onRetry} className="ml-auto text-xs text-green-700 underline hover:text-green-900">Atualizar</button>
      </div>
    );
    const isDev = devMode && mock && error === '__dev_mode__';
    return (
      <div className={`border rounded-xl p-4 flex items-start gap-3 ${isDev ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
        <span className="text-xl flex-shrink-0">{isDev ? '🖥️' : '📋'}</span>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${isDev ? 'text-blue-800' : 'text-amber-800'}`}>
            {isDev ? 'Ambiente de desenvolvimento — dados de demonstracao' : `Erro ao conectar com ${source}: ${error}`}
          </p>
          <p className={`text-xs mt-1 ${isDev ? 'text-blue-700' : 'text-amber-700'}`}>
            {isDev ? `Em produção (Vercel), os dados reais do ${source} serão carregados.` : 'Verifique as variáveis de ambiente no Vercel Dashboard.'}
          </p>
        </div>
        {!isDev && <button onClick={onRetry} className="text-xs text-amber-700 underline hover:text-amber-900 flex-shrink-0">Tentar novamente</button>}
      </div>
    );
  };

  // ── Loading ──
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Carregando dados...</p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ──  RENDER  ──────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {([
          { key: 'search-console' as SubTab, label: '🔍 Search Console' },
          { key: 'gmb' as SubTab, label: '📍 Google Meu Negócio' },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              subTab === t.key
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════  SEARCH CONSOLE TAB  ════════════════ */}
      {subTab === 'search-console' && (
        <>
          {gscLoading ? <LoadingSpinner /> : (
            <div className="space-y-6">
              <StatusBanner mock={gscMock} error={gscError} devMode={gscDevMode} onRetry={loadGSC} source="Google Search Console" />

              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Cliques', value: gscSummary.clicks, change: gscSummary.clicksChange },
                  { label: 'Impressões', value: gscSummary.impressions.toLocaleString('pt-BR'), change: gscSummary.impressionsChange },
                  { label: 'CTR Médio', value: `${gscSummary.ctr}%`, change: gscSummary.ctrChange },
                  { label: 'Posição Média', value: gscSummary.position.toFixed(1), change: gscSummary.positionChange },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white rounded-xl shadow-md p-5">
                    <p className="text-xs text-gray-500 font-medium uppercase">{kpi.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                    <div className="mt-1"><TrendBadge value={kpi.change} /></div>
                  </div>
                ))}
              </div>

              {/* Daily clicks + impressions chart */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 Cliques e Impressões (últimos 30 dias)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={gscDaily} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area yAxisId="left" type="monotone" dataKey="clicks" name="Cliques" stroke="#6366f1" fill="url(#clicksGrad)" strokeWidth={2} />
                    <Area yAxisId="right" type="monotone" dataKey="impressions" name="Impressões" stroke="#0ea5e9" fill="url(#impGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Top Pages + Top Queries */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Pages */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 Páginas Mais Visitadas</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 uppercase border-b">
                          <th className="pb-2">Página</th>
                          <th className="pb-2 text-right">Cliques</th>
                          <th className="pb-2 text-right">Impressões</th>
                          <th className="pb-2 text-right">CTR</th>
                          <th className="pb-2 text-right">Posição</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gscPages.map((p, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 font-medium text-gray-700 max-w-[180px] truncate" title={p.page}>{p.page}</td>
                            <td className="py-2 text-right text-indigo-600 font-semibold">{p.clicks}</td>
                            <td className="py-2 text-right text-gray-500">{p.impressions}</td>
                            <td className="py-2 text-right text-gray-500">{p.ctr}%</td>
                            <td className="py-2 text-right text-gray-500">{p.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Queries */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🔎 Termos de Pesquisa</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 uppercase border-b">
                          <th className="pb-2">Consulta</th>
                          <th className="pb-2 text-right">Cliques</th>
                          <th className="pb-2 text-right">Impressões</th>
                          <th className="pb-2 text-right">CTR</th>
                          <th className="pb-2 text-right">Posição</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gscQueries.map((q, i) => (
                          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="py-2 font-medium text-gray-700 max-w-[180px] truncate" title={q.query}>{q.query}</td>
                            <td className="py-2 text-right text-indigo-600 font-semibold">{q.clicks}</td>
                            <td className="py-2 text-right text-gray-500">{q.impressions}</td>
                            <td className="py-2 text-right text-gray-500">{q.ctr}%</td>
                            <td className="py-2 text-right text-gray-500">{q.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Position trend line chart */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">📈 Posição Média no Google</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={gscDaily} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} reversed domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="position" name="Posição" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-400 mt-2 text-center">Quanto menor, melhor — posição 1 = topo do Google</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════  GOOGLE MEU NEGÓCIO TAB  ════════════════ */}
      {subTab === 'gmb' && (
        <>
          {gmbLoading ? <LoadingSpinner /> : (
            <div className="space-y-6">
              <StatusBanner mock={gmbMock} error={gmbError} devMode={gmbDevMode} onRetry={loadGMB} source="Google Meu Negócio" />

              {gmbLocationTitle && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-2">
                  <span>📍</span>
                  <p className="text-sm text-purple-800 font-medium">{gmbLocationTitle}</p>
                </div>
              )}

              {/* GMB KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Visualizações', value: gmbSummary.totalViews.toLocaleString('pt-BR'), change: gmbSummary.viewsChange, icon: '👁️' },
                  { label: 'Pesquisa', value: gmbSummary.searchViews.toLocaleString('pt-BR'), change: gmbSummary.viewsChange, icon: '🔍' },
                  { label: 'Maps', value: gmbSummary.mapsViews.toLocaleString('pt-BR'), change: gmbSummary.viewsChange, icon: '🗺️' },
                  { label: 'Cliques no Site', value: gmbSummary.websiteClicks, change: gmbSummary.clicksChange, icon: '🌐' },
                  { label: 'Ligações', value: gmbSummary.callClicks, change: gmbSummary.callsChange, icon: '📞' },
                  { label: 'Rotas', value: gmbSummary.directionRequests, change: gmbSummary.directionsChange, icon: '🧭' },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-white rounded-xl shadow-md p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{kpi.icon}</span>
                      <p className="text-xs text-gray-500 font-medium uppercase">{kpi.label}</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                    <div className="mt-1"><TrendBadge value={kpi.change} /></div>
                  </div>
                ))}
              </div>

              {/* Daily views chart */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 Visualizações do Perfil (últimos 30 dias)</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={gmbDaily} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="views" name="Visualizações" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Breakdown pie chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">🥧 Origem das Visualizações</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pesquisa Google', value: gmbSummary.searchViews },
                          { name: 'Google Maps', value: gmbSummary.mapsViews },
                        ]}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={85}
                        paddingAngle={3} dataKey="value"
                      >
                        <Cell fill="#6366f1" />
                        <Cell fill="#10b981" />
                      </Pie>
                      <Tooltip formatter={(value) => [Number(value).toLocaleString('pt-BR'), 'visualizações']} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">📞 Ações dos Clientes</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={[
                        { action: 'Site', value: gmbSummary.websiteClicks },
                        { action: 'Ligações', value: gmbSummary.callClicks },
                        { action: 'Rotas', value: gmbSummary.directionRequests },
                      ]}
                      margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="action" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Ações" radius={[4, 4, 0, 0]}>
                        <Cell fill="#6366f1" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#10b981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchConsoleGMBPanel;
