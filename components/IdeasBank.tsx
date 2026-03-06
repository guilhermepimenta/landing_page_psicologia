import React, { useState, useEffect } from 'react';
import { ideasService, Idea } from '../services/firebaseService';

const CATEGORY_COLORS: Record<string, string> = {
  'TDAH': 'bg-purple-100 text-purple-800 border-purple-200',
  'Avaliação Neuropsicológica': 'bg-blue-100 text-blue-800 border-blue-200',
  'Memória': 'bg-green-100 text-green-800 border-green-200',
  'Ansiedade': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Saúde Mental no Trabalho': 'bg-pink-100 text-pink-800 border-pink-200',
  'Conteúdo Sazonal': 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

const DEFAULT_COLOR = 'bg-gray-100 text-gray-800 border-gray-200';

const IdeasBank: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showUsed, setShowUsed] = useState(false);
  const [showNewIdeaForm, setShowNewIdeaForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const result = await ideasService.getAll();
      if (result.success) {
        setIdeas(result.data);
      }
    } catch (err) {
      console.error('Erro ao carregar ideias:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  // Extract unique categories
  const categories: string[] = ideas.map(i => i.category).filter((v, i, a) => a.indexOf(v) === i).sort();

  const filteredIdeas = ideas.filter((idea) => {
    const matchCategory = !selectedCategory || idea.category === selectedCategory;
    const matchUsed = showUsed || !idea.used;
    return matchCategory && matchUsed;
  });

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCategory.trim()) return;
    setSaving(true);
    try {
      await ideasService.create({
        title: newTitle.trim(),
        category: newCategory.trim(),
        used: false,
      });
      setNewTitle('');
      setNewCategory('');
      setNewDescription('');
      setShowNewIdeaForm(false);
      fetchIdeas();
    } catch (err) {
      console.error('Erro ao criar ideia:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUsed = async (idea: Idea) => {
    if (!idea.id) return;
    if (idea.used) {
      await ideasService.unmarkAsUsed(idea.id);
    } else {
      await ideasService.markAsUsed(idea.id);
    }
    fetchIdeas();
  };

  const handleDelete = async (idea: Idea) => {
    if (!idea.id || !window.confirm('Excluir esta ideia?')) return;
    await ideasService.delete(idea.id);
    fetchIdeas();
  };

  const totalIdeas = ideas.length;
  const usedCount = ideas.filter(i => i.used).length;
  const availableCount = totalIdeas - usedCount;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">💡 Total de Ideias</p>
          <p className="text-2xl font-bold text-purple-800 mt-1">{loading ? '—' : totalIdeas}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600 font-medium">📋 Disponíveis</p>
          <p className="text-2xl font-bold text-green-800 mt-1">{loading ? '—' : availableCount}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-medium">✅ Utilizadas</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{loading ? '—' : usedCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Banco de Ideias</h2>
          <button
            onClick={() => setShowNewIdeaForm(!showNewIdeaForm)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            {showNewIdeaForm ? 'Cancelar' : '+ Nova Ideia'}
          </button>
        </div>

        {/* New Idea Form */}
        {showNewIdeaForm && (
          <form onSubmit={handleCreateIdea} className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título da Ideia *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: 5 sinais de TDAH em adultos"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ex: TDAH, Ansiedade, Memória..."
                  list="categories-datalist"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  required
                />
                <datalist id="categories-datalist">
                  {categories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Detalhes ou notas sobre a ideia..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar Ideia'}
              </button>
            </div>
          </form>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Category buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !selectedCategory ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat ? 'bg-purple-600 text-white' : (CATEGORY_COLORS[cat]?.split(' ')[0] || 'bg-gray-100') + ' text-gray-700 hover:opacity-80'
                }`}
              >
                {cat} ({ideas.filter(i => i.category === cat && (!i.used || showUsed)).length})
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showUsed}
                onChange={(e) => setShowUsed(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              Mostrar utilizadas
            </label>
          </div>
        </div>

        {/* Ideas List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p>Carregando ideias...</p>
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">💡</div>
            <p className="text-lg">
              {ideas.length === 0 ? 'Nenhuma ideia cadastrada.' : 'Nenhuma ideia encontrada com esses filtros.'}
            </p>
            <p className="text-sm mt-2">Clique em "+ Nova Ideia" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredIdeas.map((idea) => (
              <div
                key={idea.id}
                className={`p-4 border-2 rounded-xl transition-all hover:shadow-md ${
                  idea.used
                    ? 'bg-gray-50 border-gray-200 opacity-60'
                    : `${CATEGORY_COLORS[idea.category] || DEFAULT_COLOR}`
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-sm ${idea.used ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {idea.title}
                    </h4>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/50">
                      {idea.category}
                    </span>
                    {idea.createdAt && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {idea.createdAt.toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleUsed(idea)}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        idea.used
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={idea.used ? 'Marcar como não usada' : 'Marcar como usada'}
                    >
                      {idea.used ? '↩️' : '✅'}
                    </button>
                    <button
                      onClick={() => handleDelete(idea)}
                      className="p-1.5 rounded-lg text-xs bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Excluir ideia"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeasBank;
