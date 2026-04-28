import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, AlertCircle, Mail, User, Loader2 } from 'lucide-react';
import { sendGAEvent, trackWhatsAppClick } from '../utils/analytics';
import { useWhatsAppUrl } from '../utils/useWhatsAppUrl';
import { leadsService } from '../services/firebaseService';

type ScaleType = 'frequency' | 'agreement' | 'frequency5';

interface Question {
  text: string;
  reverseScore?: boolean;
}

interface Test {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  source: string;
  scaleType: ScaleType;
  questions: Question[];
  cutoffs: { low: number; moderate: number };
  results: {
    low: { label: string; message: string };
    moderate: { label: string; message: string };
    high: { label: string; message: string };
  };
  waLabel: string;
  waMessages: { low: string; moderate: string; high: string };
}

const TESTS: Record<string, Test> = {
  tdah: {
    id: 'tdah',
    title: 'Rastreio de TDAH',
    subtitle: 'Adult ADHD Self-Report Scale (ASRS-v1.1) — Parte A',
    duration: '3 min',
    source: 'Kessler et al. (2005) · WHO',
    scaleType: 'frequency5',
    questions: [
      { text: 'Com que frequência você tem dificuldade em finalizar os detalhes de um projeto, depois que a parte desafiadora já foi concluída?' },
      { text: 'Com que frequência você tem dificuldade em colocar as coisas em ordem quando precisa fazer uma tarefa que exige organização?' },
      { text: 'Com que frequência você tem dificuldade em lembrar compromissos ou obrigações?' },
      { text: 'Quando você precisa fazer uma tarefa que exige muita concentração, com que frequência você evita ou adia o início?' },
      { text: 'Com que frequência você mexe ou remexe nas mãos ou nos pés quando precisa ficar sentado por muito tempo?' },
      { text: 'Com que frequência você se sente excessivamente ativo e compelido a fazer coisas, como se estivesse "a todo vapor"?' },
    ],
    cutoffs: { low: 3, moderate: 6 },
    results: {
      low:      { label: 'Pontuação baixa',    message: 'Sua pontuação não indica sinais fortes de TDAH. Ainda assim, se você sente que atenção ou organização impactam sua vida, vale uma conversa com a Fernanda.' },
      moderate: { label: 'Pontuação moderada', message: 'Alguns sinais de TDAH estão presentes. Uma avaliação neuropsicológica pode esclarecer se esses sintomas têm impacto funcional na sua vida.' },
      high:     { label: 'Pontuação elevada',  message: 'Sua pontuação indica sintomas consistentes com TDAH. Uma avaliação neuropsicológica é o próximo passo recomendado para um diagnóstico preciso.' },
    },
    waLabel: 'Site - Triagem TDAH',
    waMessages: {
      low:      'Olá Fernanda, fiz a triagem de TDAH no site (pontuação baixa) e gostaria de conversar sobre atenção e organização.',
      moderate: 'Olá Fernanda, fiz a triagem de TDAH no site (pontuação moderada) e gostaria de saber mais sobre avaliação neuropsicológica.',
      high:     'Olá Fernanda, fiz a triagem de TDAH no site (pontuação elevada) e gostaria de agendar uma avaliação neuropsicológica.',
    },
  },
  tea: {
    id: 'tea',
    title: 'Rastreio de TEA',
    subtitle: 'Autism Spectrum Quotient — AQ-10 (Adultos)',
    duration: '3 min',
    source: 'Baron-Cohen et al. · Autism Research Centre, Cambridge',
    scaleType: 'agreement',
    questions: [
      { text: 'Eu frequentemente percebo pequenos sons quando outros não percebem.' },
      { text: 'Eu costumo me concentrar mais nos detalhes do que no todo.' },
      { text: 'Acho fácil fazer mais de uma coisa ao mesmo tempo.', reverseScore: true },
      { text: 'Se houver uma interrupção, posso voltar ao que estava fazendo rapidamente.', reverseScore: true },
      { text: 'Acho difícil "ler nas entrelinhas" quando alguém está falando comigo.' },
      { text: 'Sei como dizer quando alguém que está me ouvindo está ficando entediado.', reverseScore: true },
      { text: 'Quando leio algo, acho difícil distinguir a ideia do autor da ideia dos outros.' },
      { text: 'Acho difícil imaginar como seria ser outra pessoa.' },
      { text: 'Gosto de juntar informações sobre categorias de coisas (tipos de carro, pássaros, trens, plantas).' },
      { text: 'Acho difícil descobrir as intenções das pessoas.' },
    ],
    cutoffs: { low: 3, moderate: 6 },
    results: {
      low:      { label: 'Pontuação baixa',    message: 'Sua pontuação não indica sinais fortes de TEA. Se você tem dúvidas sobre funcionamento social ou sensorial, a Fernanda pode ajudar a investigar.' },
      moderate: { label: 'Pontuação moderada', message: 'Alguns traços do espectro autista estão presentes. Uma avaliação mais detalhada pode ajudar a entender melhor seu perfil de funcionamento.' },
      high:     { label: 'Pontuação elevada',  message: 'Sua pontuação sugere a presença de traços do espectro. Uma avaliação neuropsicológica é recomendada para investigar com mais precisão.' },
    },
    waLabel: 'Site - Triagem TEA',
    waMessages: {
      low:      'Olá Fernanda, fiz a triagem de TEA no site (pontuação baixa) e gostaria de conversar sobre funcionamento social e sensorial.',
      moderate: 'Olá Fernanda, fiz a triagem de TEA no site (pontuação moderada) e gostaria de saber mais sobre avaliação para o espectro autista.',
      high:     'Olá Fernanda, fiz a triagem de TEA no site (pontuação elevada) e gostaria de agendar uma avaliação neuropsicológica.',
    },
  },
  depressao: {
    id: 'depressao',
    title: 'Rastreio de Depressão',
    subtitle: 'Patient Health Questionnaire (PHQ-9)',
    duration: '3 min',
    source: 'Kroenke, Spitzer & Williams (2001) · Domínio público',
    scaleType: 'frequency',
    questions: [
      { text: 'Pouco interesse ou prazer em fazer as coisas.' },
      { text: 'Sentir-se para baixo, deprimido(a) ou sem esperança.' },
      { text: 'Dificuldade para adormecer ou permanecer dormindo, ou dormir demais.' },
      { text: 'Sentir-se cansado(a) ou com pouca energia.' },
      { text: 'Falta de apetite ou comer demais.' },
      { text: 'Sentir-se mal consigo mesmo(a) — ou achar que é um fracasso ou que decepcionou sua família.' },
      { text: 'Dificuldade de se concentrar nas coisas (ler jornal ou assistir televisão).' },
      { text: 'Mover-se ou falar tão devagar que outras pessoas poderiam notar — ou, ao contrário, estar tão agitado(a) que você se movimenta mais do que o habitual.' },
      { text: 'Pensar que seria melhor estar morto(a) ou querer se machucar de alguma forma.' },
    ],
    cutoffs: { low: 5, moderate: 10 },
    results: {
      low:      { label: 'Pontuação baixa',    message: 'Sua pontuação não indica sintomas significativos de depressão. Se você sente que seu bem-estar emocional poderia melhorar, a terapia pode ajudar.' },
      moderate: { label: 'Pontuação moderada', message: 'Sua pontuação indica sintomas moderados que merecem atenção. Conversar com a Fernanda pode ser um passo importante para se sentir melhor.' },
      high:     { label: 'Pontuação elevada',  message: 'Sua pontuação indica sintomas importantes de depressão. É recomendável buscar acompanhamento profissional — a Fernanda está disponível para te ajudar.' },
    },
    waLabel: 'Site - Triagem Depressão',
    waMessages: {
      low:      'Olá Fernanda, fiz a triagem de depressão no site (pontuação baixa) e gostaria de conversar sobre bem-estar emocional.',
      moderate: 'Olá Fernanda, fiz a triagem de depressão no site (pontuação moderada) e gostaria de agendar uma sessão.',
      high:     'Olá Fernanda, fiz a triagem de depressão no site (pontuação elevada) e preciso de acompanhamento psicológico.',
    },
  },
  ansiedade: {
    id: 'ansiedade',
    title: 'Rastreio de Ansiedade',
    subtitle: 'Generalized Anxiety Disorder (GAD-7)',
    duration: '2 min',
    source: 'Spitzer et al. (2006) · Domínio público',
    scaleType: 'frequency',
    questions: [
      { text: 'Sentir-se nervoso(a), ansioso(a) ou no limite.' },
      { text: 'Não conseguir parar ou controlar as preocupações.' },
      { text: 'Preocupar-se demais com coisas diferentes.' },
      { text: 'Dificuldade de relaxar.' },
      { text: 'Ficar tão agitado(a) que é difícil permanecer sentado(a).' },
      { text: 'Ficar irritado(a) ou facilmente chateado(a).' },
      { text: 'Sentir medo como se algo terrível fosse acontecer.' },
    ],
    cutoffs: { low: 5, moderate: 10 },
    results: {
      low:      { label: 'Pontuação baixa',    message: 'Sua pontuação não indica ansiedade significativa. Se você sente que o estresse do dia a dia está pesado, a terapia pode oferecer ferramentas práticas.' },
      moderate: { label: 'Pontuação moderada', message: 'Sua pontuação indica ansiedade moderada. Trabalhar esses sintomas na terapia costuma trazer resultados bastante positivos.' },
      high:     { label: 'Pontuação elevada',  message: 'Sua pontuação indica ansiedade intensa. Buscar acompanhamento profissional é importante — a Fernanda trabalha especificamente com ansiedade usando TCC.' },
    },
    waLabel: 'Site - Triagem Ansiedade',
    waMessages: {
      low:      'Olá Fernanda, fiz a triagem de ansiedade no site (pontuação baixa) e gostaria de conversar sobre estresse e qualidade de vida.',
      moderate: 'Olá Fernanda, fiz a triagem de ansiedade no site (pontuação moderada) e gostaria de agendar uma sessão.',
      high:     'Olá Fernanda, fiz a triagem de ansiedade no site (pontuação elevada) e preciso de ajuda com ansiedade.',
    },
  },
};

