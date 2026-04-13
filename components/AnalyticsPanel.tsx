import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getGA4Data, isDevMode, WeeklyRow, MonthlyRow, MetricRow } from '../services/ga4Service';
import { alertsService, DashboardAlert } from '../services/firebaseService';

interface AnalyticsPanelProps {
  metrics: { channel: string; value: number; change: number; icon: string }[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

const FALLBACK_WEEKLY: WeeklyRow[] = [
  { dia: 'Seg', Instagram: 180, GMB: 45, Blog: 12, Email: 8 },
  { dia: 'Ter', Instagram: 220, GMB: 52, Blog: 18, Email: 11 },
  { dia: 'Qua', Instagram: 195, GMB: 48, Blog: 15, Email: 9 },
  { dia: 'Qui', Instagram: 310, GMB: 61, Blog: 22, Email: 14 },
  { dia: 'Sex', Instagram: 280, GMB: 58, Blog: 19, Email: 12 },
  { dia: 'Sáb', Instagram: 390, GMB: 42, Blog: 8, Email: 5 },
  { dia: 'Dom', Instagram: 340, GMB: 36, Blog: 6, Email: 3 },
];

const FALLBACK_MONTHLY: MonthlyRow[] = [
  { mes: 'Out', leads: 4, conversoes: 1 },
  { mes: 'Nov', leads: 6, conversoes: 2 },
  { mes: 'Dez', leads: 5, conversoes: 2 },
  { mes: 'Jan', leads: 8, conversoes: 3 },
  { mes: 'Fev', leads: 11, conversoes: 4 },
  { mes: 'Mar', leads: 14, conversoes: 5 },
];

const FALLBACK_METRICS: MetricRow[] = [
  { metrica: 'taxa_engajamento', valor: 12.4, variacao: 2.1 },
  { metrica: 'alcance_total', valor: 5800, variacao: 18 },
  { metrica: 'leads', valor: 14, variacao: 27 },
  { metrica: 'taxa_conversao', valor: 35.7, variacao: 5 },
];

const KPI_CONFIG = [
  { label: 'Taxa de Engajamento', key: 'taxa_engajamento', suffix: '%' },
  { label: 'Alcance Total', key: 'alcance_total', suffix: '' },
  { label: 'Leads Gerados', key: 'leads', suffix: '' },
  { label: 'Taxa de Conversão', key: 'taxa_conversao', suffix: '%' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
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

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ metrics }) => {
  const [weeklyData, setWeeklyData] = useState<WeeklyRow[]>(FALLBACK_WEEKLY);
  const [monthlyData, setMonthlyData] = useState<MonthlyRow[]>(FALLBACK_MONTHLY);
  const [summaryMetrics, setSummaryMetrics] = useState<MetricRow[]>(FALLBACK_METRICS);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<DashboardAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const loadGA4Data = () => {
    setLoading(true);
    setFetchError(null);
    getGA4Data()
      .then(data => {
        if (data.weeklyEngagement.length > 0) setWeeklyData(data.weeklyEngagement);
        if (data.monthlyTrend.length > 0) setMonthlyData(data.monthlyTrend);
        if (data.summaryMetrics.length > 0) setSummaryMetrics(data.summaryMetrics);
        setUsingMock(false);
      })
      .catch(err => {
        console.error('GA4 fetch error:', err);
        setFetchError(String(err?.message ?? 'Erro desconhecido'));
        setUsingMock(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadGA4Data(); }, []);

  useEffect(() => {
    alertsService.getActive()
      .then(res => { if (res.success) setActiveAlerts(res.data); })
      .catch(() => { /* silencioso — alertas são opcionais */ })
      .finally(() => setAlertsLoading(false));
  }, []);

  const kpis = KPI_CONFIG.map(k => {
    const row = summaryMetrics.find(m => m.metrica === k.key);
    const rawVal = row?.valor ?? 0;
    const formatted =
      k.key === 'alcance_total' && rawVal >= 1000
        ? `${(rawVal / 1000).toFixed(1)}K`
        : `${rawVal}${k.suffix}`;
    return { label: k.label, value: formatted, trend: `+${row?.variacao ?? 0}%` };
  });

  const pieData =
    metrics.length > 0
      ? metrics.map(m => ({ name: m.channel, value: m.value || 1 }))
      : [
          { name: 'Instagram', value: 60 },
          { name: 'GMB', value: 20 },
          { name: 'Blog', value: 12 },
          { name: 'Email', value: 8 },
        ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Carregando dados do Google Sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de status */}
      {usingMock ? (
        <div className={`border rounded-xl p-4 flex items-start gap-3 ${isDevMode && fetchError === '__dev_mode__' ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
          <span className="text-xl flex-shrink-0">{isDevMode && fetchError === '__dev_mode__' ? '🖥️' : '📋'}</span>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${isDevMode && fetchError === '__dev_mode__' ? 'text-blue-800' : 'text-amber-800'}`}>
              {isDevMode && fetchError === '__dev_mode__'
                ? 'Ambiente de desenvolvimento — exibindo dados de demonstração'
                : fetchError && fetchError !== '__dev_mode__'
                  ? `Erro ao conectar com GA4: ${fetchError}`
                  : 'Exibindo dados de demonstração'}
            </p>
            <p className={`text-xs mt-1 ${isDevMode && fetchError === '__dev_mode__' ? 'text-blue-700' : 'text-amber-700'}`}>
              {isDevMode && fetchError === '__dev_mode__'
                ? 'Em produção (Vercel), os dados reais do GA4 serão carregados automaticamente.'
                : 'Configure as variáveis GA4_PROPERTY_ID, GA4_CLIENT_EMAIL e GA4_PRIVATE_KEY no Vercel Dashboard.'}
            </p>
          </div>
          {(!isDevMode || fetchError !== '__dev_mode__') && (
            <button
              onClick={loadGA4Data}
              className="text-xs text-amber-700 underline hover:text-amber-900 flex-shrink-0"
            >
              Tentar novamente
            </button>
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <span>✅</span>
          <p className="text-sm text-green-800 font-medium">Dados reais do Google Analytics 4</p>
          <button
            onClick={loadGA4Data}
            className="ml-auto text-xs text-green-700 underline hover:text-green-900"
          >
            Atualizar
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl shadow-md p-5">
            <p className="text-xs text-gray-500 font-medium uppercase">{kpi.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
            <p className="text-sm font-medium mt-1 text-green-600">↑ {kpi.trend} vs mês anterior</p>
          </div>
        ))}
      </div>

      {/* Gráfico de barras: Engajamento semanal por canal */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 Engajamento Semanal por Canal</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Instagram" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="GMB" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Blog" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Email" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de área + pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">📈 Tendência de Leads (6 meses)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="leads" name="Leads" stroke="#8b5cf6" fill="url(#leadsGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="conversoes" name="Conversões" stroke="#10b981" fill="url(#convGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">🥧 Distribuição por Canal</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'visualizações']} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas automáticos */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          🔔 Alertas e Insights Automáticos
          {!alertsLoading && activeAlerts.length > 0 && (
            <span className="ml-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {activeAlerts.length}
            </span>
          )}
        </h3>
        <div className="space-y-3">
          {alertsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
              Carregando alertas...
            </div>
          ) : activeAlerts.length === 0 ? (
            <div className="flex items-start gap-3 p-4 rounded-lg border bg-green-50 border-green-200">
              <span className="text-xl flex-shrink-0">✅</span>
              <p className="text-sm text-green-800">Nenhum alerta ativo no momento. Tudo certo!</p>
            </div>
          ) : (
            activeAlerts.map((alert) => {
              const styleMap = {
                critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '🚨' },
                warning:  { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '⚠️' },
                info:     { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: '💡' },
              };
              const s = styleMap[alert.severity] ?? styleMap.info;
              return (
                <div
                  key={alert.id ?? alert.key}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${s.bg} ${s.border}`}
                >
                  <span className="text-xl flex-shrink-0">{s.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm ${s.text}`}>{alert.message}</p>
                    {alert.createdAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(alert.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
