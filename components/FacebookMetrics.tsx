import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, Legend,
} from 'recharts';
import {
  getFacebookMetrics, isDevMode,
  FacebookPage, FacebookSummary, FacebookDailyRow, FacebookPost,
  FacebookBestDay, FacebookMonthlyRow,
} from '../services/facebookMetricsService';

// ── Fallback data (dev / erro) ────────────────────────────────────────────────

const FALLBACK_PAGE: FacebookPage = {
  name: 'Fernanda Mangia Psicologia',
  about: 'Psicóloga | Neuropsicologia | Terapia Cognitivo-Comportamental',
  category: 'Saúde/beleza',
  fans: 892,
  followers: 941,
  picture: '',
  link: 'https://www.facebook.com/fernandamangiapsi',
};

const FALLBACK_SUMMARY: FacebookSummary = {
  totalImpressions: 12480,
  totalReach: 5830,
  totalEngagement: 740,
  totalViews: 1240,
  newFans: 24,
  impressionsChange: 18,
  reachChange: 12,
  engagementChange: 22,
};

const FALLBACK_DAILY: FacebookDailyRow[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - 30 + i);
  return {
    date: d.toISOString().split('T')[0],
    impressions: Math.round(250 + Math.random() * 350),
    reach: Math.round(120 + Math.random() * 200),
    engagement: Math.round(15 + Math.random() * 40),
    views: Math.round(30 + Math.random() * 60),
    newFans: Math.round(Math.random() * 3),
  };
});

const FALLBACK_TOP_POSTS: FacebookPost[] = [
  { id: '1', message: 'Você sabia que TDAH pode se manifestar de formas diferentes em adultos? Muitas vezes passa despercebido por anos...', createdTime: '2026-04-05T10:00:00Z', picture: null, permalink: 'https://www.facebook.com/fernandamangiapsi', reactions: 48, comments: 12, shares: 8, totalEngagement: 68 },
  { id: '2', message: 'A avaliação neuropsicológica é uma ferramenta poderosa para entender como o cérebro funciona...', createdTime: '2026-04-02T19:00:00Z', picture: null, permalink: 'https://www.facebook.com/fernandamangiapsi', reactions: 39, comments: 7, shares: 5, totalEngagement: 51 },
  { id: '3', message: 'Hoje é Dia do Psicólogo! Obrigada a todos que confiam no trabalho da psicologia...', createdTime: '2026-03-28T14:00:00Z', picture: null, permalink: 'https://www.facebook.com/fernandamangiapsi', reactions: 35, comments: 9, shares: 6, totalEngagement: 50 },
  { id: '4', message: 'Pequenos passos também são avanços. Na jornada da saúde mental, cada progresso importa...', createdTime: '2026-03-25T10:00:00Z', picture: null, permalink: 'https://www.facebook.com/fernandamangiapsi', reactions: 42, comments: 4, shares: 2, totalEngagement: 48 },
  { id: '5', message: 'Ansiedade não é frescura. É uma condição real que afeta milhões de pessoas no Brasil...', createdTime: '2026-03-22T19:00:00Z', picture: null, permalink: 'https://www.facebook.com/fernandamangiapsi', reactions: 31, comments: 5, shares: 4, totalEngagement: 40 },
];

const FALLBACK_BEST_DAYS: FacebookBestDay[] = [
  { day: 0, dayName: 'Dom', avgEngagement: 28, posts: 2 },
  { day: 1, dayName: 'Seg', avgEngagement: 35, posts: 4 },
  { day: 2, dayName: 'Ter', avgEngagement: 42, posts: 6 },
  { day: 3, dayName: 'Qua', avgEngagement: 38, posts: 5 },
  { day: 4, dayName: 'Qui', avgEngagement: 55, posts: 4 },
  { day: 5, dayName: 'Sex', avgEngagement: 31, posts: 5 },
  { day: 6, dayName: 'Sáb', avgEngagement: 22, posts: 2 },
];

