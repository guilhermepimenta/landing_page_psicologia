import React, { useState, useEffect, useCallback } from 'react';
import { leadsService, Lead } from '../services/firebaseService';

const SOURCE_LABELS: Record<Lead['source'], string> = {
  contact_form:    'Formulário',
  screening_test:  'Teste de Rastreio',
};

const SOURCE_COLORS: Record<Lead['source'], string> = {
  contact_form:   'bg-blue-100 text-blue-700',
  screening_test: 'bg-purple-100 text-purple-700',
};

const STATUS_LABELS: Record<Lead['status'], string> = {
  new:       'Novo',
  contacted: 'Contatado',
  converted: 'Convertido',
};

const STATUS_COLORS: Record<Lead['status'], string> = {
  new:       'bg-amber-100 text-amber-700',
  contacted: 'bg-blue-100 text-blue-700',
  converted: 'bg-green-100 text-green-700',
};

const RANGE_LABELS: Record<string, string> = {
  low:      'Baixa',
  moderate: 'Moderada',
  high:     'Elevada',
};

const RANGE_COLORS: Record<string, string> = {
  low:      'text-green-600',
  moderate: 'text-yellow-600',
  high:     'text-red-600',
};

const TEST_LABELS: Record<string, string> = {
  tdah:      'TDAH',
  tea:       'TEA',
  depressao: 'Depressão',
  ansiedade: 'Ansiedade',
};

const LeadsPanel: React.FC = () => {
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filterSource, setFilterSource] = useState<'all' | Lead['source']>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | Lead['status']>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const res = await leadsService.getAll();
    if (res.success) setLeads(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const handleStatusChange = async (id: string, status: Lead['status']) => {
    setUpdatingId(id);
    await leadsService.updateStatus(id, status);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    setUpdatingId(null);
  };

  const filtered = leads.filter(l => {
    if (filterSource !== 'all' && l.source !== filterSource) return false;
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    return true;
  });

  const stats = {
    total:     leads.length,
    new:       leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
    fromTests: leads.filter(l => l.source === 'screening_test').length,
  };

  const conversionRate = stats.total > 0
    ? Math.round((stats.converted / stats.total) * 100)
    : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Carregando leads...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total de Leads',    value: stats.total,     color: 'text-gray-900' },
          { label: 'Novos',             value: stats.new,       color: 'text-amber-600' },
          { label: 'Contatados',        value: stats.contacted, color: 'text-blue-600' },
          { label: 'Convertidos',       value: stats.converted, color: 'text-green-600' },
          { label: 'Taxa de Conversão', value: `${conversionRate}%`, color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros + Refresh */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-center gap-3">
        <select
          value={filterSource}
          onChange={e => setFilterSource(e.target.value as any)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
        >
          <option value="all">Todas as origens</option>
          <option value="contact_form">Formulário</option>
          <option value="screening_test">Teste de Rastreio</option>
        </select>

        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200"
        >
          <option value="all">Todos os status</option>
          <option value="new">Novos</option>
          <option value="contacted">Contatados</option>
          <option value="converted">Convertidos</option>
        </select>

        <span className="text-sm text-gray-400 ml-auto">{filtered.length} lead{filtered.length !== 1 ? 's' : ''}</span>

        <button
          onClick={loadLeads}
          className="text-sm text-purple-600 hover:text-purple-800 underline"
        >
          Atualizar
        </button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-gray-500 font-medium">Nenhum lead encontrado</p>
          <p className="text-gray-400 text-sm mt-1">
            Os leads aparecem aqui quando alguém preenche o formulário de contato ou realiza um teste de rastreio.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => (
            <div key={lead.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">

                {/* Identidade */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{lead.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLORS[lead.source]}`}>
                      {SOURCE_LABELS[lead.source]}
                    </span>
                    {lead.resendEmailSent && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">✉️ e-mail enviado</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline">{lead.email}</a>
                    {lead.phone && <span className="text-sm text-gray-400">{lead.phone}</span>}
                  </div>

                  {/* Dados do teste */}
                  {lead.source === 'screening_test' && lead.testId && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {TEST_LABELS[lead.testId] ?? lead.testTitle}
                      </span>
                      {lead.testScore !== undefined && lead.testMaxScore !== undefined && (
                        <span className="text-xs text-gray-500">
                          {lead.testScore}/{lead.testMaxScore} pts
                        </span>
                      )}
                      {lead.testRange && (
                        <span className={`text-xs font-semibold ${RANGE_COLORS[lead.testRange]}`}>
                          {RANGE_LABELS[lead.testRange]}
                        </span>
                      )}
                    </div>
                  )}

                  {lead.message && (
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">"{lead.message}"</p>
                  )}

                  <p className="text-xs text-gray-300 mt-1">
                    {lead.createdAt
                      ? lead.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </p>
                </div>

                {/* Status + ações */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[lead.status]}`}>
                    {STATUS_LABELS[lead.status]}
                  </span>

                  <select
                    value={lead.status}
                    disabled={updatingId === lead.id}
                    onChange={e => handleStatusChange(lead.id!, e.target.value as Lead['status'])}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:opacity-50"
                  >
                    <option value="new">Novo</option>
                    <option value="contacted">Contatado</option>
                    <option value="converted">Convertido</option>
                  </select>

                  <a
                    href={`mailto:${lead.email}`}
                    className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    E-mail
                  </a>

                  {lead.phone && (
                    <a
                      href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadsPanel;
