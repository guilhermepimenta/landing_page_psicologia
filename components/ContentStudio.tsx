import React, { useState } from 'react';
import { generateContent, ContentChannel, InstagramFormat, ContentTone, GeneratedContent } from '../services/aiContentService';
import { runTrendScout, TrendSuggestion, TrendScoutResult } from '../services/trendScoutService';
import { generateImageFromPrompt, suggestImagePrompt } from '../services/imagenService';
import { postsService, Post } from '../services/firebaseService';
import { imageService } from '../services/imageService';
import { publishToInstagram } from '../services/instagramService';
import InstagramPreview from './InstagramPreview';

interface ContentStudioProps {
  onClose: () => void;
  onSaved: () => void;
  initialChannel?: ContentChannel;
  initialFormat?: InstagramFormat;
  initialTopic?: string;
  initialDate?: Date;
}

type Step = 'channel' | 'format' | 'content' | 'media' | 'preview' | 'publish';
type ChannelFormat = InstagramFormat | 'artigo' | 'atualizacao' | 'newsletter';

const CHANNEL_FORMATS: Record<ContentChannel, { value: ChannelFormat; label: string; icon: string; desc: string }[]> = {
  Instagram: [
    { value: 'post', label: 'Post', icon: '🖼️', desc: 'Imagem + legenda' },
    { value: 'carrossel', label: 'Carrossel', icon: '🎠', desc: '7-9 slides sequenciais' },
    { value: 'reels', label: 'Reels', icon: '🎬', desc: 'Roteiro de vídeo 15-30s' },
  ],
  GMB: [
    { value: 'atualizacao', label: 'Atualização', icon: '📍', desc: 'Post no Google Meu Negócio' },
  ],
  Blog: [
    { value: 'artigo', label: 'Artigo', icon: '📝', desc: 'Post SEO-friendly para o blog' },
  ],
  Email: [
    { value: 'newsletter', label: 'Newsletter', icon: '📧', desc: 'E-mail para pacientes e leads' },
  ],
};

const TONES: { value: ContentTone; label: string; emoji: string }[] = [
  { value: 'informativo', label: 'Informativo', emoji: '📚' },
  { value: 'empático', label: 'Empático', emoji: '🤝' },
  { value: 'educativo', label: 'Educativo', emoji: '🎓' },
  { value: 'motivacional', label: 'Motivacional', emoji: '✨' },
];

const SCAN_STEPS = [
  'Buscando temas em alta no Google Trends BR...',
  'Analisando perfis de psicologia no Instagram...',
  'Verificando vídeos virais no YouTube...',
  'Rastreando notícias e campanhas de saúde mental...',
  'Sintetizando sugestões personalizadas...',
];

const STEP_LABELS: Record<Step, string> = {
  channel: 'Canal',
  format: 'Formato',
  content: 'Conteúdo',
  media: 'Mídia',
  preview: 'Preview',
  publish: 'Publicar',
};

