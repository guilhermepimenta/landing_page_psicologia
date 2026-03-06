import React, { useState } from 'react';
import { generateContent, ContentChannel, ContentTone, GeneratedContent } from '../services/aiContentService';
import { postsService } from '../services/firebaseService';

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

const CHANNELS: { value: ContentChannel; label: string; icon: string }[] = [
  { value: 'Instagram', label: 'Instagram', icon: '📱' },
  { value: 'GMB', label: 'Google Meu Negócio', icon: '📍' },
  { value: 'Blog', label: 'Blog', icon: '📝' },
  { value: 'Email', label: 'E-mail / Newsletter', icon: '📧' },
];

const TONES: { value: ContentTone; label: string; icon: string }[] = [
  { value: 'informativo', label: 'Informativo', icon: '📊' },
  { value: 'empático', label: 'Empático', icon: '💚' },
  { value: 'educativo', label: 'Educativo', icon: '📚' },
  { value: 'motivacional', label: 'Motivacional', icon: '🚀' },
];

const AIContentModal: React.FC<AIContentModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [channel, setChannel] = useState<ContentChannel>('Instagram');
  const [tone, setTone] = useState<ContentTone>('informativo');
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const finalTopic = topic === 'custom' ? customTopic : topic;

  const handleGenerate = async () => {
    if (!finalTopic.trim()) {
      setError('Por favor, selecione ou escreva um tema.');
      return;
    }
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setError('Chave da API Gemini não configurada. Adicione VITE_GEMINI_API_KEY no arquivo .env');
      return;
    }
    setError('');
    setStep('loading');
    try {
      const generated = await generateContent(finalTopic, channel, tone);
      setResult(generated);
      setStep('result');
    } catch (err) {
      setError('Erro ao gerar conteúdo. Verifique sua chave API e tente novamente.');
      setStep('form');
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
      status: 'draft',
      date: new Date(),
      content: result.content,
    });
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">✨</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gerar Conteúdo com IA</h2>
              <p className="text-sm text-gray-500">Powered by Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Step: Form */}
          {step === 'form' && (
            <div className="space-y-6">
              {/* Canal */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Canal de publicação</label>
                <div className="grid grid-cols-2 gap-3">
                  {CHANNELS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setChannel(c.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        channel === c.value
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className="text-xl">{c.icon}</span>
                      <span className="font-medium text-sm">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

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
                <p className="text-sm text-gray-500 mt-1">A IA está criando um post personalizado para você</p>
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

              {/* Título */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Título / Assunto</p>
                <p className="font-semibold text-gray-900">{result.title}</p>
              </div>

              {/* Conteúdo */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Conteúdo</p>
                <p className="text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{result.content}</p>
              </div>

              {/* Hashtags */}
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

              {/* Actions */}
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
                onClick={() => { setStep('form'); setResult(null); setSaved(false); }}
                className="w-full text-purple-600 hover:text-purple-700 text-sm font-medium py-2"
              >
                ← Gerar outro conteúdo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIContentModal;
