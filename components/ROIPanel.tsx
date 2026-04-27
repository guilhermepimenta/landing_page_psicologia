import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { roiService, leadsService, ROIEntry } from '../services/firebaseService';

const INVESTMENT_CATEGORIES = ['Tráfego pago', 'Ferramentas', 'Design', 'Conteúdo', 'Consultoria', 'Outro'];
const REVENUE_CATEGORIES    = ['Novo paciente', 'Retorno', 'Avaliação neuropsicológica', 'Grupo/Workshop', 'Outro'];

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function monthLabel(ym: string) {
  const [year, month] = ym.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const ROIPanel: React.FC = () => {
  const [entries, setEntries]     = useState<ROIEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [totalLeads, setTotalLeads] = useState(0);

  const [showForm, setShowForm]   = useState<'investment' | 'revenue' | null>(null);
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDesc, setFormDesc]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [roiRes, leadsRes] = await Promise.all([
      roiService.getAll(),
      leadsService.getAll(),
    ]);
    if (roiRes.success) setEntries(roiRes.data);
    if (leadsRes.success) setTotalLeads(leadsRes.data.length);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const monthEntries  = entries.filter(e => e.month === selectedMonth);
  const investments   = monthEntries.filter(e => e.type === 'investment');
  const revenues      = monthEntries.filter(e => e.type === 'revenue');
  const totalInvested = investments.reduce((s, e) => s + e.amount, 0);
  const totalRevenue  = revenues.reduce((s, e) => s + e.amount, 0);
  const profit        = totalRevenue - totalInvested;
  const roi           = totalInvested > 0 ? ((profit / totalInvested) * 100) : null;
  const costPerLead   = totalLeads > 0 ? totalInvested / totalLeads : null;

  // Build chart data — last 6 months
  const allMonths = Array.from(new Set(entries.map(e => e.month))).sort().slice(-6);
  if (!allMonths.includes(selectedMonth)) allMonths.push(selectedMonth);
  allMonths.sort();

  const chartData = allMonths.map(m => ({
    name: monthLabel(m),
    Investimento: entries.filter(e => e.month === m && e.type === 'investment').reduce((s, e) => s + e.amount, 0),
    Receita: entries.filter(e => e.month === m && e.type === 'revenue').reduce((s, e) => s + e.amount, 0),
  }));

  // Available months for selector
  const now = new Date();
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const handleSave = async () => {
    if (!showForm || !formAmount || !formCategory) return;
    setSaving(true);
    await roiService.create({
      type: showForm,
      amount: parseFloat(formAmount.replace(',', '.')),
      category: formCategory,
      description: formDesc || undefined,
      month: selectedMonth,
    });
    setFormAmount(''); setFormCategory(''); setFormDesc('');
    setShowForm(null);
    await load();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await roiService.delete(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Investido',
            value: loading ? '—' : formatBRL(totalInvested),
            sub: selectedMonth ? monthLabel(selectedMonth) : '',
            color: 'bg-red-50 border-red-100',
            textColor: 'text-red-700',
            icon: '💸',
          },
          {
            label: 'Receita',
            value: loading ? '—' : formatBRL(totalRevenue),
            sub: selectedMonth ? monthLabel(selectedMonth) : '',
            color: 'bg-green-50 border-green-100',
            textColor: 'text-green-700',
            icon: '💰',
          },
          {
            label: 'ROI',
            value: loading ? '—' : roi !== null ? `${roi >= 0 ? '+' : ''}${roi.toFixed(0)}%` : '—',
            sub: roi !== null ? (roi >= 0 ? 'positivo' : 'negativo') : 'sem dados',
            color: roi === null || roi >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100',
            textColor: roi === null || roi >= 0 ? 'text-blue-700' : 'text-orange-700',
            icon: roi !== null && roi >= 0 ? '📈' : '📉',
          },
          {
            label: 'Custo por Lead',
            value: loading ? '—' : costPerLead !== null ? formatBRL(costPerLead) : '—',
            sub: `${totalLeads} leads no total`,
            color: 'bg-purple-50 border-purple-100',
            textColor: 'text-purple-700',
            icon: '🎯',
          },
        ].map(card => (
          <div key={card.label} className={`rounded-xl p-4 border ${card.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{card.icon}</span>
              <p className={`text-xs font-semibold uppercase tracking-wide ${card.textColor}`}>{card.label}</p>
            </div>
            <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.some(d => d.Investimento > 0 || d.Receita > 0) && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-base font-bold text-gray-900 mb-4">Investimento vs Receita (últimos meses)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatBRL(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Investimento" fill="#f87171" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Receita" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Month selector + entries */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-gray-900">Lançamentos</h3>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              {monthOptions.map(m => (
                <option key={m} value={m}>{monthLabel(m)}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm('investment'); setFormCategory(INVESTMENT_CATEGORIES[0]); }}
              className="flex items-center gap-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg font-medium transition-colors border border-red-200"
            >
              <Plus size={14} /> Investimento
            </button>
            <button
              onClick={() => { setShowForm('revenue'); setFormCategory(REVENUE_CATEGORIES[0]); }}
              className="flex items-center gap-1.5 text-sm bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg font-medium transition-colors border border-green-200"
            >
              <Plus size={14} /> Receita
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className={`mb-5 p-4 rounded-xl border ${showForm === 'investment' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <p className={`text-sm font-semibold mb-3 ${showForm === 'investment' ? 'text-red-700' : 'text-green-700'}`}>
              {showForm === 'investment' ? '💸 Novo investimento' : '💰 Nova receita'} — {monthLabel(selectedMonth)}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Valor (R$) *</label>
                <input
                  type="number"
                  value={formAmount}
                  onChange={e => setFormAmount(e.target.value)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Categoria *</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                  {(showForm === 'investment' ? INVESTMENT_CATEGORIES : REVENUE_CATEGORIES).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Descrição</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Opcional"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                disabled={saving || !formAmount || !formCategory}
                className={`flex items-center gap-1.5 text-sm text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors ${
                  showForm === 'investment' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setShowForm(null)} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10 text-gray-400">
            <div className="w-6 h-6 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
            Carregando...
          </div>
        ) : monthEntries.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="font-medium">Nenhum lançamento em {monthLabel(selectedMonth)}</p>
            <p className="text-sm mt-1">Use os botões acima para registrar investimentos e receitas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Investments */}
            {investments.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                    💸 Investimentos — {formatBRL(totalInvested)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {investments.map(e => (
                    <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 bg-red-50 rounded-xl border border-red-100">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900">{e.category}</span>
                        {e.description && <span className="text-xs text-gray-400 ml-2">— {e.description}</span>}
                      </div>
                      <span className="text-sm font-bold text-red-600 shrink-0">
                        <TrendingDown size={12} className="inline mr-1" />{formatBRL(e.amount)}
                      </span>
                      <button
                        onClick={() => e.id && handleDelete(e.id)}
                        disabled={deleting === e.id}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revenues */}
            {revenues.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-green-600">
                    💰 Receitas — {formatBRL(totalRevenue)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {revenues.map(e => (
                    <div key={e.id} className="flex items-center gap-3 px-3 py-2.5 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900">{e.category}</span>
                        {e.description && <span className="text-xs text-gray-400 ml-2">— {e.description}</span>}
                      </div>
                      <span className="text-sm font-bold text-green-600 shrink-0">
                        <TrendingUp size={12} className="inline mr-1" />{formatBRL(e.amount)}
                      </span>
                      <button
                        onClick={() => e.id && handleDelete(e.id)}
                        disabled={deleting === e.id}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {totalInvested > 0 && totalRevenue > 0 && (
              <div className={`mt-4 p-3 rounded-xl border text-sm font-semibold flex items-center justify-between ${
                profit >= 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-orange-50 border-orange-200 text-orange-800'
              }`}>
                <span>{profit >= 0 ? '✅ Lucro' : '⚠️ Prejuízo'}: {formatBRL(Math.abs(profit))}</span>
                {roi !== null && <span>ROI: {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ROIPanel;
