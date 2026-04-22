import React, { useState } from 'react';
import { generateContent, ContentChannel, InstagramFormat, ContentTone, GeneratedContent } from '../services/aiContentService';
import { postsService } from '../services/firebaseService';
import TrendScoutModal from './TrendScoutModal';
import { TrendSuggestion } from '../services/trendScoutService';

interface AIContentModalProps {
  onClose: () => void;
}

const TOPICS = [
  'TDAH em adultos: sinais e estratégias',
  'O que é avaliação neuropsicológica?',
  'Diferença entre ansiedade e transtorno de ansiedade',
  'Dificuldades de aprendizagem em crianças',
  'Saúde mental no ambiente de trabalho',
  'Como a memória funciona e como melhorá-la',
  'Burnout: como identificar e buscar ajuda',
  'Mitos sobre psicoterapia',
  'A importância do diagnóstico precoce',
  'Setembro Amarelo: prevenção ao suicídio',
];

const CHANNELS: { value: ContentChannel; label: string; icon: string; description: string }[] = [
  { value: 'Instagram', label: 'Instagram', icon: '📱', description: 'Post, carrossel ou reels' },
  { value: 'GMB', label: 'Google Meu Negócio', icon: '📍', description: 'Publicação local no Maps' },
  { value: 'Blog', label: 'Blog', icon: '📝', description: 'Artigo SEO completo' },
  { value: 'Email', label: 'E-mail / Newsletter', icon: '📧', description: 'Newsletter para pacientes' },
];

const INSTAGRAM_FORMATS: { value: InstagramFormat; label: string; icon: string; description: string }[] = [
  { value: 'post', label: 'Post', icon: '🖼️', description: 'Imagem única com legenda' },
  { value: 'carrossel', label: 'Carrossel', icon: '🎠', description: 'Roteiro slide a slide' },
  { value: 'reels', label: 'Reels', icon: '🎬', description: 'Roteiro de vídeo curto' },
];

const TONES: { value: ContentTone; label: string; icon: string }[] = [
  { value: 'informativo', label: 'Informativo', icon: '📊' },
  { value: 'empático', label: 'Empático', icon: '💚' },
  { value: 'educativo', label: 'Educativo', icon: '📚' },
  { value: 'motivacional', label: 'Motivacional', icon: '🚀' },
];

type ModalStep = 'channel' | 'options' | 'loading' | 'result';

