import React, { useState } from 'react';
import { runTrendScout, TrendSuggestion, TrendScoutResult } from '../services/trendScoutService';

interface TrendScoutModalProps {
  onClose: () => void;
  onUseTopic: (topic: string, format: TrendSuggestion['format']) => void;
}

const FORMAT_ICONS: Record<TrendSuggestion['format'], string> = {
  post: '🖼️',
  carrossel: '🎠',
  reels: '🎬',
};

const FORMAT_LABELS: Record<TrendSuggestion['format'], string> = {
  post: 'Post',
  carrossel: 'Carrossel',
  reels: 'Reels',
};

const SCAN_STEPS = [
  'Buscando temas em alta no Google Trends BR...',
  'Analisando perfis de psicologia no Instagram...',
  'Verificando vídeos virais no YouTube...',
  'Rastreando notícias e campanhas de saúde mental...',
  'Sintetizando sugestões personalizadas...',
];

const TrendScoutModal: React.FC<TrendScoutModalProps> = ({ onClose, onUseTopic }) => {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<TrendScoutResult | null>(null);
  const [error, setError] = useState('');
  const [scanStep, setScanStep] = useState(0);

  const handleScan = async () => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setError('Chave da API Gemini não configurada. Adicione VITE_GEMINI_API_KEY no Vercel.');
      setStatus('error');
      return;
    }
    setStatus('scanning');
    setScanStep(0);
    setError('');

    const stepInterval = setInterval(() => {
      setScanStep(prev => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);

    try {
      const data = await runTrendScout();
      clearInterval(stepInterval);
      setResult(data);
      setStatus('done');
    } catch (err) {
      clearInterval(stepInterval);
      setError('Erro ao executar varredura. Tente novamente.');
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">🔍</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Agente de Tendências</h2>
              <p className="text-sm text-gray-500">Varredura em tempo real · Powered by Gemini + Google</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">

          {/* Idle */}
          {status === 'idle' && (
            <div className="flex flex-col items-center text-center gap-6 py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-4xl">
                🕵️
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">O que o agente vai fazer</h3>
                <div className="text-left space-y-3 max-w-md mx-auto">
                  {[
                    { icon: '📈', text: 'Pesquisar temas de psicologia em alta no Google Trends Brasil agora' },
                    { icon: '📱', text: 'Analisar o que os maiores perfis de psicologia do Instagram estão postando' },
                    { icon: '▶️', text: 'Verificar vídeos virais de psicologia no YouTube nos últimos 7 dias' },
                    { icon: '🧠', text: 'Sugerir temas com ângulo neuropsicológico exclusivo da Fernanda' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-xl shrink-0">{item.icon}</span>
                      <p className="text-sm text-gray-600">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={handleScan}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <span>🔍</span>
                Iniciar Varredura
              </button>
              <p className="text-xs text-gray-400">Leva cerca de 15–30 segundos</p>
            </div>
          )}

          {/* Scanning */}
          {status === 'scanning' && (
            <div className="flex flex-col items-center justify-center py-12 gap-8">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🔍</div>
              </div>
              <div className="text-center space-y-3 w-full max-w-sm">
                {SCAN_STEPS.map((step, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                      i === scanStep
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : i < scanStep
                        ? 'text-green-600'
                        : 'text-gray-300'
                    }`}
                  >
                    <span className="text-sm shrink-0">
                      {i < scanStep ? '✅' : i === scanStep ? '⏳' : '○'}
                    </span>
                    <span className="text-sm text-left">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="text-4xl">⚠️</div>
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={handleScan}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Results */}
          {status === 'done' && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  <span>✅</span>
                  <span className="text-sm font-medium">
                    {result.suggestions.length} sugestões encontradas · {result.scannedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  onClick={handleScan}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  🔄 Nova varredura
                </button>
              </div>

              <div className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-xl p-4 hover:border-purple-300 hover:bg-purple-50/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {s.trendSource}
                          </span>
                          <span className="text-xs font-medium text-gray-500">
                            {FORMAT_ICONS[s.format]} {FORMAT_LABELS[s.format]}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{s.topic}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed mb-1">
                          <span className="font-semibold text-gray-600">Por que agora: </span>{s.rationale}
                        </p>
                        <p className="text-xs text-purple-700 leading-relaxed">
                          <span className="font-semibold">Seu ângulo: </span>{s.angle}
                        </p>
                      </div>
                      <button
                        onClick={() => onUseTopic(s.topic, s.format)}
                        className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-all whitespace-nowrap"
                      >
                        Usar tema →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendScoutModal;
