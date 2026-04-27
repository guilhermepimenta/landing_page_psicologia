import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { postsService, metricsService, analyticsService, messagesService, alertsService, weeklyGoalService, leadsService, WeeklyGoal, Post as FirebasePost } from '../services/firebaseService';
import ContentStudio from './ContentStudio';
import AnalyticsPanel from './AnalyticsPanel';
import PostsManager from './PostsManager';
import ContentCalendar from './ContentCalendar';
import ProfileSettings from './ProfileSettings';
import SearchConsoleGMBPanel from './SearchConsoleGMBPanel';
import InstagramMetrics from './InstagramMetrics';
import FacebookMetrics from './FacebookMetrics';
import LeadsPanel from './LeadsPanel';
import LeadsFunnel from './LeadsFunnel';
import ROIPanel from './ROIPanel';
import MessagesInbox from './MessagesInbox';
import { getAISuggestion, AISuggestion } from '../services/aiSuggestionService';

interface Metric {
  channel: string;
  value: number;
  change: number;
  icon: string;
}

interface WeeklySummary {
  totalPosts: number;
  totalEngagement: number;
  newLeads: number;
  conversions: number;
}

const DEFAULT_METRICS: Metric[] = [
  { channel: 'Instagram', value: 0, change: 0, icon: '📱' },
  { channel: 'Google Meu Negócio', value: 0, change: 0, icon: '📍' },
  { channel: 'Blog', value: 0, change: 0, icon: '📝' },
  { channel: 'Email', value: 0, change: 0, icon: '📧' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'instagram' | 'blog' | 'gmb' | 'email' | 'facebook' | 'calendar' | 'analytics' | 'instagram-metrics' | 'facebook-metrics' | 'google' | 'leads' | 'leads-funnel' | 'roi' | 'messages' | 'settings'>('overview');
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [showStudio, setShowStudio] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>(DEFAULT_METRICS);
  const [recentPosts, setRecentPosts] = useState<FirebasePost[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>({ totalPosts: 0, totalEngagement: 0, newLeads: 0, conversions: 0 });
  const [loadingData, setLoadingData] = useState(true);
  const [scheduledPosts, setScheduledPosts] = useState<FirebasePost[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>({ label: 'novos leads', target: 10, current: 0 });
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const [postsResult, metricsResult, summaryResult] = await Promise.all([
        postsService.getRecent(10),
        metricsService.getLatest(),
        analyticsService.getWeeklySummary(),
      ]);
      if (postsResult.success && postsResult.data) {
        setRecentPosts(postsResult.data as FirebasePost[]);
      }
      if (metricsResult.success && metricsResult.data.length > 0) {
        setMetrics(metricsResult.data.map(m => ({
          channel: m.channel,
          value: m.value,
          change: m.change,
          icon: m.icon,
        })));
      }
      if (summaryResult.success) {
        setWeeklySummary(summaryResult.data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    postsService.getScheduled().then((res) => {
      if (res.success) setScheduledPosts(res.data.filter((p) => new Date(p.date) >= new Date()).slice(0, 5));
    });

    weeklyGoalService.get().then((res) => {
      if (res.success) setWeeklyGoal(res.data);
    });

    Promise.all([
      messagesService.getAll(),
      alertsService.getActive(),
      leadsService.getNewCount(),
    ]).then(([messagesResult, alertsResult, leadsResult]) => {
      if (messagesResult.success) {
        setUnreadCount(messagesResult.data.filter((m) => m.status === 'nova').length);
      }
      if (leadsResult.success) {
        setNewLeadsCount(leadsResult.count);
      }
      if (alertsResult.success) {
        setActiveAlertsCount(alertsResult.data.length);
      }
    });

    if (!import.meta.env.DEV) {
      setLoadingSuggestion(true);
      getAISuggestion()
        .then((data) => {
          setAiSuggestion(data);
          setSuggestionError(null);
        })
        .catch((err) => setSuggestionError(String(err?.message ?? 'Falha ao gerar sugestao')))
        .finally(() => setLoadingSuggestion(false));
    }
  }, []);

  const getStatusBadge = (status: FirebasePost['status'] | 'idea') => {
    const badges = {
      published: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      draft: 'bg-yellow-100 text-yellow-800',
      idea: 'bg-purple-100 text-purple-800',
    };
    const labels = {
      published: '✅ Publicado',
      scheduled: '📝 Agendado',
      draft: '✏️ Rascunho',
      idea: '💡 Ideia',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <DashboardLayout
      onLogout={handleLogout}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      alertsCount={activeAlertsCount}
      unreadCount={unreadCount}
      leadsCount={newLeadsCount}
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard de Marketing</h1>
        <p className="text-gray-400 text-sm mt-0.5">Bem-vinda de volta, Fernanda! 👋</p>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="space-y-10">

          {/* ── SEÇÃO 1: CRIAÇÃO DE CONTEÚDO ── */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-lg">✨</span>
              </div>
              <h2 className="text-lg font-bold text-gray-800">Criação de Conteúdo</h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-5">
              {/* Ações rápidas — linha compacta no mobile, cards no desktop */}
              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3">
                {[
                  { icon: '✨', label: 'Gerar Conteúdo', sub: 'Criar posts com IA', color: 'from-purple-500 to-purple-600', subColor: 'text-purple-100', action: () => setShowStudio(true) },
                  { icon: '🕵️', label: 'Agente de Tendências', sub: 'Temas em alta agora', color: 'from-blue-500 to-blue-600', subColor: 'text-blue-100', action: () => setShowStudio(true) },
                  { icon: '📅', label: 'Agendar Posts', sub: 'Planejar no calendário', color: 'from-indigo-500 to-indigo-600', subColor: 'text-indigo-100', action: () => setActiveTab('calendar') },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`bg-gradient-to-br ${item.color} text-white rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-[1.02] text-left group
                      flex items-center gap-3 px-4 py-3
                      sm:flex-col sm:items-start sm:px-5 sm:py-5 sm:gap-0`}
                  >
                    <span className="text-2xl sm:text-3xl sm:mb-3 shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0 sm:flex-none">
                      <h3 className="font-bold text-sm sm:text-base sm:mb-1 truncate">{item.label}</h3>
                      <p className={`text-xs ${item.subColor} hidden sm:block`}>{item.sub}</p>
                    </div>
                    <svg className="w-4 h-4 shrink-0 opacity-60 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Sugestão Inteligente */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-purple-100">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <span>🤖</span>
                    Sugestão Inteligente da Semana
                  </h3>
                  <button
                    onClick={() => {
                      setLoadingSuggestion(true);
                      getAISuggestion()
                        .then((data) => { setAiSuggestion(data); setSuggestionError(null); })
                        .catch((err) => setSuggestionError(String(err?.message ?? 'Falha ao atualizar sugestão')))
                        .finally(() => setLoadingSuggestion(false));
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Atualizar
                  </button>
                </div>
                {loadingSuggestion ? (
                  <p className="text-sm text-gray-500">Gerando sugestão com IA...</p>
                ) : suggestionError ? (
                  <p className="text-sm text-red-500">Indisponível no momento. Tente em produção.</p>
                ) : aiSuggestion ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">{aiSuggestion.channel}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">{aiSuggestion.bestDay} {aiSuggestion.bestHour}</span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">Confiança: {aiSuggestion.confidence}%</span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                        Fonte: {aiSuggestion.source === 'ai' ? 'IA' : 'Heurística'}
                      </span>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Tema sugerido</p>
                      <p className="text-sm text-purple-900">{aiSuggestion.topic}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 font-medium uppercase">Formato</p>
                        <p className="text-sm text-gray-800 mt-1">{aiSuggestion.postFormat}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 font-medium uppercase">CTA recomendado</p>
                        <p className="text-sm text-gray-800 mt-1">{aiSuggestion.cta}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-xs text-amber-700 font-medium uppercase">Justificativa</p>
                      <p className="text-sm text-amber-900 mt-1">{aiSuggestion.rationale}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Clique em <strong>Atualizar</strong> para gerar uma sugestão personalizada com IA.</p>
                )}
              </div>

              {/* Posts Recentes + Próximos Agendados */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <span>📋</span>Posts Recentes
                    </h3>
                    <button onClick={() => setActiveTab('instagram')} className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                      Ver todos →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {recentPosts.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">Nenhum post ainda.</p>
                    ) : recentPosts.slice(0, 4).map((post) => (
                      <div key={post.id} className="flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-purple-200">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate mb-1">{post.title}</h4>
                          <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                            <span>{post.channel === 'Instagram' ? '📱' : post.channel === 'GMB' ? '📍' : post.channel === 'Blog' ? '📝' : '📧'} {post.channel}</span>
                            <span>·</span>
                            <span>{new Date(post.date).toLocaleDateString('pt-BR')}</span>
                            {post.engagement ? <><span>·</span><span className="text-pink-600">❤️ {post.engagement}</span></> : null}
                          </div>
                        </div>
                        <div className="ml-3 shrink-0">{getStatusBadge(post.status)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <span>📅</span>Próximos Agendados
                    </h3>
                    <button onClick={() => setActiveTab('calendar')} className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                      Calendário →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {loadingData ? (
                      <p className="text-sm text-gray-400 py-4 text-center">Carregando...</p>
                    ) : scheduledPosts.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm text-gray-400 mb-2">Nenhum post agendado.</p>
                        <button onClick={() => setActiveTab('instagram')} className="text-sm text-purple-600 hover:text-purple-700 font-medium underline">
                          Criar agendamento →
                        </button>
                      </div>
                    ) : scheduledPosts.map((post) => {
                      const channelIcon: Record<string, string> = { Instagram: '📱', GMB: '📍', Blog: '📝', Email: '📧' };
                      return (
                        <div key={post.id} className="flex items-start p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate mb-1">{post.title}</h4>
                            <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                              <span>{channelIcon[post.channel] ?? '📄'} {post.channel}</span>
                              <span>·</span>
                              <span>⏰ {new Date(post.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── SEÇÃO 2: MÉTRICAS & PERFORMANCE ── */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <span className="text-green-600 text-lg">📊</span>
              </div>
              <h2 className="text-lg font-bold text-gray-800">Métricas & Performance</h2>
              <div className="flex-1 h-px bg-gray-200" />
              <button onClick={() => setActiveTab('analytics')} className="text-sm text-gray-500 hover:text-purple-600 font-medium whitespace-nowrap">
                Ver analytics completo →
              </button>
            </div>

            <div className="space-y-5">
              {/* Resumo Semanal */}
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Resumo da Semana</h3>
                    <p className="text-purple-200 text-sm">{loadingData ? 'Carregando...' : 'Últimos 7 dias'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold">{loadingData ? '—' : weeklySummary.totalPosts}</p>
                    <p className="text-purple-200 text-sm">posts publicados</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Engajamento Total', value: weeklySummary.totalEngagement },
                    { label: 'Canais Ativos', value: metrics.filter(m => m.value > 0).length },
                    { label: 'Novos Leads', value: weeklySummary.newLeads },
                    { label: 'Conversões', value: weeklySummary.conversions },
                  ].map(item => (
                    <div key={item.label} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                      <p className="text-purple-200 text-xs">{item.label}</p>
                      <p className="text-2xl font-bold mt-1">{loadingData ? '—' : item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Métricas por Canal */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric) => (
                  <div key={metric.channel} className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{metric.icon}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${metric.change >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
                      </span>
                    </div>
                    <h3 className="text-gray-600 text-xs font-medium">{metric.channel}</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">visualizações/cliques</p>
                    <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(Math.abs(metric.change) * 2, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Melhor Performance + Meta da Semana */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Melhor Performance por Tipo */}
                {(() => {
                  const published = recentPosts.filter((p) => p.status === 'published' && (p.engagement ?? 0) > 0);
                  const grouped: Record<string, { total: number; count: number }> = {};
                  published.forEach((p) => {
                    const key = p.channel === 'Instagram' && (p.format === 'reel' || p.format === 'reels') ? 'Instagram Reels' : p.channel === 'Instagram' && p.format === 'carrossel' ? 'Instagram Carrossel' : p.channel === 'Instagram' ? 'Instagram Post' : p.channel;
                    if (!grouped[key]) grouped[key] = { total: 0, count: 0 };
                    grouped[key].total += p.engagement ?? 0;
                    grouped[key].count += 1;
                  });
                  const ranked = Object.entries(grouped)
                    .map(([type, { total, count }]) => ({ type, avg: Math.round(total / count), count }))
                    .sort((a, b) => b.avg - a.avg)
                    .slice(0, 3);
                  const medals = ['🏆', '🥈', '🥉'];
                  return (
                    <div className="bg-white rounded-xl shadow-md p-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span>🎯</span>Melhor Performance por Tipo
                      </h3>
                      {ranked.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">Adicione posts com engajamento para ver o ranking.</p>
                      ) : (
                        <div className="space-y-3">
                          {ranked.map((item, i) => (
                            <div key={item.type} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <span className="text-xl">{medals[i]}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{item.type}</p>
                                <p className="text-xs text-gray-500">{item.count} {item.count === 1 ? 'post' : 'posts'} · média {item.avg}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Meta da Semana */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <span>🎯</span>Meta da Semana
                    </h3>
                    <button onClick={() => setActiveTab('settings')} className="text-xs text-purple-600 hover:text-purple-700 font-medium underline">
                      Editar
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">
                    Alcançar <strong>{weeklyGoal.target} {weeklyGoal.label}</strong>
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(Math.round((weeklyGoal.current / (weeklyGoal.target || 1)) * 100), 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {weeklyGoal.current} de {weeklyGoal.target} ({Math.round((weeklyGoal.current / (weeklyGoal.target || 1)) * 100)}%)
                  </p>
                  {aiSuggestion && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-700">
                        💡 Publique no <strong>{aiSuggestion.channel}</strong> na <strong>{aiSuggestion.bestDay}</strong> às <strong>{aiSuggestion.bestHour}</strong> para maximizar alcance.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>
      )}

      {activeTab === 'instagram' && <PostsManager fixedChannel="Instagram" />}
      {activeTab === 'blog' && <PostsManager fixedChannel="Blog" />}
      {activeTab === 'gmb' && <PostsManager fixedChannel="GMB" />}
      {activeTab === 'email' && <PostsManager fixedChannel="Email" />}
      {activeTab === 'facebook' && <PostsManager fixedChannel="Facebook" />}

      {activeTab === 'calendar' && <ContentCalendar />}

      {activeTab === 'analytics' && (
        <AnalyticsPanel metrics={metrics} />
      )}

      {activeTab === 'instagram-metrics' && <InstagramMetrics />}
      {activeTab === 'facebook-metrics' && <FacebookMetrics />}
      {activeTab === 'leads' && <LeadsPanel />}
      {activeTab === 'leads-funnel' && <LeadsFunnel />}
      {activeTab === 'roi' && <ROIPanel />}

      {activeTab === 'google' && <SearchConsoleGMBPanel />}

      {activeTab === 'messages' && (
        <MessagesInbox />
      )}

      {activeTab === 'settings' && <ProfileSettings />}

      {showStudio && (
        <ContentStudio
          onClose={() => setShowStudio(false)}
          onSaved={() => { setShowStudio(false); fetchDashboardData(); }}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
