import React, { useState } from 'react';
import { X, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { generateCampaign, CampaignPost, ContentChannel, ContentTone } from '../services/aiContentService';
import { postsService } from '../services/firebaseService';

interface Props {
  onClose: () => void;
  onSaved: () => void;
  initialChannel?: ContentChannel;
}

type Step = 'setup' | 'review' | 'done';

const CHANNELS: { value: ContentChannel; icon: string; label: string }[] = [
  { value: 'Instagram', icon: '📱', label: 'Instagram' },
  { value: 'Facebook', icon: '📘', label: 'Facebook' },
  { value: 'Blog',     icon: '📝', label: 'Blog' },
  { value: 'Email',    icon: '📧', label: 'E-mail' },
  { value: 'GMB',      icon: '📍', label: 'GMB' },
];

const TONES: { value: ContentTone; label: string; emoji: string }[] = [
  { value: 'informativo',  label: 'Informativo',  emoji: '📚' },
  { value: 'empático',     label: 'Empático',     emoji: '🤝' },
  { value: 'educativo',    label: 'Educativo',    emoji: '🎓' },
  { value: 'motivacional', label: 'Motivacional', emoji: '✨' },
];

const CampaignStudio: React.FC<Props> = ({ onClose, onSaved, initialChannel }) => {
  const [step, setStep]             = useState<Step>('setup');
  const [theme, setTheme]           = useState('');
  const [channel, setChannel]       = useState<ContentChannel>(initialChannel ?? 'Instagram');
  const [tone, setTone]             = useState<ContentTone>('informativo');
  const [postCount, setPostCount]   = useState(5);
  const [campaignId]                = useState(() => `campaign_${Date.now()}`);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [posts, setPosts]           = useState<CampaignPost[]>([]);
  const [editedPosts, setEditedPosts] = useState<CampaignPost[]>([]);
  const [expanded, setExpanded]     = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState('');
  const [saving, setSaving]         = useState<number | null>(null);
  const [saved, setSaved]           = useState<number[]>([]);

  const handleGenerate = async () => {
    if (!theme.trim()) { setGenError('Informe o tema da campanha.'); return; }
    setGenerating(true);
    setGenError('');
    try {
      const result = await generateCampaign(theme, channel, tone, postCount);
      setCampaignTitle(result.campaignTitle);
      setPosts(result.posts);
      setEditedPosts(result.posts.map(p => ({ ...p })));
      setExpanded(0);
      setStep('review');
    } catch {
      setGenError('Erro ao gerar campanha. Verifique a chave Gemini e tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = (index: number, field: 'title' | 'content', value: string) => {
    setEditedPosts(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleSavePost = async (index: number) => {
    const p = editedPosts[index];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + p.dayOffset);

    setSaving(index);
    const result = await postsService.create({
      title: p.title,
      channel,
      content: p.content,
      status: 'draft',
      date: startDate,
      engagement: 0,
      imageUrls: [],
      campaignId,
      campaignTitle,
    });
    if (result.success) {
      setSaved(prev => [...prev, index]);
      onSaved();
      if (saved.length + 1 === posts.length) setStep('done');
    }
    setSaving(null);
  };

  const handleSaveAll = async () => {
    for (let i = 0; i < editedPosts.length; i++) {
      if (!saved.includes(i)) await handleSavePost(i);
    }
    setStep('done');
  };

  const getEdited = (i: number) => editedPosts[i] ?? posts[i];

  const startDate = new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🎯</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Criar Série de Conteúdo</h2>
              <p className="text-xs text-gray-400">
                {step === 'setup' ? 'Configure sua campanha temática' :
                 step === 'review' ? `${posts.length} posts gerados — revise e salve` :
                 'Campanha criada com sucesso'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Step bar */}
        <div className="flex items-center gap-1 px-5 py-2.5 bg-gray-50 border-b shrink-0">
          {(['setup', 'review', 'done'] as Step[]).map((s, i) => {
            const labels = { setup: 'Configurar', review: 'Revisar', done: 'Concluído' };
            const idx = ['setup', 'review', 'done'].indexOf(step);
            return (
              <React.Fragment key={s}>
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                  s === step ? 'bg-purple-600 text-white' :
                  i < idx ? 'bg-purple-100 text-purple-700' : 'text-gray-400'
                }`}>
                  <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px] font-bold shrink-0">
                    {i < idx ? '✓' : i + 1}
                  </span>
                  {labels[s]}
                </span>
                {i < 2 && <div className={`w-4 h-px shrink-0 ${i < idx ? 'bg-purple-300' : 'bg-gray-200'}`} />}
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* ── SETUP ── */}
          {step === 'setup' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tema da campanha *</label>
                <input
                  type="text"
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                  placeholder="Ex: Ansiedade no ambiente de trabalho"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Canal</label>
                <div className="grid grid-cols-5 gap-2">
                  {CHANNELS.map(ch => (
                    <button
                      key={ch.value}
                      onClick={() => setChannel(ch.value)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-medium transition-all ${
                        channel === ch.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-500 hover:border-purple-300'
                      }`}
                    >
                      <span className="text-xl">{ch.icon}</span>
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tom</label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                        tone === t.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700 font-semibold'
                          : 'border-gray-200 text-gray-600 hover:border-purple-300'
                      }`}
                    >
                      <span>{t.emoji}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número de posts: <span className="text-purple-600">{postCount}</span>
                </label>
                <div className="flex gap-2">
                  {[3, 4, 5, 6, 7].map(n => (
                    <button
                      key={n}
                      onClick={() => setPostCount(n)}
                      className={`w-10 h-10 rounded-xl border-2 text-sm font-bold transition-all ${
                        postCount === n
                          ? 'border-purple-500 bg-purple-600 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-purple-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Posts distribuídos ao longo de {postCount === 3 ? '~1 semana' : postCount === 5 ? '~2 semanas' : '~3 semanas'}
                </p>
              </div>

              {genError && <p className="text-sm text-red-500 text-center">{genError}</p>}

              <button
                onClick={handleGenerate}
                disabled={generating || !theme.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 disabled:opacity-50 text-white py-3.5 rounded-xl font-semibold transition-all shadow-md"
              >
                {generating ? (
                  <><Loader2 size={17} className="animate-spin" /> Gerando {postCount} posts com IA...</>
                ) : (
                  <>🎯 Gerar Campanha com IA</>
                )}
              </button>
            </>
          )}

          {/* ── REVIEW ── */}
          {step === 'review' && (
            <>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Campanha</p>
                <p className="text-sm font-bold text-indigo-900">{campaignTitle}</p>
                <p className="text-xs text-indigo-500 mt-0.5">
                  {channel} · {postCount} posts · iniciando hoje
                </p>
              </div>

              <div className="space-y-2">
                {posts.map((_, i) => {
                  const p = getEdited(i);
                  const isSaved = saved.includes(i);
                  const isOpen = expanded === i;
                  const pubDate = new Date(startDate);
                  pubDate.setDate(pubDate.getDate() + p.dayOffset);

                  return (
                    <div key={i} className={`border rounded-xl overflow-hidden transition-all ${isSaved ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : i)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSaved ? 'bg-green-500 text-white' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {isSaved ? <Check size={12} /> : i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                          <p className="text-xs text-gray-400">
                            {pubDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                            {i === 0 ? ' · hoje' : ` · dia +${p.dayOffset}`}
                          </p>
                        </div>
                        {isSaved
                          ? <span className="text-xs text-green-600 font-semibold flex items-center gap-1 shrink-0"><Check size={12} /> Salvo</span>
                          : isOpen ? <ChevronUp size={15} className="text-gray-400 shrink-0" /> : <ChevronDown size={15} className="text-gray-400 shrink-0" />
                        }
                      </button>

                      {isOpen && !isSaved && (
                        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                          <div className="pt-3 space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Título</label>
                            <input
                              type="text"
                              value={p.title}
                              onChange={e => handleEdit(i, 'title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conteúdo</label>
                            <textarea
                              rows={5}
                              value={p.content}
                              onChange={e => handleEdit(i, 'content', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                            />
                          </div>
                          {p.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {p.hashtags.map(h => (
                                <span key={h} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">#{h}</span>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => handleSavePost(i)}
                            disabled={saving === i}
                            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                          >
                            {saving === i ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : `💾 Salvar post ${i + 1} como rascunho`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {saved.length < posts.length && (
                <button
                  onClick={handleSaveAll}
                  disabled={saving !== null}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-all shadow-md"
                >
                  {saving !== null ? (
                    <><Loader2 size={16} className="animate-spin" /> Salvando...</>
                  ) : (
                    <>💾 Salvar todos como rascunho</>
                  )}
                </button>
              )}
            </>
          )}

          {/* ── DONE ── */}
          {step === 'done' && (
            <div className="text-center py-10 space-y-4">
              <div className="text-6xl">🎉</div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{campaignTitle}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {saved.length} posts salvos como rascunho no canal {channel}
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-left space-y-1.5">
                {saved.map(i => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check size={14} className="text-green-500 shrink-0" />
                    <span className="truncate">{getEdited(i).title}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Acesse a aba Posts ou o Calendário para editar e publicar cada post.
              </p>
              <button
                onClick={onClose}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-xl font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignStudio;
