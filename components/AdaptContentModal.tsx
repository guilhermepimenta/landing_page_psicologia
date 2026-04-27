import React, { useState } from 'react';
import { X, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { adaptContent, AdaptedContent, ContentChannel } from '../services/aiContentService';
import { postsService, Post } from '../services/firebaseService';

interface Props {
  post: Post;
  onClose: () => void;
  onSaved: () => void;
}

const ALL_CHANNELS: ContentChannel[] = ['Instagram', 'Facebook', 'Blog', 'Email', 'GMB'];

const CHANNEL_META: Record<ContentChannel, { icon: string; label: string; desc: string }> = {
  Instagram: { icon: '📱', label: 'Instagram',         desc: 'Post curto com hashtags' },
  Facebook:  { icon: '📘', label: 'Facebook',          desc: 'Texto conversacional' },
  Blog:      { icon: '📝', label: 'Blog',              desc: 'Artigo SEO completo' },
  Email:     { icon: '📧', label: 'E-mail',            desc: 'Newsletter personalizada' },
  GMB:       { icon: '📍', label: 'Google Meu Negócio', desc: 'Post local e direto' },
};

const AdaptContentModal: React.FC<Props> = ({ post, onClose, onSaved }) => {
  const availableChannels = ALL_CHANNELS.filter(ch => ch !== post.channel);
  const [selected, setSelected]     = useState<ContentChannel[]>([]);
  const [generating, setGenerating] = useState(false);
  const [results, setResults]       = useState<AdaptedContent[]>([]);
  const [editedResults, setEditedResults] = useState<AdaptedContent[]>([]);
  const [expanded, setExpanded]     = useState<ContentChannel | null>(null);
  const [saving, setSaving]         = useState<ContentChannel | null>(null);
  const [saved, setSaved]           = useState<ContentChannel[]>([]);
  const [error, setError]           = useState('');

  const toggle = (ch: ContentChannel) =>
    setSelected(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);

  const handleGenerate = async () => {
    if (selected.length === 0) { setError('Selecione pelo menos um canal.'); return; }
    if (!post.content && !post.title) { setError('Este post não tem conteúdo para adaptar.'); return; }
    setGenerating(true);
    setError('');
    setResults([]);
    setSaved([]);
    try {
      const adapted = await adaptContent(
        post.title,
        post.content ?? post.title,
        post.channel as ContentChannel,
        selected,
      );
      setResults(adapted);
      setEditedResults(adapted);
      if (adapted.length > 0) setExpanded(adapted[0].channel);
    } catch {
      setError('Erro ao gerar adaptações. Verifique a chave Gemini e tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = (channel: ContentChannel, field: 'title' | 'content', value: string) => {
    setEditedResults(prev => prev.map(r => r.channel === channel ? { ...r, [field]: value } : r));
  };

  const handleSaveDraft = async (adapted: AdaptedContent) => {
    setSaving(adapted.channel);
    const draft: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = {
      title:     adapted.title,
      channel:   adapted.channel,
      content:   adapted.content,
      status:    'draft',
      date:      new Date(),
      engagement: 0,
      imageUrls: post.imageUrls ?? [],
    };
    const result = await postsService.create(draft);
    if (result.success) {
      setSaved(prev => [...prev, adapted.channel]);
      onSaved();
    }
    setSaving(null);
  };

  const getEdited = (ch: ContentChannel) =>
    editedResults.find(r => r.channel === ch) ?? results.find(r => r.channel === ch)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Adaptar para outros canais</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">
              "{post.title}" · origem: <strong>{post.channel}</strong>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Canal selector */}
          {results.length === 0 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Escolha os canais para adaptar:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {availableChannels.map(ch => {
                    const meta = CHANNEL_META[ch];
                    const isSelected = selected.includes(ch);
                    return (
                      <button
                        key={ch}
                        onClick={() => toggle(ch)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                        }`}
                      >
                        <span className="text-2xl">{meta.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
                          <p className="text-xs text-gray-400">{meta.desc}</p>
                        </div>
                        {isSelected && (
                          <Check size={16} className="ml-auto text-purple-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conteúdo original resumido */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Conteúdo original ({post.channel})
                </p>
                <p className="text-sm text-gray-700 line-clamp-3">
                  {post.content ?? post.title}
                </p>
              </div>

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <button
                onClick={handleGenerate}
                disabled={generating || selected.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold transition-all shadow-md"
              >
                {generating ? (
                  <><Loader2 size={17} className="animate-spin" /> Adaptando com IA...</>
                ) : (
                  <>✨ Gerar {selected.length > 0 ? `${selected.length} adaptaç${selected.length > 1 ? 'ões' : 'ão'}` : 'adaptações'}</>
                )}
              </button>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  {results.length} adaptaç{results.length > 1 ? 'ões' : 'ão'} gerada{results.length > 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => { setResults([]); setEditedResults([]); setSaved([]); setExpanded(null); }}
                  className="text-xs text-purple-600 hover:text-purple-800 underline"
                >
                  Gerar novamente
                </button>
              </div>

              {results.map(r => {
                const meta = CHANNEL_META[r.channel];
                const edited = getEdited(r.channel);
                const isSaved = saved.includes(r.channel);
                const isExpanded = expanded === r.channel;

                return (
                  <div key={r.channel} className={`border rounded-xl overflow-hidden transition-all ${isSaved ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                    {/* Accordion header */}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : r.channel)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-xl">{meta.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
                        <p className="text-xs text-gray-400 line-clamp-1">{edited.title}</p>
                      </div>
                      {isSaved
                        ? <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><Check size={12} /> Salvo</span>
                        : isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />
                      }
                    </button>

                    {/* Accordion body */}
                    {isExpanded && !isSaved && (
                      <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                        <div className="space-y-1.5 pt-3">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Título / Assunto</label>
                          <input
                            type="text"
                            value={edited.title}
                            onChange={e => handleEdit(r.channel, 'title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conteúdo</label>
                          <textarea
                            rows={6}
                            value={edited.content}
                            onChange={e => handleEdit(r.channel, 'content', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                          />
                        </div>
                        {edited.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {edited.hashtags.map(h => (
                              <span key={h} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">#{h}</span>
                            ))}
                          </div>
                        )}
                        <button
                          onClick={() => handleSaveDraft(edited)}
                          disabled={saving === r.channel}
                          className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                        >
                          {saving === r.channel
                            ? <><Loader2 size={14} className="animate-spin" /> Salvando...</>
                            : `Salvar como rascunho · ${meta.label}`
                          }
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {saved.length === results.length && (
                <div className="text-center py-4">
                  <p className="text-green-600 font-semibold text-sm">✅ Todas as adaptações salvas como rascunho!</p>
                  <button onClick={onClose} className="mt-3 text-sm text-purple-600 underline hover:text-purple-800">
                    Fechar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdaptContentModal;