const FREQUENCY_LABELS: Record<ScaleType, string[]> = {
  frequency:  ['Nenhuma vez', 'Vários dias', 'Mais da metade dos dias', 'Quase todos os dias'],
  frequency5: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Muito frequentemente'],
  agreement:  ['Concordo totalmente', 'Concordo', 'Discordo', 'Discordo totalmente'],
};

function getScore(test: Test, answers: number[]): number {
  if (test.scaleType === 'agreement') {
    return answers.reduce((acc, val, i) => {
      const q = test.questions[i];
      return acc + (q.reverseScore ? (val <= 1 ? 0 : 1) : (val <= 1 ? 1 : 0));
    }, 0);
  }
  return answers.reduce((a, b) => a + b, 0);
}

function getRange(test: Test, score: number): 'low' | 'moderate' | 'high' {
  if (score < test.cutoffs.low) return 'low';
  if (score < test.cutoffs.moderate) return 'moderate';
  return 'high';
}

const RANGE_COLORS = {
  low:      'text-green-600 bg-green-50 border-green-200',
  moderate: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  high:     'text-red-700 bg-red-50 border-red-200',
};

interface Props {
  testId: string;
  onClose: () => void;
}

export const ScreeningTest: React.FC<Props> = ({ testId, onClose }) => {
  const test = TESTS[testId];
  const [step, setStep] = useState<'intro' | 'questions' | 'capture' | 'result'>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  // Capture gate state
  const [captureName, setCaptureName]   = useState('');
  const [captureEmail, setCaptureEmail] = useState('');
  const [captureError, setCaptureError] = useState('');
  const [capturing, setCapturing]       = useState(false);

  const options = FREQUENCY_LABELS[test.scaleType];

  const score    = answers.length === test.questions.length ? getScore(test, answers) : 0;
  const range    = getRange(test, score);
  const result   = test.results[range];
  const waMessage = test.waMessages[range];
  const waUrl    = useWhatsAppUrl(test.waLabel, waMessage);

  const maxScore = test.scaleType === 'agreement'
    ? test.questions.length
    : test.scaleType === 'frequency5'
      ? test.questions.length * 4
      : test.questions.length * 3;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (step === 'questions') sendGAEvent(`inicio_triagem_${test.id}`, 'triagem', test.id);
    if (step === 'capture')   sendGAEvent(`gate_triagem_${test.id}`,   'triagem', test.id);
    if (step === 'result')    sendGAEvent(`conclusao_triagem_${test.id}`, 'triagem', `${test.id}_${range}_score${score}`);
  }, [step]);

  const handleAnswer = (val: number) => {
    const next = [...answers, val];
    setAnswers(next);
    if (next.length === test.questions.length) {
      setStep('capture'); // gate antes do resultado
    } else {
      setCurrent(current + 1);
    }
  };

  const handleBack = () => {
    if (current === 0) { setStep('intro'); setAnswers([]); }
    else { setCurrent(current - 1); setAnswers(answers.slice(0, -1)); }
  };

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captureName.trim()) { setCaptureError('Informe seu nome.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(captureEmail)) { setCaptureError('E-mail inválido.'); return; }

    setCapturing(true);
    setCaptureError('');

    // Salva lead no Firebase
    const leadResult = await leadsService.create({
      name:        captureName.trim(),
      email:       captureEmail.trim(),
      source:      'screening_test',
      testId:      test.id,
      testTitle:   test.title,
      testScore:   score,
      testMaxScore: maxScore,
      testRange:   range,
    });

    // Dispara e-mail via Resend (fire-and-forget — não bloqueia o resultado)
    fetch('/api/resend-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:          captureName.trim(),
        email:         captureEmail.trim(),
        source:        'screening_test',
        testId:        test.id,
        testTitle:     test.title,
        testScore:     score,
        testMaxScore:  maxScore,
        testRange:     range,
        resultMessage: result.message,
      }),
    }).then(async (r) => {
      if (r.ok && leadResult.id) {
        leadsService.markEmailSent(leadResult.id);
      }
    }).catch(() => {});

    sendGAEvent(`lead_capturado_${test.id}`, 'lead', `${test.id}_${range}`);
    setCapturing(false);
    setStep('result');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-[#3A4A3A]">{test.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{test.subtitle}</p>
          </div>
          <button onClick={onClose} className="ml-4 shrink-0 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">

          {/* ── INTRO ── */}
          {step === 'intro' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                <span>⏱ {test.duration}</span>
                <span className="text-gray-300">·</span>
                <span>{test.questions.length} perguntas</span>
                <span className="text-gray-300">·</span>
                <span>Gratuito</span>
              </div>
              <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Este questionário é uma ferramenta de triagem e <strong>não substitui avaliação clínica</strong>. Os resultados são orientativos — apenas um profissional pode fazer um diagnóstico.
                </p>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">Responda de acordo com como você se sentiu nas <strong>últimas 2 semanas</strong>.</p>
              <p className="text-[10px] text-gray-400">Fonte: {test.source}</p>
              <button
                onClick={() => setStep('questions')}
                className="w-full bg-[#4A5D4A] hover:bg-[#3A4A3A] text-white font-bold py-3.5 rounded-xl transition-colors"
              >
                Iniciar triagem
              </button>
            </div>
          )}

          {/* ── QUESTIONS ── */}
          {step === 'questions' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Pergunta {current + 1} de {test.questions.length}</span>
                  <span>{Math.round((current / test.questions.length) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4A5D4A] rounded-full transition-all duration-300" style={{ width: `${(current / test.questions.length) * 100}%` }} />
                </div>
              </div>
              <p className="text-base font-medium text-[#3A4A3A] leading-relaxed min-h-[3.5rem]">
                {test.questions[current].text}
              </p>
              <div className="grid gap-2">
                {options.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="text-left px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:border-[#4A5D4A] hover:bg-[#4A5D4A]/5 hover:text-[#3A4A3A] transition-all font-medium"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={handleBack} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                <ChevronLeft size={14} /> Voltar
              </button>
            </div>
          )}

          {/* ── CAPTURE GATE ── */}
          {step === 'capture' && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 bg-[#4A5D4A]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail size={24} className="text-[#4A5D4A]" />
                </div>
                <h3 className="text-lg font-bold text-[#3A4A3A]">Triagem concluída!</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Informe seus dados para receber seus resultados detalhados por e-mail.
                </p>
              </div>

              <form onSubmit={handleCapture} className="space-y-3">
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={captureName}
                    onChange={(e) => { setCaptureName(e.target.value); setCaptureError(''); }}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4C2B4]/50 text-sm transition-all"
                  />
                </div>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Seu e-mail"
                    value={captureEmail}
                    onChange={(e) => { setCaptureEmail(e.target.value); setCaptureError(''); }}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4C2B4]/50 text-sm transition-all"
                  />
                </div>

                {captureError && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <AlertCircle size={12} /> {captureError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={capturing}
                  className="w-full bg-[#4A5D4A] hover:bg-[#3A4A3A] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {capturing
                    ? <><Loader2 size={17} className="animate-spin" /> Salvando...</>
                    : 'Ver meus resultados'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('result')}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
                >
                  Pular e ver resultado sem salvar
                </button>
              </form>

              <p className="text-[10px] text-gray-400 text-center">
                Seus dados são protegidos e não serão compartilhados com terceiros.
              </p>
            </div>
          )}

          {/* ── RESULT ── */}
          {step === 'result' && (
            <div className="space-y-5">
              <div className={`rounded-xl border px-5 py-4 ${RANGE_COLORS[range]}`}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-70">{result.label}</p>
                <p className="text-2xl font-bold">{score} <span className="text-sm font-normal opacity-60">/ {maxScore} pontos</span></p>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">{result.message}</p>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { sendGAEvent(`cta_pos_triagem_${test.id}`, 'triagem', `whatsapp_${range}`); trackWhatsAppClick(`triagem_${test.id}`); }}
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3.5 rounded-xl transition-colors shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.403 0 6.556-5.332 11.89-11.891 11.89-2.015 0-3.991-.512-5.747-1.487l-6.246 1.638zm5.836-5.046c1.656.984 3.279 1.484 4.964 1.484 5.422 0 9.835-4.413 9.835-9.835 0-2.628-1.022-5.1-2.871-6.951-1.848-1.847-4.331-2.87-6.964-2.87-5.422 0-9.835 4.413-9.835 9.835 0 1.904.537 3.74 1.554 5.31l-.995 3.634 3.671-.962zm10.103-6.887c-.198-.1-1.174-.58-1.356-.646-.182-.065-.315-.1-.448.1-.133.199-.513.646-.629.779-.117.133-.232.15-.429.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.117-.198-.013-.304.087-.403.09-.089.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.448-1.08-.614-1.482-.162-.389-.326-.335-.448-.341-.117-.005-.252-.006-.388-.006-.136 0-.356.05-.542.253-.187.203-.712.696-.712 1.697 0 1.002.728 1.97.83 2.103.101.133 1.43 2.184 3.465 3.063.483.209.86.335 1.154.428.484.154.925.132 1.273.08.388-.058 1.174-.48 1.34-.943.165-.463.165-.86.115-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                Conversar com a Fernanda
              </a>

              <button
                onClick={() => { setStep('intro'); setCurrent(0); setAnswers([]); setCaptureName(''); setCaptureEmail(''); }}
                className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
              >
                Refazer o teste
              </button>

              <p className="text-[10px] text-gray-400 text-center">Fonte: {test.source}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
