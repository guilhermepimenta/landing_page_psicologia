import React, { useState, useEffect } from 'react';
import { ContentChannel, InstagramFormat, ContentTone, GeneratedContent } from '../services/aiContentService';
import { generateWithContext, validateContent, ContentQuality, getTopEngagingTopics, EngagingTopic } from '../services/contentContextService';
import { runTrendScout, TrendSuggestion, TrendScoutResult } from '../services/trendScoutService';
import { generateImageFromPrompt, suggestImagePrompt } from '../services/imagenService';
import { postsService, Post } from '../services/firebaseService';
import { imageService } from '../services/imageService';
import { publishToInstagram } from '../services/instagramService';
import { publishToFacebook } from '../services/facebookService';
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
  Facebook: [
    { value: 'post', label: 'Post com Imagem', icon: '🖼️', desc: 'Texto + foto na Página' },
    { value: 'atualizacao', label: 'Só Texto', icon: '📝', desc: 'Atualização de texto' },
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

// Templates Canva da Fernanda — abre direto na conta dela
const CANVA_TEMPLATES: Partial<Record<string, { label: string; url: string }>> = {
  'Instagram:post':        { label: 'Post Instagram',      url: 'https://www.canva.com/design/DAHH_8w7QrE/edit' },
  'Instagram:carrossel':   { label: 'Post Instagram',      url: 'https://www.canva.com/design/DAHH_8w7QrE/edit' },
  'Instagram:reels':       { label: 'Story / Reels',       url: 'https://www.canva.com/design/DAHH_zvi1Mw/edit' },
  'Facebook:post':         { label: 'Post Facebook',       url: 'https://www.canva.com/design/DAHH_w8OY3U/edit' },
  'Facebook:atualizacao':  { label: 'Post Facebook',       url: 'https://www.canva.com/design/DAHH_w8OY3U/edit' },
  'Email:newsletter':      { label: 'Template E-mail',     url: 'https://www.canva.com/design/DAHH_xiXqdE/edit' },
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

  const [contentQuality, setContentQuality] = useState<ContentQuality | null>(null);
  const [engagingTopics, setEngagingTopics] = useState<EngagingTopic[]>([]);
  const [engagingLoading, setEngagingLoading] = useState(false);

  // Carrega os temas mais engajados quando o canal muda (step de conteúdo)
  useEffect(() => {
    if (step !== 'content') return;
    setEngagingLoading(true);
    getTopEngagingTopics(channel)
      .then(setEngagingTopics)
      .catch(() => setEngagingTopics([]))
      .finally(() => setEngagingLoading(false));
  }, [channel, step]);

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const [scheduledDate, setScheduledDate] = useState((initialDate ?? new Date()).toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [publishSuccess, setPublishSuccess] = useState('');
  const [canvaOpened, setCanvaOpened] = useState(false);
  const [canvaDropActive, setCanvaDropActive] = useState(false);
  const [canvaImageAdded, setCanvaImageAdded] = useState(false);
  const canvaInputRef = React.useRef<HTMLInputElement>(null);

  const isInstagram = channel === 'Instagram';
  const isFacebook  = channel === 'Facebook';
  const isReels = format === 'reels';
  const instagramFormat = (format === 'post' || format === 'carrossel' || format === 'reels')
    ? format as InstagramFormat
    : 'post';

  const steps: Step[] = (isInstagram || isFacebook)
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
    setContentQuality(null);
    try {
      const result = await generateWithContext(
        topic,
        channel,
        tone,
        isInstagram ? instagramFormat : undefined,
      );
      setGeneratedContent(result);
      setEditedContent(result.content);
      setEditedTitle(result.title);
      setContentQuality(result.quality);
    } catch {
      setAiError('Erro ao gerar conteúdo. Verifique a chave da API Gemini.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleContentChange = (newContent: string) => {
    setEditedContent(newContent);
    if (generatedContent) {
      const quality = validateContent(
        newContent,
        generatedContent.hashtags,
        channel,
        isInstagram ? instagramFormat : undefined,
      );
      setContentQuality(quality);
    }
  };

  const handleSuggestPrompt = async () => {
    try {
      const suggested = await suggestImagePrompt(topic || 'psicologia mental health', format, channel);
      setImagenPrompt(suggested);
    } catch (err: any) {
      if (typeof err?.message === 'string' && err.message.includes('Limite de uso da API Gemini')) {
        setImagenError(err.message);
        setImagenPrompt('');
      } else {
        setImagenPrompt('Calming psychology office, soft purple tones, minimalist, abstract, no text, no faces');
      }
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

      const willPublishToApi =
        (isInstagram && status === 'published' && uploadedUrls.length > 0) ||
        (isFacebook  && status === 'published');

      // Salva no Firebase com status 'draft' se vai tentar publicar na API.
      // Só atualiza para 'published' depois que a API confirmar sucesso.
      const post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = {
        title,
        channel,
        format: isInstagram ? instagramFormat : undefined,
        status: willPublishToApi ? 'draft' : status,
        date: status === 'scheduled' ? new Date(scheduledDate) : new Date(),
        content: editedContent || title,
        engagement: 0,
        imageUrls: uploadedUrls,
      };

      const result = await postsService.create(post);
      if (!result.success || !result.id) throw new Error('Falha ao salvar');

      if (isInstagram && status === 'published' && uploadedUrls.length > 0) {
        try {
          const igResult = await publishToInstagram(uploadedUrls, post.content);
          await postsService.update(result.id, {
            status: 'published',
            instagramPostId: igResult.instagramPostId,
            instagramPermalink: igResult.instagramPermalink,
          });
          setPublishSuccess('Post publicado no Instagram com sucesso!');
        } catch (e: any) {
          setSaveError(`Post salvo como rascunho. Erro ao publicar no Instagram: ${e?.message ?? 'verifique o token de acesso.'}`);
        }
      } else if (isFacebook && status === 'published') {
        try {
          await publishToFacebook(post.content, uploadedUrls[0]);
          await postsService.update(result.id, { status: 'published' });
          setPublishSuccess('Post publicado no Facebook com sucesso!');
        } catch (e: any) {
          setSaveError(`Post salvo como rascunho. Erro ao publicar no Facebook: ${e?.message ?? 'verifique o token de acesso.'}`);
        }
      } else {
        setPublishSuccess(
          status === 'draft'     ? 'Rascunho salvo com sucesso!' :
          status === 'scheduled' ? 'Post agendado!'              :
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
                  { value: 'Facebook' as ContentChannel, icon: '📘', label: 'Facebook', desc: 'Post · Texto' },
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

              {/* Sugestões rápidas baseadas em engajamento */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                  <span>🔥</span> Temas que mais engajaram neste canal
                </p>
                {engagingLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-7 w-28 rounded-full bg-gray-100 animate-pulse" />
                    ))}
                  </div>
                ) : engagingTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {engagingTopics.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => setTopic(t.title)}
                        title={`${t.engagement} engajamentos${t.format ? ` · ${t.format}` : ''}`}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all text-left max-w-[200px] truncate ${
                          topic === t.title
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    Sem dados ainda — sugestões aparecem após publicar posts com engajamento.
                  </p>
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-gray-700">Conteúdo</label>
                      <span className="text-xs text-gray-400">{editedContent.length} chars</span>
                    </div>
                    <textarea
                      value={editedContent}
                      onChange={e => handleContentChange(e.target.value)}
                      rows={8}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                    />
                    {generatedContent?.hashtags && generatedContent.hashtags.length > 0 && (
                      <p className="text-xs text-purple-600 mt-1.5 leading-relaxed">
                        {generatedContent.hashtags.map(h => `#${h}`).join(' ')}
                      </p>
                    )}
                  </div>

                  {/* Quality score widget */}
                  {contentQuality && (
                    <div className={`rounded-xl border p-3 space-y-2 ${
                      contentQuality.passed ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-700">Score de qualidade</span>
                        <span className={`text-sm font-bold ${
                          contentQuality.score >= 80 ? 'text-green-600' :
                          contentQuality.score >= 60 ? 'text-amber-600' : 'text-red-500'
                        }`}>
                          {contentQuality.score}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            contentQuality.score >= 80 ? 'bg-green-500' :
                            contentQuality.score >= 60 ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${contentQuality.score}%` }}
                        />
                      </div>
                      <div className="space-y-1">
                        {contentQuality.checks.map((check, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-xs">
                            <span className={check.ok ? 'text-green-500' : 'text-amber-500'}>
                              {check.ok ? '✓' : '⚠'}
                            </span>
                            <span className={check.ok ? 'text-gray-600' : 'text-amber-700'}>
                              {check.label}{check.hint ? ` — ${check.hint}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                    <div className="relative">
                      <textarea
                        value={editedContent}
                        onChange={e => handleContentChange(e.target.value)}
                        placeholder="Escreva o conteúdo aqui..."
                        rows={6}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                      />
                      <span className="absolute bottom-2 right-3 text-[10px] text-gray-400">
                        {editedContent.length} chars
                      </span>
                    </div>
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
                    <p className="text-sm font-semibold text-gray-900">Gerar com IA</p>
                    <p className="text-xs text-gray-500">Flux · gratuito · até 30s</p>
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

              {/* ── Canva shortcut ── */}
              {!publishSuccess && (() => {
                const key = `${channel}:${format}`;
                const tpl = CANVA_TEMPLATES[key];
                if (!tpl) return null;

                const handleCanvaUploadFile = (file: File) => {
                  if (!file.type.startsWith('image/')) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const url = ev.target?.result as string;
                    setImageDataUrls(prev => [...prev, url]);
                    setCanvaImageAdded(true);
                  };
                  reader.readAsDataURL(file);
                };

                return (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                      🎨 Criar arte no Canva
                    </p>

                    {!canvaOpened ? (
                      <>
                        <p className="text-xs text-gray-500">
                          Clique para copiar o texto e abrir o template <strong>{tpl.label}</strong> na sua conta.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(editedContent || editedTitle || topic).catch(() => {});
                            window.open(tpl.url, '_blank', 'noopener,noreferrer');
                            setCanvaOpened(true);
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-white border border-purple-300 text-purple-700 hover:bg-purple-50 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#7C3AED" opacity="0.2"/><path d="M8.5 14.5L12 8l3.5 6.5H8.5z" fill="#7C3AED"/></svg>
                          Abrir template · {tpl.label}
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-green-600 font-semibold">
                          ✅ Canva aberto · {tpl.label} — texto copiado
                        </p>
                        <p className="text-xs text-gray-500">
                          Após baixar a arte no Canva, arraste o arquivo aqui:
                        </p>

                        {/* Drop zone */}
                        <div
                          onDragOver={(e) => { e.preventDefault(); setCanvaDropActive(true); }}
                          onDragLeave={() => setCanvaDropActive(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setCanvaDropActive(false);
                            const file = e.dataTransfer.files[0];
                            if (file) handleCanvaUploadFile(file);
                          }}
                          onClick={() => canvaInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                            canvaDropActive
                              ? 'border-purple-500 bg-purple-100'
                              : canvaImageAdded
                                ? 'border-green-400 bg-green-50'
                                : 'border-purple-300 bg-white hover:bg-purple-50'
                          }`}
                        >
                          {canvaImageAdded ? (
                            <div className="space-y-1">
                              <p className="text-green-600 font-semibold text-sm">✓ Arte adicionada à publicação!</p>
                              <p className="text-xs text-gray-400">Clique para trocar</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-2xl">⬇️</p>
                              <p className="text-sm font-medium text-purple-700">Arraste a arte aqui</p>
                              <p className="text-xs text-gray-400">ou clique para selecionar o arquivo</p>
                            </div>
                          )}
                        </div>

                        <input
                          ref={canvaInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCanvaUploadFile(file);
                          }}
                        />
                      </>
                    )}
                  </div>
                );
              })()}

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
