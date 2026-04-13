import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { postsService, metricsService, analyticsService, messagesService, alertsService, Post as FirebasePost } from '../services/firebaseService';
import AIContentModal from './AIContentModal';
import AnalyticsPanel from './AnalyticsPanel';
import PostsManager from './PostsManager';
import ContentCalendar from './ContentCalendar';
import IdeasBank from './IdeasBank';
import ProfileSettings from './ProfileSettings';
import SearchConsoleGMBPanel from './SearchConsoleGMBPanel';
import InstagramMetrics from './InstagramMetrics';
import MessagesInbox from './MessagesInbox';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'calendar' | 'ideas' | 'analytics' | 'instagram' | 'google' | 'messages' | 'settings'>('overview');
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [showAIModal, setShowAIModal] = useState(false);
  const [metrics, setMetrics] = useState<Metric[]>(DEFAULT_METRICS);
  const [recentPosts, setRecentPosts] = useState<FirebasePost[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>({ totalPosts: 0, totalEngagement: 0, newLeads: 0, conversions: 0 });
  const [loadingData, setLoadingData] = useState(true);

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
    Promise.all([
      messagesService.getAll(),
      alertsService.getActive(),
    ]).then(([messagesResult, alertsResult]) => {
      if (messagesResult.success) {
        setUnreadCount(messagesResult.data.filter((m) => m.status === 'nova').length);
      }
      if (alertsResult.success) {
        setActiveAlertsCount(alertsResult.data.length);
      }
    });
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
    <DashboardLayout onLogout={handleLogout} activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Marketing</h1>
        <p className="text-gray-600 mt-1">Bem-vinda de volta, Fernanda! 👋</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral', icon: '📊' },
            { id: 'posts', label: 'Posts', icon: '📱' },
            { id: 'calendar', label: 'Calendário', icon: '📅' },
            { id: 'ideas', label: 'Banco de Ideias', icon: '💡' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
            { id: 'instagram', label: 'Instagram', icon: '📱' },
            { id: 'google', label: 'Google', icon: '🔍' },
            { id: 'messages', label: 'Mensagens', icon: '✉️' },
            { id: 'settings', label: 'Configurações', icon: '⚙️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-1 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
              {tab.id === 'analytics' && activeAlertsCount > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {activeAlertsCount}
                </span>
              )}
              {tab.id === 'messages' && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Resumo Semanal */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Resumo da Semana</h2>
                <p className="text-purple-100">{loadingData ? 'Carregando...' : 'Últimos 7 dias'}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{loadingData ? '—' : weeklySummary.totalPosts}</p>
                <p className="text-purple-100">posts publicados</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-purple-100 text-sm">Engajamento Total</p>
                <p className="text-2xl font-bold mt-1">{loadingData ? '—' : weeklySummary.totalEngagement}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-purple-100 text-sm">Canais Ativos</p>
                <p className="text-2xl font-bold mt-1">{loadingData ? '—' : metrics.filter(m => m.value > 0).length}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-purple-100 text-sm">Novos Leads</p>
                <p className="text-2xl font-bold mt-1">{loadingData ? '—' : weeklySummary.newLeads}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <p className="text-purple-100 text-sm">Conversões</p>
                <p className="text-2xl font-bold mt-1">{loadingData ? '—' : weeklySummary.conversions}</p>
              </div>
            </div>
          </div>

          {/* Métricas por Canal */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric) => (
              <div key={metric.channel} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{metric.icon}</span>
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${metric.change >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium">{metric.channel}</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                <p className="text-xs text-gray-500 mt-1">visualizações/cliques</p>
                <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(metric.change * 2, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Posts Recentes e Próximos Agendados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Posts Recentes */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">📱</span>
                  Posts Recentes
                </h2>
                <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                  Ver todos →
                </button>
              </div>
              <div className="space-y-3">
                {recentPosts.slice(0, 4).map((post) => (
                  <div key={post.id} className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-transparent hover:border-purple-200">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">{post.title}</h3>
                      <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600">
                        <span className="flex items-center">
                          {post.channel === 'Instagram' && '📱'}
                          {post.channel === 'GMB' && '📍'}
                          {post.channel === 'Blog' && '📝'}
                          {post.channel === 'Email' && '📧'}
                          <span className="ml-1">{post.channel}</span>
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>{new Date(post.date).toLocaleDateString('pt-BR')}</span>
                        {post.engagement && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="flex items-center text-pink-600">
                              ❤️ {post.engagement}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 mt-1">
                      {getStatusBadge(post.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Próximos Agendados */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">📅</span>
                  Próximos Agendados
                </h2>
                <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                  Calendário →
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Carrossel: 5 sinais de TDAH', channel: 'Instagram', date: '2026-03-08', time: '10:00' },
                  { title: 'FAQ: Diferença entre ansiedade e TAG', channel: 'GMB', date: '2026-03-08', time: '14:00' },
                  { title: 'Newsletter: Saúde Mental na Primavera', channel: 'Email', date: '2026-03-09', time: '09:00' },
                  { title: 'Stories: Dica do dia', channel: 'Instagram', date: '2026-03-09', time: '18:00' },
                ].map((post, idx) => (
                  <div key={idx} className="flex items-start p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">{post.title}</h3>
                      <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600">
                        <span className="flex items-center">
                          {post.channel === 'Instagram' && '📱'}
                          {post.channel === 'GMB' && '📍'}
                          {post.channel === 'Email' && '📧'}
                          <span className="ml-1">{post.channel}</span>
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>⏰ {post.time}</span>
                        <span className="text-gray-400">•</span>
                        <span>{new Date(post.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button onClick={() => setShowAIModal(true)} className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:scale-[1.02] text-left group">
              <div className="flex items-center justify-between mb-3">
                <div className="text-4xl group-hover:scale-110 transition-transform">✨</div>
                <div className="bg-white/20 rounded-full p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-xl mb-2">Gerar Conteúdo</h3>
              <p className="text-sm text-purple-100">Criar posts automaticamente com IA para todos os canais</p>
            </button>
            <button className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:scale-[1.02] text-left group">
              <div className="flex items-center justify-between mb-3">
                <div className="text-4xl group-hover:scale-110 transition-transform">📅</div>
                <div className="bg-white/20 rounded-full p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-xl mb-2">Agendar Posts</h3>
              <p className="text-sm text-blue-100">Planejar conteúdo da próxima semana em minutos</p>
            </button>
            <button onClick={() => setActiveTab('analytics')} className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all transform hover:scale-[1.02] text-left group">
              <div className="flex items-center justify-between mb-3">
                <div className="text-4xl group-hover:scale-110 transition-transform">📊</div>
                <div className="bg-white/20 rounded-full p-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="font-bold text-xl mb-2">Ver Relatórios</h3>
              <p className="text-sm text-green-100">Analytics completo com insights acionáveis</p>
            </button>
          </div>

          {/* Performance por Tipo de Conteúdo */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">🎯</span>
              Melhor Performance por Tipo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🏆</span>
                  <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">Top 1</span>
                </div>
                <h4 className="font-semibold text-gray-900">Carrosséis Instagram</h4>
                <p className="text-sm text-gray-600 mt-1">Alcance médio: 850 pessoas</p>
                <div className="mt-3 flex items-center text-sm">
                  <span className="text-green-600 font-medium">+124% vs posts únicos</span>
                </div>
              </div>
              <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🥈</span>
                  <span className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">Top 2</span>
                </div>
                <h4 className="font-semibold text-gray-900">Posts GMB com FAQ</h4>
                <p className="text-sm text-gray-600 mt-1">CTR médio: 8.2%</p>
                <div className="mt-3 flex items-center text-sm">
                  <span className="text-blue-600 font-medium">+68% de cliques</span>
                </div>
              </div>
              <div className="p-4 border-2 border-purple-200 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🥉</span>
                  <span className="text-xs font-medium text-purple-700 bg-purple-200 px-2 py-1 rounded-full">Top 3</span>
                </div>
                <h4 className="font-semibold text-gray-900">Artigos de Blog SEO</h4>
                <p className="text-sm text-gray-600 mt-1">Tempo médio: 3min 24s</p>
                <div className="mt-3 flex items-center text-sm">
                  <span className="text-purple-600 font-medium">+89% conversão</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dicas e Alertas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
              <div className="flex items-start">
                <span className="text-2xl mr-3">💡</span>
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-2">Dica da Semana</h3>
                  <p className="text-sm text-yellow-800">
                    Posts publicados às <strong>10h e 19h</strong> têm 3x mais engajamento no Instagram.
                    Considere agendar seus melhores conteúdos nesses horários!
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
              <div className="flex items-start">
                <span className="text-2xl mr-3">🎯</span>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Meta da Semana</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Alcançar <strong>10 novos leads</strong> via redes sociais
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">8 de 10 leads (80%)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'posts' && <PostsManager />}

      {activeTab === 'calendar' && <ContentCalendar />}

      {activeTab === 'ideas' && <IdeasBank />}

      {activeTab === 'analytics' && (
        <AnalyticsPanel metrics={metrics} />
      )}

      {activeTab === 'instagram' && <InstagramMetrics />}

      {activeTab === 'google' && <SearchConsoleGMBPanel />}

      {activeTab === 'messages' && (
        <MessagesInbox />
      )}

      {activeTab === 'settings' && <ProfileSettings />}

      {showAIModal && <AIContentModal onClose={() => setShowAIModal(false)} />}
    </DashboardLayout>
  );
};

export default Dashboard;
