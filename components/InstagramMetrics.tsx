import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  getInstagramMetrics,
  isDevMode,
  InstagramAccount,
  InstagramSummary,
  InstagramDailyRow,
  InstagramMediaItem,
  InstagramBestHour,
  InstagramBestDay,
  InstagramOnlineHour,
} from '../services/instagramMetricsService';

// ── Fallback data (dev mode / erro) ───────────────────────────────────────────

const FALLBACK_ACCOUNT: InstagramAccount = {
  username: 'fernandamangiapsi',
  name: 'Fernanda Abreu Mangia',
  profilePicture: '',
  followers: 1247,
  following: 385,
  mediaCount: 86,
  biography: 'Psicóloga CRP 05/72018 | Terapia Cognitivo-Comportamental',
  website: 'fernandamangia.com.br',
};

const FALLBACK_SUMMARY: InstagramSummary = {
  totalImpressions: 18420,
  totalReach: 8530,
  totalProfileViews: 342,
  totalEngagement: 1560,
  engagementRate: 3.8,
  totalSaves: 284,
  totalShares: 96,
  websiteClicks: 48,
  emailContacts: 12,
  phoneClicks: 7,
  followersGained: 38,
  impressionsChange: 12,
  reachChange: 8,
  profileViewsChange: -5,
};

const FALLBACK_DAILY: InstagramDailyRow[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - 30 + i);
  return {
    date: d.toISOString().split('T')[0],
    impressions: Math.round(400 + Math.random() * 600),
    reach: Math.round(200 + Math.random() * 300),
    profileViews: Math.round(5 + Math.random() * 20),
  };
});

const FALLBACK_TOP_POSTS: InstagramMediaItem[] = [
  { id: '1', caption: 'Projeto CBI solidário. Mensalidades com desconto durante o m...', timestamp: '2026-04-05T10:00:00Z', like_count: 59, comments_count: 5, media_url: '', permalink: 'https://instagram.com/p/1', media_type: 'CAROUSEL_ALBUM', insights: { impressions: 2800, reach: 1200, total_interactions: 64, saved: 28, shares: 12 } },
  { id: '2', caption: 'Quer saber mais? Podemos Conversar! Se você conhece alguém...', timestamp: '2026-04-02T19:00:00Z', like_count: 59, comments_count: 4, media_url: '', permalink: 'https://instagram.com/p/2', media_type: 'IMAGE',          insights: { impressions: 2100, reach: 980,  total_interactions: 63, saved: 22, shares: 8 } },
  { id: '3', caption: 'Caminhando juntas! Seus pequenos passos vão em busca do fut...', timestamp: '2026-03-28T14:00:00Z', like_count: 50, comments_count: 7, media_url: '', permalink: 'https://instagram.com/p/3', media_type: 'IMAGE',          insights: { impressions: 1800, reach: 850,  total_interactions: 57, saved: 18, shares: 6 } },
  { id: '4', caption: 'Dia do psicólogo! Parabéns a todos os profissionais que são...', timestamp: '2026-03-25T10:00:00Z', like_count: 39, comments_count: 14, media_url: '', permalink: 'https://instagram.com/p/4', media_type: 'CAROUSEL_ALBUM', insights: { impressions: 1650, reach: 780,  total_interactions: 53, saved: 14, shares: 4 } },
  { id: '5', caption: 'A avaliação neuropsicológica é muito importante na identific...', timestamp: '2026-03-22T19:00:00Z', like_count: 26, comments_count: 0, media_url: '', permalink: 'https://instagram.com/p/5', media_type: 'IMAGE',          insights: { impressions: 1400, reach: 620,  total_interactions: 26, saved: 9,  shares: 2 } },
];