const AIContentModal: React.FC<AIContentModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<ModalStep>('channel');
  const [channel, setChannel] = useState<ContentChannel | null>(null);
  const [instagramFormat, setInstagramFormat] = useState<InstagramFormat>('post');
  const [tone, setTone] = useState<ContentTone>('informativo');
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showScout, setShowScout] = useState(false);

  const handleUseTrendTopic = (trendTopic: string, format: TrendSuggestion['format']) => {
    setShowScout(false);
    setChannel('Instagram');
    setInstagramFormat(format);
    setTopic('custom');
    setCustomTopic(trendTopic);
    setStep('options');
  };

  const finalTopic = topic === 'custom' ? customTopic : topic;

  const handleSelectChannel = (c: ContentChannel) => {
    setChannel(c);
    setStep('options');
  };

  const handleBack = () => {
    if (step === 'options') { setStep('channel'); setChannel(null); }
    if (step === 'result') { setStep('options'); setResult(null); setSaved(false); }
  };

  const handleGenerate = async () => {
    if (!finalTopic.trim()) { setError('Por favor, selecione ou escreva um tema.'); return; }
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setError('Chave da API Gemini não configurada. Adicione VITE_GEMINI_API_KEY no Vercel.');
      return;
    }
    setError('');
    setStep('loading');
    try {
      const generated = await generateContent(
        finalTopic,
        channel!,
        tone,
        channel === 'Instagram' ? instagramFormat : undefined
      );
      setResult(generated);
      setStep('result');
    } catch {
      setError('Erro ao gerar conteúdo. Verifique sua chave API e tente novamente.');
      setStep('options');
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `${result.title}\n\n${result.content}${result.hashtags.length ? '\n\n' + result.hashtags.map(h => `#${h}`).join(' ') : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDraft = async () => {
    if (!result) return;
    setSaving(true);
    await postsService.create({
      title: result.title,
      channel: result.channel,
      format: result.format ?? 'post',
      status: 'draft',
      date: new Date(),
      content: result.content,
    });
    setSaving(false);
    setSaved(true);
  };

  const channelLabel = CHANNELS.find(c => c.value === channel);
  const formatLabel = INSTAGRAM_FORMATS.find(f => f.value === instagramFormat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div className="flex items-center gap-3">
            {step !== 'channel' && step !== 'loading' && (
              <button
                onClick={handleBack}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors mr-1"
                aria-label="Voltar"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-2xl shrink-0">✨</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gerar Conteúdo com IA</h2>
              <p className="text-sm text-gray-500">
                {step === 'channel' && 'Escolha o canal de publicação'}
                {step === 'options' && `${channelLabel?.icon} ${channelLabel?.label}${channel === 'Instagram' ? ` · ${formatLabel?.label}` : ''}`}
                {step === 'loading' && 'Gerando...'}
                {step === 'result' && 'Conteúdo gerado'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">

          {/* Step: Channel */}
          {step === 'channel' && (
            <div className="space-y-4">
              {/* Trend Scout CTA */}
              <button
                onClick={() => setShowScout(true)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 transition-all text-left group"
              >
                <span className="text-3xl">🕵️</span>
                <div className="flex-1">
                  <p className="font-bold text-blue-700 group-hover:text-blue-800">Agente de Tendências</p>
                  <p className="text-xs text-blue-500 mt-0.5">Vasculha a web e sugere temas em alta agora no Instagram</p>
                </div>
                <span className="text-blue-400 text-sm font-bold shrink-0">Novo ✨</span>
              </button>

              <div className="flex items-center gap-3 text-xs text-gray-400">
                <div className="flex-1 h-px bg-gray-200" />
                <span>ou escolha o canal manualmente</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CHANNELS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => handleSelectChannel(c.value)}
                    className="flex items-center gap-4 p-5 rounded-xl border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-left group"
                  >
                    <span className="text-3xl">{c.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-800 group-hover:text-purple-700">{c.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Options */}
          {step === 'options' && (
            <div className="space-y-6">

              {/* Instagram: formato */}
              {channel === 'Instagram' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Formato</label>
                  <div className="grid grid-cols-3 gap-3">
                    {INSTAGRAM_FORMATS.map(f => (
                      <button
                        key={f.value}
                        onClick={() => setInstagramFormat(f.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          instagramFormat === f.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="text-2xl">{f.icon}</span>
                        <span className="font-semibold text-sm">{f.label}</span>
                        <span className="text-xs text-gray-500 text-center leading-tight">{f.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tom */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tom do conteúdo</label>
                <div className="grid grid-cols-2 gap-3">
                  {TONES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        tone === t.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <span className="font-medium text-sm">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tema */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Tema do conteúdo</label>
                <div className="space-y-2 mb-3">
                  {TOPICS.map(t => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border transition-all text-sm ${
                        topic === t
                          ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  <button
                    onClick={() => setTopic('custom')}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border transition-all text-sm ${
                      topic === 'custom'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    ✏️ Digitar tema personalizado...
                  </button>
                </div>
                {topic === 'custom' && (
                  <input
                    type="text"
                    value={customTopic}
                    onChange={e => setCustomTopic(e.target.value)}
                    placeholder="Ex: Conexão entre sono e saúde mental"
                    className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
                    autoFocus
                  />
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!finalTopic.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>✨</span>
                Gerar Conteúdo
              </button>
            </div>
          )}

          {/* Step: Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">Gerando conteúdo...</p>
                <p className="text-sm text-gray-500 mt-1">A IA está criando um conteúdo personalizado para você</p>
              </div>
            </div>
          )}

          {/* Step: Result */}
          {step === 'result' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                <span>✅</span>
                <span className="text-sm font-medium">Conteúdo gerado com sucesso!</span>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Título / Assunto</p>
                <p className="font-semibold text-gray-900">{result.title}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Conteúdo</p>
                <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{result.content}</p>
              </div>

              {result.hashtags.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Hashtags</p>
                  <div className="flex flex-wrap gap-2">
                    {result.hashtags.map(tag => (
                      <span key={tag} className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 border-2 border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {copied ? '✅ Copiado!' : '📋 Copiar tudo'}
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving || saved}
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                >
                  {saving ? 'Salvando...' : saved ? '✅ Salvo!' : '💾 Salvar rascunho'}
                </button>
              </div>

              <button
                onClick={() => { setStep('options'); setResult(null); setSaved(false); }}
                className="w-full text-purple-600 hover:text-purple-700 text-sm font-medium py-2"
              >
                ← Gerar outro conteúdo
              </button>
            </div>
          )}
        </div>
      </div>

      {showScout && (
        <TrendScoutModal
          onClose={() => setShowScout(false)}
          onUseTopic={handleUseTrendTopic}
        />
      )}
    </div>
  );
};

export default AIContentModal;