const ContentStudio: React.FC<ContentStudioProps> = ({
  onClose,
  onSaved,
  initialChannel,
  initialFormat,
  initialTopic,
  initialDate,
}) => {
  const [step, setStep] = useState<Step>('channel');

  const [channel, setChannel] = useState<ContentChannel>(initialChannel ?? 'Instagram');
  const [format, setFormat] = useState<ChannelFormat>(initialFormat ?? 'post');
  const [topic, setTopic] = useState(initialTopic ?? '');
  const [tone, setTone] = useState<ContentTone>('informativo');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');

  const [imageDataUrls, setImageDataUrls] = useState<string[]>([]);
  const [imagenPrompt, setImagenPrompt] = useState('');
  const [imagenGenerating, setImagenGenerating] = useState(false);
  const [imagenError, setImagenError] = useState('');

  const [trendOpen, setTrendOpen] = useState(false);
  const [trendStatus, setTrendStatus] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle');
  const [trendResult, setTrendResult] = useState<TrendScoutResult | null>(null);
  const [trendError, setTrendError] = useState('');
  const [trendScanStep, setTrendScanStep] = useState(0);

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const [scheduledDate, setScheduledDate] = useState((initialDate ?? new Date()).toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [publishSuccess, setPublishSuccess] = useState('');

  const isInstagram = channel === 'Instagram';
  const isReels = format === 'reels';
  const instagramFormat = (format === 'post' || format === 'carrossel' || format === 'reels')
    ? format as InstagramFormat
    : 'post';

  const steps: Step[] = isInstagram
    ? ['channel', 'format', 'content', 'media', 'preview', 'publish']
    : ['channel', 'format', 'content', 'preview', 'publish'];

  const stepIndex = steps.indexOf(step);
  const goNext = () => { const next = steps[stepIndex + 1]; if (next) setStep(next); };
  const goPrev = () => { const prev = steps[stepIndex - 1]; if (prev) setStep(prev); };

  const handleTrendScan = async () => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setTrendError('Chave da API Gemini não configurada.');
      setTrendStatus('error');
      return;
    }
    setTrendStatus('scanning');
    setTrendScanStep(0);
    setTrendError('');
    const interval = setInterval(() => {
      setTrendScanStep(prev => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);
    try {
      const data = await runTrendScout();
      clearInterval(interval);
      setTrendResult(data);
      setTrendStatus('done');
    } catch {
      clearInterval(interval);
      setTrendError('Erro ao executar varredura. Tente novamente.');
      setTrendStatus('error');
    }
  };

  const handleUseTrendTopic = (suggestion: TrendSuggestion) => {
    setTopic(suggestion.topic);
    if (isInstagram) setFormat(suggestion.format);
    setTrendOpen(false);
  };

  const handleGenerateContent = async () => {
    if (!topic.trim()) { setAiError('Informe o tema do conteúdo primeiro.'); return; }
    setAiGenerating(true);
    setAiError('');
    try {
      const result = await generateContent(topic, channel, tone, isInstagram ? instagramFormat : undefined);
      setGeneratedContent(result);
      setEditedContent(result.content);
      setEditedTitle(result.title);
    } catch {
      setAiError('Erro ao gerar conteúdo. Verifique a chave da API Gemini.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSuggestPrompt = async () => {
    try {
      const suggested = await suggestImagePrompt(topic || 'psicologia mental health', format, channel);
      setImagenPrompt(suggested);
    } catch {
      setImagenPrompt('Calming psychology office, soft purple tones, minimalist, abstract, no text, no faces');
    }
  };

  const handleGenerateImage = async () => {
    if (!imagenPrompt.trim()) return;
    setImagenGenerating(true);
    setImagenError('');
    try {
      const aspectRatio = isReels ? '9:16' : '1:1';
      const dataUrl = await generateImageFromPrompt(imagenPrompt, aspectRatio);
      setImageDataUrls(prev => [...prev, dataUrl]);
    } catch {
      setImagenError('Erro ao gerar imagem. Verifique sua conexão e tente novamente.');
    } finally {
      setImagenGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const url = ev.target?.result as string;
        setImageDataUrls(prev => [...prev, url]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async (status: 'draft' | 'scheduled' | 'published') => {
    const title = editedTitle || topic;
    if (!title) { setSaveError('Título ou tema é obrigatório.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const uploadedUrls: string[] = [];
      for (const dataUrl of imageDataUrls) {
        if (dataUrl.startsWith('data:')) {
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], `imagen-${Date.now()}.png`, { type: 'image/png' });
          const url = await imageService.uploadImage(file);
          uploadedUrls.push(url);
        } else {
          uploadedUrls.push(dataUrl);
        }
      }

      const post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = {
        title,
        channel,
        format: isInstagram ? instagramFormat : undefined,
        status,
        date: status === 'scheduled' ? new Date(scheduledDate) : new Date(),
        content: editedContent || title,
        engagement: 0,
        imageUrls: uploadedUrls,
      };

      const result = await postsService.create(post);
      if (!result.success) throw new Error('Falha ao salvar');

      if (isInstagram && status === 'published' && uploadedUrls.length > 0) {
        try {
          await publishToInstagram(uploadedUrls, post.content);
          setPublishSuccess('Post salvo e enviado para o Instagram!');
        } catch {
          setPublishSuccess('Post salvo! Publicação no Instagram falhou — tente na aba Posts.');
        }
      } else {
        setPublishSuccess(
          status === 'draft' ? 'Rascunho salvo com sucesso!' :
          status === 'scheduled' ? 'Post agendado!' :
          'Post publicado!'
        );
      }

      onSaved();
    } catch {
      setSaveError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-black/50">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[92vh] md:max-w-2xl md:rounded-2xl md:shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">✨</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Content Studio</h2>
              <p className="text-xs text-gray-400">Criação de conteúdo em {steps.length} passos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step bar */}
        <div className="flex items-center gap-1 px-4 py-3 border-b bg-gray-50 shrink-0 overflow-x-auto">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <button
                onClick={() => { if (i < stepIndex) setStep(s); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  s === step
                    ? 'bg-purple-600 text-white'
                    : i < stepIndex
                    ? 'bg-purple-100 text-purple-700 cursor-pointer hover:bg-purple-200'
                    : 'text-gray-400 cursor-default'
                }`}
              >
                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px] font-bold shrink-0">
                  {i < stepIndex ? '✓' : i + 1}
                </span>
                {STEP_LABELS[s]}
              </button>
              {i < steps.length - 1 && (
                <div className={`w-4 h-px shrink-0 ${i < stepIndex ? 'bg-purple-300' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── CHANNEL ── */}
          {step === 'channel' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Escolha o canal</h3>
                <p className="text-sm text-gray-500">Onde este conteúdo vai ser publicado?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'Instagram' as ContentChannel, icon: '📱', label: 'Instagram', desc: 'Post · Carrossel · Reels' },
                  { value: 'GMB' as ContentChannel, icon: '📍', label: 'Google Meu Negócio', desc: 'Atualizações locais' },
                  { value: 'Blog' as ContentChannel, icon: '📝', label: 'Blog', desc: 'Artigos SEO' },
                  { value: 'Email' as ContentChannel, icon: '📧', label: 'E-mail', desc: 'Newsletter' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setChannel(opt.value);
                      setFormat(CHANNEL_FORMATS[opt.value][0].value);
                      goNext();
                    }}
                    className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                      channel === opt.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    <span className="text-3xl mb-2">{opt.icon}</span>
                    <span className="font-bold text-sm text-gray-900">{opt.label}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── FORMAT ── */}
          {step === 'format' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Escolha o formato</h3>
                <p className="text-sm text-gray-500">Qual tipo de conteúdo para {channel}?</p>
              </div>
              <div className="space-y-3">
                {CHANNEL_FORMATS[channel].map(fmt => (
                  <button
                    key={fmt.value}
                    onClick={() => { setFormat(fmt.value); goNext(); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      format === fmt.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    <span className="text-3xl">{fmt.icon}</span>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-gray-900 block">{fmt.label}</span>
                      <span className="text-xs text-gray-500">{fmt.desc}</span>
                    </div>
                    {format === fmt.value && <span className="text-purple-600">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── CONTENT ── */}
          {step === 'content' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Criar conteúdo</h3>
                <p className="text-sm text-gray-500">
                  {channel} · {CHANNEL_FORMATS[channel].find(f => f.value === format)?.label}
                </p>
              </div>

              {/* TrendScout */}
              <div className="border border-dashed border-blue-300 rounded-xl overflow-hidden">
                <button
                  onClick={() => setTrendOpen(o => !o)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
                >
                  <span className="text-xl">🕵️</span>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-blue-800">Agente de Tendências</span>
                    <span className="text-xs text-blue-600 ml-2">Buscar temas em alta agora</span>
                  </div>
                  <span className="text-blue-400 text-xs font-medium">{trendOpen ? '▲ Fechar' : '▼ Abrir'}</span>
                </button>

                {trendOpen && (
                  <div className="p-4 bg-white border-t border-blue-100">
                    {trendStatus === 'idle' && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-3">Varredura em tempo real com Gemini + Google Search</p>
                        <button
                          onClick={handleTrendScan}
                          className="bg-blue-600 text-white text-sm px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          Iniciar Varredura
                        </button>
                        <p className="text-xs text-gray-400 mt-2">~15–30 segundos</p>
                      </div>
                    )}
                    {trendStatus === 'scanning' && (
                      <div className="space-y-2 py-2">
                        {SCAN_STEPS.map((s, i) => (
                          <div key={i} className={`flex items-center gap-2 text-xs ${
                            i === trendScanStep ? 'text-blue-700 font-medium' :
                            i < trendScanStep ? 'text-green-600' : 'text-gray-300'
                          }`}>
                            <span>{i < trendScanStep ? '✅' : i === trendScanStep ? '⏳' : '○'}</span>
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {trendStatus === 'error' && (
                      <div className="text-center py-2">
                        <p className="text-xs text-red-600 mb-2">{trendError}</p>
                        <button onClick={handleTrendScan} className="text-xs text-blue-600 font-medium hover:underline">Tentar novamente</button>
                      </div>
                    )}
                    {trendStatus === 'done' && trendResult && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-green-600 font-medium">✅ {trendResult.suggestions.length} sugestões</p>
                          <button onClick={handleTrendScan} className="text-xs text-blue-600 font-medium hover:underline">🔄 Nova varredura</button>
                        </div>
                        {trendResult.suggestions.map((s, i) => (
                          <div key={i} className="border border-gray-100 rounded-lg p-3 hover:border-purple-200 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 mb-0.5 leading-tight">{s.topic}</p>
                                <p className="text-[11px] text-gray-400">{s.trendSource} · {s.format}</p>
                              </div>
                              <button
                                onClick={() => handleUseTrendTopic(s)}
                                className="text-xs bg-purple-600 text-white px-2 py-1 rounded font-medium hover:bg-purple-700 shrink-0"
                              >
                                Usar →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tema do conteúdo *</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="Ex: Como identificar sinais de ansiedade no trabalho"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tom</label>
                <div className="grid grid-cols-2 gap-2">
                  {TONES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                        tone === t.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                          : 'border-gray-200 text-gray-600 hover:border-purple-300'
                      }`}
                    >
                      <span>{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI button */}
              <div>
                <button
                  onClick={handleGenerateContent}
                  disabled={!topic.trim() || aiGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white px-5 py-3 rounded-xl font-semibold disabled:opacity-50 hover:from-purple-600 hover:to-purple-800 transition-all shadow-md"
                >
                  {aiGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gerando com IA...
                    </>
                  ) : (
                    <><span>🤖</span> Gerar com IA</>
                  )}
                </button>
                {aiError && <p className="text-xs text-red-500 mt-1.5 text-center">{aiError}</p>}
              </div>

              {/* Content editor */}
              {(generatedContent || editedContent || editedTitle) ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Título</label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={e => setEditedTitle(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Conteúdo</label>
                    <textarea
                      value={editedContent}
                      onChange={e => setEditedContent(e.target.value)}
                      rows={8}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                    />
                    {generatedContent?.hashtags && generatedContent.hashtags.length > 0 && (
                      <p className="text-xs text-purple-600 mt-1.5 leading-relaxed">
                        {generatedContent.hashtags.map(h => `#${h}`).join(' ')}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">ou escreva manualmente</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={e => setEditedTitle(e.target.value)}
                      placeholder="Título do conteúdo"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    <textarea
                      value={editedContent}
                      onChange={e => setEditedContent(e.target.value)}
                      placeholder="Escreva o conteúdo aqui..."
                      rows={6}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MEDIA (Instagram only) ── */}
          {step === 'media' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Mídia</h3>
                <p className="text-sm text-gray-500">Gere uma imagem com IA ou faça upload</p>
              </div>

              {imageDataUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {imageDataUrls.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setImageDataUrls(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Imagen 3 */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎨</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Gerar com Imagen 3</p>
                    <p className="text-xs text-gray-500">Google AI · requer faturamento ativo</p>
                  </div>
                  <button
                    onClick={handleSuggestPrompt}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium border border-purple-200 rounded-lg px-2.5 py-1 transition-colors"
                  >
                    ✨ Sugerir prompt
                  </button>
                </div>
                <textarea
                  value={imagenPrompt}
                  onChange={e => setImagenPrompt(e.target.value)}
                  placeholder="Descreva a imagem em inglês (ex: calming psychology office, soft purple tones, minimalist, no text)..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
                <button
                  onClick={handleGenerateImage}
                  disabled={!imagenPrompt.trim() || imagenGenerating}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  {imagenGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gerando imagem...
                    </>
                  ) : '🎨 Gerar Imagem'}
                </button>
                {imagenError && <p className="text-xs text-red-500 leading-tight">{imagenError}</p>}
              </div>

              {/* Upload */}
              <div className="border border-dashed border-gray-300 rounded-xl p-5 text-center">
                <span className="text-2xl block mb-2">📤</span>
                <p className="text-sm font-medium text-gray-700 mb-1">Upload manual</p>
                <p className="text-xs text-gray-400 mb-3">JPG, PNG · máx 10MB · {isReels ? '9:16 para Reels' : '1080×1080px recomendado'}</p>
                <label className="cursor-pointer inline-block">
                  <span className="bg-gray-100 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                    Escolher arquivo
                  </span>
                  <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {isReels && (
                <p className="text-xs text-gray-400 text-center">
                  Para Reels, a URL do vídeo pode ser adicionada depois na aba Posts.
                </p>
              )}
            </div>
          )}

          {/* ── PREVIEW ── */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Preview</h3>
                <p className="text-sm text-gray-500">Como vai aparecer para o público</p>
              </div>

              {!editedContent && !editedTitle && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  ⚠️ Nenhum conteúdo ainda. Volte para Conteúdo e escreva ou gere com IA.
                </div>
              )}

              {isInstagram ? (
                <InstagramPreview
                  username="fernandamangiaoficial"
                  displayName="Fernanda Mangia"
                  caption={editedContent || topic}
                  imageUrls={imageDataUrls}
                  format={isReels ? 'reel' : 'post'}
                  publishDate={new Date(scheduledDate)}
                />
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 ${
                    channel === 'GMB' ? 'bg-blue-50 text-blue-700' :
                    channel === 'Blog' ? 'bg-green-50 text-green-700' :
                    'bg-orange-50 text-orange-700'
                  }`}>
                    <span>{channel === 'GMB' ? '📍' : channel === 'Blog' ? '📝' : '📧'}</span>
                    {channel === 'GMB' ? 'Google Meu Negócio' : channel === 'Blog' ? 'Blog' : 'E-mail'}
                  </div>
                  <div className="p-5">
                    {editedTitle && (
                      <h4 className="text-base font-bold text-gray-900 mb-3">{editedTitle}</h4>
                    )}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{editedContent || topic}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PUBLISH ── */}
          {step === 'publish' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Publicar</h3>
                <p className="text-sm text-gray-500">Como deseja salvar este conteúdo?</p>
              </div>

              {publishSuccess ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">✅</div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{publishSuccess}</h4>
                  <button
                    onClick={onClose}
                    className="mt-4 bg-purple-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Canal</span>
                      <span className="font-medium text-gray-900">{channel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Formato</span>
                      <span className="font-medium text-gray-900">
                        {CHANNEL_FORMATS[channel].find(f => f.value === format)?.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Título</span>
                      <span className="font-medium text-gray-900 truncate max-w-[180px]">
                        {editedTitle || topic || '—'}
                      </span>
                    </div>
                    {imageDataUrls.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Imagens</span>
                        <span className="font-medium text-gray-900">{imageDataUrls.length}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Data / Horário (para agendamento)
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>

                  {saveError && <p className="text-sm text-red-500 text-center">{saveError}</p>}

                  <div className="space-y-3">
                    <button
                      onClick={() => handleSave('published')}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
                    >
                      {saving
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : '🚀'
                      }
                      Publicar Agora
                    </button>
                    <button
                      onClick={() => handleSave('scheduled')}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                    >
                      📅 Agendar para{' '}
                      {new Date(scheduledDate).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </button>
                    <button
                      onClick={() => handleSave('draft')}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-gray-200 transition-all"
                    >
                      ✏️ Salvar como Rascunho
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        {step !== 'channel' && !(step === 'publish' && publishSuccess) && (
          <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50 shrink-0">
            <button
              onClick={goPrev}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ← Voltar
            </button>
            {step !== 'publish' && (
              <button
                onClick={goNext}
                disabled={step === 'content' && !editedContent && !editedTitle && !topic.trim()}
                className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 transition-colors"
              >
                {step === 'preview' ? 'Publicar →' : 'Próximo →'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentStudio;