const FALLBACK_BEST_HOURS: InstagramBestHour[] = [
  { hour: 19, avgEngagement: 64, posts: 1 },
  { hour: 16, avgEngagement: 39, posts: 5 },
  { hour: 2,  avgEngagement: 31, posts: 2 },
  { hour: 14, avgEngagement: 28, posts: 3 },
  { hour: 10, avgEngagement: 22, posts: 4 },
  { hour: 20, avgEngagement: 18, posts: 3 },
  { hour: 12, avgEngagement: 15, posts: 2 },
];

const FALLBACK_BEST_DAYS: InstagramBestDay[] = [
  { day: 0, dayName: 'Dom', avgEngagement: 52, posts: 3 },
  { day: 1, dayName: 'Seg', avgEngagement: 38, posts: 5 },
  { day: 2, dayName: 'Ter', avgEngagement: 44, posts: 7 },
  { day: 3, dayName: 'Qua', avgEngagement: 30, posts: 6 },
  { day: 4, dayName: 'Qui', avgEngagement: 61, posts: 4 },
  { day: 5, dayName: 'Sex', avgEngagement: 35, posts: 5 },
  { day: 6, dayName: 'Sáb', avgEngagement: 28, posts: 2 },
];

const FALLBACK_ONLINE_HOURS: InstagramOnlineHour[] = Array.from({ length: 24 }, (_, h) => ({
  hour: h,
  avgFollowers: Math.round(30 + Math.sin((h - 10) * 0.4) * 25 + Math.random() * 10),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const COLORS = ['#e11d48', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#6366f1'];

const formatHour = (h: number) => `${String(h).padStart(2, '0')}:00`;

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

const TrendBadge = ({ value }: { value: number }) => {
  const positive = value >= 0;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {positive ? '↑' : '↓'} {Math.abs(value)}%
    </span>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────

const InstagramMetrics: React.FC = () => {
  const [account, setAccount]       = useState<InstagramAccount>(FALLBACK_ACCOUNT);
  const [summary, setSummary]       = useState<InstagramSummary>(FALLBACK_SUMMARY);
  const [dailyData, setDailyData]   = useState<InstagramDailyRow[]>(FALLBACK_DAILY);
  const [topPosts, setTopPosts]     = useState<InstagramMediaItem[]>(FALLBACK_TOP_POSTS);
  const [bestHours, setBestHours]   = useState<InstagramBestHour[]>(FALLBACK_BEST_HOURS);
  const [bestDays, setBestDays]     = useState<InstagramBestDay[]>(FALLBACK_BEST_DAYS);
  const [onlineFollowers, setOnlineFollowers] = useState<InstagramOnlineHour[]>(FALLBACK_ONLINE_HOURS);
  const [hasOnlineData, setHasOnlineData]     = useState(false);
  const [isMock, setIsMock]         = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    getInstagramMetrics()
      .then(data => {
        setAccount(data.account);
        setSummary(data.summary);
        if (data.dailyData.length)       setDailyData(data.dailyData);
        if (data.topPosts.length)        setTopPosts(data.topPosts);
        if (data.bestHours.length)       setBestHours(data.bestHours);
        if (data.bestDays?.length)       setBestDays(data.bestDays);
        if (data.onlineFollowers?.length > 0) {
          setOnlineFollowers(data.onlineFollowers);
          setHasOnlineData(true);
        }
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

  // ── Status Banner ──
  const StatusBanner = () => {
    if (!isMock) return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
        <span>✅</span>
        <p className="text-sm text-green-800 font-medium">Dados reais do Instagram — @{account.username}</p>
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
            {isDev ? 'Ambiente de desenvolvimento — dados de demonstração' : `Erro ao conectar com Instagram: ${error}`}
          </p>
          <p className={`text-xs mt-1 ${isDev ? 'text-blue-700' : 'text-amber-700'}`}>
            {isDev ? 'Em produção (Vercel), os dados reais do Instagram serão carregados.' : 'Verifique INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID no Vercel Dashboard.'}
          </p>
        </div>
        {!isDev && <button onClick={loadData} className="text-xs text-amber-700 underline hover:text-amber-900 flex-shrink-0">Tentar novamente</button>}
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Carregando métricas do Instagram...</p>
      </div>
    </div>
  );

  // Media type distribution for pie chart
  const mediaTypes = topPosts.reduce<Record<string, number>>((acc, p) => {
    const type = p.media_type === 'CAROUSEL_ALBUM' ? 'Carrossel' : p.media_type === 'VIDEO' ? 'Vídeo' : 'Imagem';
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});
  const mediaTypePieData = Object.entries(mediaTypes).map(([name, value]) => ({ name, value }));

  // Best day sorted by day number for chart display
  const bestDaysSorted = [...bestDays].sort((a, b) => a.day - b.day);

  // Online followers chart: top 12 busiest hours
  const topOnlineHours = [...onlineFollowers].sort((a, b) => b.avgFollowers - a.avgFollowers).slice(0, 12).sort((a, b) => a.hour - b.hour);

  return (
    <div className="space-y-6">
      <StatusBanner />

      {/* Account Header */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          {account.profilePicture ? (
            <img src={account.profilePicture} alt={account.name} loading="lazy" className="w-16 h-16 rounded-full border-2 border-white/50" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">📱</div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{account.name}</h2>
            <p className="text-white/80">@{account.username}</p>
            {account.biography && <p className="text-white/60 text-xs mt-1 line-clamp-1">{account.biography}</p>}
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold">{account.followers.toLocaleString('pt-BR')}</p>
              <p className="text-white/70 text-xs">Seguidores</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{account.following.toLocaleString('pt-BR')}</p>
              <p className="text-white/70 text-xs">Seguindo</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{account.mediaCount}</p>
              <p className="text-white/70 text-xs">Posts</p>
            </div>
            {summary.followersGained !== 0 && (
              <div>
                <p className={`text-2xl font-bold ${summary.followersGained > 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {summary.followersGained > 0 ? '+' : ''}{summary.followersGained}
                </p>
                <p className="text-white/70 text-xs">Ganhos/30d</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs — 4 principais + 4 de conversão */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Impressões',       value: summary.totalImpressions.toLocaleString('pt-BR'),  change: summary.impressionsChange,  icon: '👁️' },
          { label: 'Alcance',          value: summary.totalReach.toLocaleString('pt-BR'),         change: summary.reachChange,         icon: '📡' },
          { label: 'Engajamento',      value: summary.totalEngagement.toLocaleString('pt-BR'),    change: summary.impressionsChange,   icon: '❤️' },
          { label: 'Taxa Engajamento', value: `${summary.engagementRate}%`,                       change: summary.reachChange,         icon: '📊' },
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

      {/* KPIs de conversão */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-pink-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔖</span>
            <p className="text-xs text-gray-500 font-medium uppercase">Salvamentos</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{summary.totalSaves.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-gray-400 mt-1">posts salvos pelos seguidores</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔁</span>
            <p className="text-xs text-gray-500 font-medium uppercase">Compartilhamentos</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{summary.totalShares.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-gray-400 mt-1">posts compartilhados</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔗</span>
            <p className="text-xs text-gray-500 font-medium uppercase">Cliques no Link</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{summary.websiteClicks.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-gray-400 mt-1">cliques no link da bio</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">👤</span>
            <p className="text-xs text-gray-500 font-medium uppercase">Visitas ao Perfil</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{summary.totalProfileViews.toLocaleString('pt-BR')}</p>
          <div className="mt-1"><TrendBadge value={summary.profileViewsChange} /></div>
        </div>
      </div>

      {/* Impressões + Alcance (30 dias) */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 Impressões e Alcance (últimos 30 dias)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="igImpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#e11d48" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="igReachGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
            <YAxis yAxisId="left"  tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area yAxisId="left"  type="monotone" dataKey="impressions" name="Impressões" stroke="#e11d48" fill="url(#igImpGrad)"   strokeWidth={2} />
            <Area yAxisId="right" type="monotone" dataKey="reach"       name="Alcance"    stroke="#8b5cf6" fill="url(#igReachGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Posts + Horário ideal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Posts */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Posts por Engajamento</h3>
          <div className="space-y-3">
            {topPosts.slice(0, 5).map((post, i) => {
              const engagement = (post.like_count ?? 0) + (post.comments_count ?? 0);
              const caption = post.caption?.length > 55 ? post.caption.slice(0, 55) + '...' : (post.caption ?? '');
              return (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{caption || 'Sem legenda'}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>❤️ {post.like_count}</span>
                      <span>💬 {post.comments_count}</span>
                      {post.insights?.saved   != null && <span>🔖 {post.insights.saved}</span>}
                      {post.insights?.shares  != null && <span>🔁 {post.insights.shares}</span>}
                      {post.insights?.reach   != null && <span>📡 {post.insights.reach}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-pink-600">{engagement}</p>
                    <p className="text-xs text-gray-400">
                      {post.media_type === 'CAROUSEL_ALBUM' ? '🎠' : post.media_type === 'VIDEO' ? '🎬' : '🖼️'}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Horário ideal — seguidores online se disponível, senão melhor horário histórico */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {hasOnlineData ? '📶 Seguidores Online por Horário' : '⏰ Melhor Horário para Publicar'}
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            {hasOnlineData
              ? 'Média de seguidores online — melhor hora para alcançar mais pessoas'
              : 'Baseado no engajamento médio dos seus posts publicados'}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            {hasOnlineData ? (
              <BarChart data={topOnlineHours} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={formatHour} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} labelFormatter={(v) => `Horário: ${formatHour(v as number)}`} />
                <Bar dataKey="avgFollowers" name="Seguidores Online" radius={[4, 4, 0, 0]}>
                  {topOnlineHours.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#e11d48' : i === 1 ? '#8b5cf6' : '#d1d5db'} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <BarChart data={bestHours.slice(0, 8)} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={formatHour} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} labelFormatter={(v) => `Horário: ${formatHour(v as number)}`} />
                <Bar dataKey="avgEngagement" name="Engajamento Médio" radius={[4, 4, 0, 0]}>
                  {bestHours.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#e11d48' : i === 1 ? '#8b5cf6' : '#d1d5db'} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {(hasOnlineData
              ? [...onlineFollowers].sort((a, b) => b.avgFollowers - a.avgFollowers).slice(0, 3).map(h => ({ label: formatHour(h.hour), value: `${h.avgFollowers} seguidores online` }))
              : bestHours.slice(0, 3).map(h => ({ label: formatHour(h.hour), value: `engajamento médio ${h.avgEngagement} (${h.posts} posts)` }))
            ).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-bold">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                <span className="font-medium text-gray-900">{item.label}</span>
                <span className="text-gray-500">— {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tipos de Conteúdo + Melhor Dia da Semana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Media Type Pie */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">🥧 Tipos de Conteúdo</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={mediaTypePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {mediaTypePieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'posts']} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Best Day of Week */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">📅 Engajamento por Dia da Semana</h3>
          <p className="text-xs text-gray-400 mb-4">Engajamento médio por dia com base nos seus posts</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bestDaysSorted} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dayName" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgEngagement" name="Engajamento Médio" radius={[4, 4, 0, 0]}>
                {bestDaysSorted.map((d, i) => {
                  const maxEng = Math.max(...bestDaysSorted.map(x => x.avgEngagement));
                  return <Cell key={i} fill={d.avgEngagement === maxEng ? '#e11d48' : '#d1d5db'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-3">
            Melhor dia: <strong className="text-pink-600">
              {bestDays.reduce((a, b) => a.avgEngagement > b.avgEngagement ? a : b).dayName}
            </strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstagramMetrics;