const FALLBACK_MONTHLY: FacebookMonthlyRow[] = [
  { mes: 'Out', posts: 6,  engajamento: 180 },
  { mes: 'Nov', posts: 8,  engajamento: 220 },
  { mes: 'Dez', posts: 5,  engajamento: 160 },
  { mes: 'Jan', posts: 9,  engajamento: 290 },
  { mes: 'Fev', posts: 10, engajamento: 340 },
  { mes: 'Mar', posts: 12, engajamento: 420 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-100 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}: <strong>{typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const TrendBadge = ({ value }: { value: number }) => (
  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${value >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
    {value >= 0 ? '↑' : '↓'} {Math.abs(value)}%
  </span>
);

// ── Component ─────────────────────────────────────────────────────────────────

const FacebookMetrics: React.FC = () => {
  const [page, setPage]           = useState<FacebookPage>(FALLBACK_PAGE);
  const [summary, setSummary]     = useState<FacebookSummary>(FALLBACK_SUMMARY);
  const [dailyData, setDailyData] = useState<FacebookDailyRow[]>(FALLBACK_DAILY);
  const [topPosts, setTopPosts]   = useState<FacebookPost[]>(FALLBACK_TOP_POSTS);
  const [bestDays, setBestDays]   = useState<FacebookBestDay[]>(FALLBACK_BEST_DAYS);
  const [monthly, setMonthly]     = useState<FacebookMonthlyRow[]>(FALLBACK_MONTHLY);
  const [isMock, setIsMock]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    getFacebookMetrics()
      .then(data => {
        setPage(data.page);
        setSummary(data.summary);
        if (data.dailyData.length)   setDailyData(data.dailyData);
        if (data.topPosts.length)    setTopPosts(data.topPosts);
        if (data.bestDays?.length)   setBestDays(data.bestDays);
        if (data.monthlyTrend?.length) setMonthly(data.monthlyTrend);
        setIsMock(false);
        setLastUpdated(new Date());
      })
      .catch(err => {
        setError(String(err?.message ?? 'Erro'));
        setIsMock(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const StatusBanner = () => {
    if (!isMock) return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
        <span>✅</span>
        <p className="text-sm text-green-800 font-medium">Dados reais do Facebook — {page.name}</p>
        {lastUpdated && (
          <span className="text-xs text-green-600">
            · {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <button onClick={loadData} className="ml-auto text-xs text-green-700 underline hover:text-green-900">Atualizar</button>
      </div>
    );
    const isDev = isDevMode && error === '__dev_mode__';
    return (
      <div className={`border rounded-xl p-4 flex items-start gap-3 ${isDev ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
        <span className="text-xl flex-shrink-0">{isDev ? '🖥️' : '📋'}</span>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${isDev ? 'text-blue-800' : 'text-amber-800'}`}>
            {isDev
              ? 'Ambiente de desenvolvimento — dados de demonstração'
              : `Erro ao conectar com Facebook: ${error}`}
          </p>
          <p className={`text-xs mt-1 ${isDev ? 'text-blue-700' : 'text-amber-700'}`}>
            {isDev
              ? 'Em produção (Vercel), os dados reais serão carregados automaticamente.'
              : 'Configure FACEBOOK_PAGE_ACCESS_TOKEN e FACEBOOK_PAGE_ID no Vercel Dashboard.'}
          </p>
        </div>
        {!isDev && (
          <button onClick={loadData} className="text-xs text-amber-700 underline hover:text-amber-900 flex-shrink-0">
            Tentar novamente
          </button>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Carregando métricas do Facebook...</p>
      </div>
    </div>
  );

  const bestDaysSorted = [...bestDays].sort((a, b) => a.day - b.day);
  const bestDay = bestDays.reduce((a, b) => a.avgEngagement > b.avgEngagement ? a : b, bestDays[0]);

  return (
    <div className="space-y-6">
      <StatusBanner />

      {/* Page header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          {page.picture ? (
            <img src={page.picture} alt={page.name} loading="lazy" className="w-16 h-16 rounded-full border-2 border-white/50" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">📘</div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{page.name}</h2>
            {page.category && <p className="text-white/70 text-sm">{page.category}</p>}
            {page.about && <p className="text-white/60 text-xs mt-1 line-clamp-1">{page.about}</p>}
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold">{page.fans.toLocaleString('pt-BR')}</p>
              <p className="text-white/70 text-xs">Curtidas</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{page.followers.toLocaleString('pt-BR')}</p>
              <p className="text-white/70 text-xs">Seguidores</p>
            </div>
            {summary.newFans > 0 && (
              <div>
                <p className="text-2xl font-bold text-green-300">+{summary.newFans}</p>
                <p className="text-white/70 text-xs">Novos/30d</p>
              </div>
            )}
            <div>
              <a href={page.link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white border border-white/30 rounded-lg px-2 py-1 mt-1 transition-colors">
                Ver Página ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Impressões',    value: summary.totalImpressions.toLocaleString('pt-BR'), change: summary.impressionsChange, icon: '👁️' },
          { label: 'Alcance',       value: summary.totalReach.toLocaleString('pt-BR'),        change: summary.reachChange,       icon: '📡' },
          { label: 'Engajamento',   value: summary.totalEngagement.toLocaleString('pt-BR'),   change: summary.engagementChange,  icon: '❤️' },
          { label: 'Visitas à Pág', value: summary.totalViews.toLocaleString('pt-BR'),        change: summary.impressionsChange, icon: '👤' },
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

      {/* Impressões + Alcance (30 dias) */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 Impressões e Alcance (últimos 30 dias)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="fbImpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fbReachGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
            <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area yAxisId="left"  type="monotone" dataKey="impressions" name="Impressões" stroke="#2563eb" fill="url(#fbImpGrad)"   strokeWidth={2} />
            <Area yAxisId="right" type="monotone" dataKey="reach"       name="Alcance"    stroke="#6366f1" fill="url(#fbReachGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Posts + Engajamento Diário */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Posts */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Posts por Engajamento</h3>
          <div className="space-y-3">
            {topPosts.map((post, i) => {
              const preview = post.message.length > 80 ? post.message.slice(0, 80) + '...' : post.message;
              return (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{preview || 'Post sem texto'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>❤️ {post.reactions}</span>
                      <span>💬 {post.comments}</span>
                      <span>🔁 {post.shares}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-blue-600">{post.totalEngagement}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(post.createdTime).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Engajamento por dia da semana */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">📅 Engajamento por Dia da Semana</h3>
          <p className="text-xs text-gray-400 mb-4">Engajamento médio por dia com base nos seus posts</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bestDaysSorted} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dayName" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgEngagement" name="Engajamento Médio" radius={[4, 4, 0, 0]}>
                {bestDaysSorted.map((d, i) => (
                  <Cell key={i} fill={d.avgEngagement === bestDay?.avgEngagement ? '#2563eb' : '#d1d5db'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {bestDay && (
            <p className="text-xs text-gray-500 mt-3">
              Melhor dia: <strong className="text-blue-600">{bestDay.dayName}</strong>
              {' '}— engajamento médio de {bestDay.avgEngagement} ({bestDay.posts} posts analisados)
            </p>
          )}
        </div>
      </div>

      {/* Tendência mensal de posts + engajamento */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">📈 Tendência Mensal (6 meses)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthly} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left"  dataKey="posts"       name="Posts publicados" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="engajamento" name="Engajamento total" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Engajamento diário */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">🔥 Engajamento Diário (últimos 30 dias)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="fbEngGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="engagement" name="Usuários engajados" stroke="#2563eb" fill="url(#fbEngGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FacebookMetrics;
