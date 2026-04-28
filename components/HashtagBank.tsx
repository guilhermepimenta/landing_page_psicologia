import React, { useState, useEffect } from 'react';
import { Loader2, Copy, Trash2, Check } from 'lucide-react';
import { generateHashtags } from '../services/aiContentService';
import { hashtagsService, HashtagSet } from '../services/firebaseService';

const HashtagBank: React.FC = () => {
  const [sets, setSets]           = useState<HashtagSet[]>([]);
  const [loading, setLoading]     = useState(true);
  const [theme, setTheme]         = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]   = useState('');
  const [copied, setCopied]       = useState<string | null>(null);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);

  const fetchSets = async () => {
    setLoading(true);
    const result = await hashtagsService.getAll();
    if (result.success) setSets(result.data);
    setLoading(false);
  };

  useEffect(() => { fetchSets(); }, []);

  const handleGenerate = async () => {
    if (!theme.trim()) { setGenError('Informe o tema para gerar hashtags.'); return; }
    setGenerating(true);
    setGenError('');
    try {
      const hashtags = await generateHashtags(theme);
      if (hashtags.length === 0) throw new Error('Nenhuma hashtag gerada');
      const result = await hashtagsService.create({ theme: theme.trim(), hashtags });
      if (result.success) {
        setTheme('');
        fetchSets();
      }
    } catch {
      setGenError('Erro ao gerar hashtags. Verifique a chave Gemini.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (set: HashtagSet) => {
    const text = set.hashtags.map(h => `#${h}`).join(' ');
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(set.id ?? '');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este conjunto de hashtags?')) return;
    setDeleting(id);
    await hashtagsService.delete(id);
    setSets(prev => prev.filter(s => s.id !== id));
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <p className="text-sm text-purple-600 font-medium"># Conjuntos</p>
          <p className="text-2xl font-bold text-purple-800 mt-1">{loading ? '—' : sets.length}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <p className="text-sm text-indigo-600 font-medium"># Hashtags</p>
          <p className="text-2xl font-bold text-indigo-800 mt-1">
            {loading ? '—' : sets.reduce((acc, s) => acc + s.hashtags.length, 0)}
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 col-span-2 md:col-span-1">
          <p className="text-sm text-blue-600 font-medium">Média por conjunto</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">
            {loading || sets.length === 0 ? '—' : Math.round(sets.reduce((acc, s) => acc + s.hashtags.length, 0) / sets.length)}
          </p>
        </div>
      </div>

      {/* Generate panel */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>✨</span> Gerar Hashtags com IA
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={theme}
            onChange={e => setTheme(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            placeholder="Ex: TDAH em adultos, ansiedade no trabalho, neuropsicologia..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            disabled={generating}
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !theme.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold transition-all shadow-md whitespace-nowrap"
          >
            {generating ? <><Loader2 size={15} className="animate-spin" /> Gerando...</> : <>✨ Gerar</>}
          </button>
        </div>
        {genError && <p className="text-sm text-red-500 mt-2">{genError}</p>}
        <p className="text-xs text-gray-400 mt-2">
          Gera 25 hashtags estratégicas: amplas, médias e de nicho para psicologia/saúde mental.
        </p>
      </div>

      {/* Hashtag sets */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Conjuntos Salvos</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p>Carregando hashtags...</p>
          </div>
        ) : sets.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">#</div>
            <p className="font-medium text-gray-500">Nenhum conjunto salvo ainda.</p>
            <p className="text-sm mt-1">Use o gerador acima para criar o primeiro.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sets.map(set => {
              const isOpen = expanded === set.id;
              const isCopied = copied === set.id;
              const isDeleting = deleting === set.id;

              return (
                <div key={set.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  {/* Header row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => setExpanded(isOpen ? null : (set.id ?? null))}
                      className="flex-1 flex items-center gap-3 text-left min-w-0"
                    >
                      <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-purple-700 font-bold text-sm">#</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{set.theme}</p>
                        <p className="text-xs text-gray-400">{set.hashtags.length} hashtags</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopy(set)}
                        title="Copiar todas"
                        className={`p-2 rounded-lg transition-colors ${
                          isCopied ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isCopied ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                      <button
                        onClick={() => set.id && handleDelete(set.id)}
                        disabled={isDeleting}
                        title="Excluir"
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Preview chips (always visible, first 8) */}
                  <div className="px-4 pb-3 flex flex-wrap gap-1">
                    {(isOpen ? set.hashtags : set.hashtags.slice(0, 8)).map(h => (
                      <span
                        key={h}
                        onClick={() => { navigator.clipboard.writeText(`#${h}`).catch(() => {}); }}
                        title="Clicar para copiar"
                        className="text-xs bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full cursor-pointer hover:bg-purple-100 transition-colors"
                      >
                        #{h}
                      </span>
                    ))}
                    {!isOpen && set.hashtags.length > 8 && (
                      <button
                        onClick={() => setExpanded(set.id ?? null)}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-0.5"
                      >
                        +{set.hashtags.length - 8} mais
                      </button>
                    )}
                  </div>

                  {/* Expanded copy bar */}
                  {isOpen && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                      <p className="text-xs text-gray-400 flex-1 truncate">
                        {set.hashtags.map(h => `#${h}`).join(' ')}
                      </p>
                      <button
                        onClick={() => handleCopy(set)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                          isCopied ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        {isCopied ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar tudo</>}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HashtagBank;
