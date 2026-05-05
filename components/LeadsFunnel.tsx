import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Mail, Phone } from 'lucide-react';
import { leadsService, Lead } from '../services/firebaseService';

const SOURCE_LABELS: Record<Lead['source'], string> = {
  contact_form:      'Formulário',
  screening_test:    'Teste',
  avaliacao_landing: 'Landing Avaliação',
};

const SOURCE_COLORS: Record<Lead['source'], string> = {
  contact_form:      'bg-blue-100 text-blue-700',
  screening_test:    'bg-purple-100 text-purple-700',
  avaliacao_landing: 'bg-green-100 text-green-700',
};

const RANGE_COLORS: Record<string, string> = {
  low:      'text-green-600',
  moderate: 'text-yellow-600',
  high:     'text-red-600',
};

const RANGE_LABELS: Record<string, string> = {
  low:      'Baixa',
  moderate: 'Moderada',
  high:     'Elevada',
};

const STAGES: { key: Lead['status']; label: string; icon: string; color: string; bg: string; border: string }[] = [
  { key: 'new',       label: 'Novos',      icon: '🆕', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  { key: 'contacted', label: 'Contatados', icon: '📞', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  { key: 'converted', label: 'Convertidos',icon: '✅', color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
];

const LeadsFunnel: React.FC = () => {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [moving, setMoving]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await leadsService.getAll();
    if (res.success) setLeads(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const leadsInStage = (status: Lead['status']) =>
    leads.filter(l => l.status === status);

  const handleMove = async (lead: Lead, direction: 'forward' | 'back') => {
    const order: Lead['status'][] = ['new', 'contacted', 'converted'];
    const idx = order.indexOf(lead.status);
    const next = direction === 'forward' ? order[idx + 1] : order[idx - 1];
    if (!next || !lead.id) return;

    setMoving(lead.id);
    await leadsService.updateStatus(lead.id, next);
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: next } : l));
    setMoving(null);
  };

  // Funnel metrics
  const total     = leads.length;
  const converted = leads.filter(l => l.status === 'converted').length;
  const contacted = leads.filter(l => l.status === 'contacted').length;
  const newLeads  = leads.filter(l => l.status === 'new').length;
  const convRate  = total > 0 ? ((converted / total) * 100).toFixed(0) : '0';
  const contRate  = total > 0 ? (((contacted + converted) / total) * 100).toFixed(0) : '0';

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total',          value: total,     color: 'bg-gray-100 text-gray-800' },
          { label: 'Novos',          value: newLeads,  color: 'bg-amber-100 text-amber-800' },
          { label: 'Contatados',     value: contacted, color: 'bg-blue-100 text-blue-800' },
          { label: 'Convertidos',    value: converted, color: 'bg-green-100 text-green-800' },
          { label: 'Taxa de conv.', value: `${convRate}%`, color: 'bg-purple-100 text-purple-800' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl p-4 ${k.color}`}>
            <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">{k.label}</p>
            <p className="text-2xl font-bold mt-1">{loading ? '—' : k.value}</p>
          </div>
        ))}
      </div>

      {/* Visual funnel bar */}
      {!loading && total > 0 && (
        <div className="bg-white rounded-xl shadow-md p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">Progresso do funil</p>
          <div className="space-y-2">
            {[
              { label: 'Captados',    count: total,             pct: 100,                          color: 'bg-gray-400' },
              { label: 'Contatados',  count: contacted + converted, pct: parseInt(contRate),       color: 'bg-blue-400' },
              { label: 'Convertidos', count: converted,          pct: parseInt(convRate),           color: 'bg-green-500' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 shrink-0">{row.label}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${row.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(row.pct, 2)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-16 text-right shrink-0">
                  {row.count} ({row.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p>Carregando leads...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STAGES.map((stage, stageIdx) => {
            const stageleads = leadsInStage(stage.key);
            return (
              <div key={stage.key} className={`rounded-xl border ${stage.border} ${stage.bg} flex flex-col`}>
                {/* Column header */}
                <div className={`px-4 py-3 border-b ${stage.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span>{stage.icon}</span>
                    <span className={`font-bold text-sm ${stage.color}`}>{stage.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.color} bg-white border ${stage.border}`}>
                    {stageleads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 p-3 space-y-2 min-h-[120px]">
                  {stageleads.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">Nenhum lead aqui</p>
                  ) : (
                    stageleads.map(lead => (
                      <div
                        key={lead.id}
                        className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm"
                      >
                        {/* Lead header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
                            <p className="text-xs text-gray-400">
                              {lead.createdAt?.toLocaleDateString('pt-BR') ?? '—'}
                            </p>
                          </div>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${SOURCE_COLORS[lead.source]}`}>
                            {SOURCE_LABELS[lead.source]}
                          </span>
                        </div>

                        {/* Test info */}
                        {lead.testTitle && (
                          <div className="mb-2 text-xs text-gray-500">
                            <span className="font-medium">{lead.testTitle}</span>
                            {lead.testRange && (
                              <span className={`ml-1 font-semibold ${RANGE_COLORS[lead.testRange]}`}>
                                · {RANGE_LABELS[lead.testRange]}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Contact quick actions */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <a
                            href={`mailto:${lead.email}`}
                            onClick={e => e.stopPropagation()}
                            title={lead.email}
                            className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 border border-gray-200 px-2 py-1 rounded-lg transition-colors"
                          >
                            <Mail size={10} /> E-mail
                          </a>
                          {lead.phone && (
                            <a
                              href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              title={lead.phone}
                              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-green-600 bg-gray-50 hover:bg-green-50 border border-gray-200 px-2 py-1 rounded-lg transition-colors"
                            >
                              <Phone size={10} /> WhatsApp
                            </a>
                          )}
                        </div>

                        {/* Stage navigation */}
                        <div className="flex gap-1.5">
                          {stageIdx > 0 && (
                            <button
                              onClick={() => handleMove(lead, 'back')}
                              disabled={moving === lead.id}
                              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <ChevronLeft size={10} /> Voltar
                            </button>
                          )}
                          {stageIdx < STAGES.length - 1 && (
                            <button
                              onClick={() => handleMove(lead, 'forward')}
                              disabled={moving === lead.id}
                              className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors disabled:opacity-50 ${
                                stageIdx === 0
                                  ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                                  : 'text-green-700 bg-green-100 hover:bg-green-200'
                              }`}
                            >
                              {stageIdx === 0 ? 'Contatado' : 'Convertido'} <ChevronRight size={10} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeadsFunnel;
