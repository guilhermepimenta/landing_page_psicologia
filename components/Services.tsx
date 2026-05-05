
import React, { useState, lazy, Suspense } from 'react';
import { User, Activity, Brain, Heart, Wind, ClipboardCheck, GraduationCap } from 'lucide-react';
import { sendGAEvent, trackWhatsAppClick } from '../utils/analytics';
import { useWhatsAppUrl } from '../utils/useWhatsAppUrl';

// Lazy: ScreeningTest importa leadsService → firebaseService → firebase SDK.
// Como é um modal, só precisa carregar quando o usuário clica em "Fazer triagem".
const ScreeningTest = lazy(() =>
  import('./ScreeningTest').then(m => ({ default: m.ScreeningTest }))
);

const featuredService = {
  title: 'Avaliação Psicológica e Neuropsicológica',
  desc: 'Avaliação completa das funções emocionais e cognitivas — atenção, memória, aprendizado — para embasar diagnósticos precisos e orientar o tratamento mais adequado.',
  icon: <ClipboardCheck />,
  badge: 'Destaque',
};

const serviceList = [
  {
    title: 'Terapia Individual',
    desc: 'Espaço seguro para adolescentes e adultos trabalharem o autoconhecimento e superar bloqueios.',
    icon: <User />
  },
  {
    title: 'Ansiedade e Estresse',
    desc: 'Identifique gatilhos, regule emoções e recupere a leveza do dia a dia com TCC baseada em evidências.',
    icon: <Activity />
  },
  {
    title: 'Depressão',
    desc: 'Acolhimento especializado para resgatar a motivação e retomar o prazer nas pequenas coisas.',
    icon: <Wind />
  },
  {
    title: 'Autoestima',
    desc: 'Construa uma visão mais compassiva e confiante de quem você é.',
    icon: <Heart />
  },
  {
    title: 'Luto e Perdas',
    desc: 'Suporte emocional para atravessar a dor da perda, sem pressa, respeitando seu processo.',
    icon: <Brain />
  },
  {
    title: 'Orientação Vocacional',
    desc: 'Descubra talentos e propósito profissional — para quem está começando ou em transição de carreira.',
    icon: <GraduationCap />
  }
];

const screeningTests = [
  { id: 'tdah', label: 'TDAH', emoji: '🧠', duration: '3 min' },
  { id: 'tea', label: 'TEA / Autismo', emoji: '🔍', duration: '3 min' },
  { id: 'depressao', label: 'Depressão', emoji: '💙', duration: '3 min' },
  { id: 'ansiedade', label: 'Ansiedade', emoji: '🌿', duration: '2 min' },
];

export const Services: React.FC = () => {
  const waUrl = useWhatsAppUrl('Site - Avaliação', 'Olá Fernanda, vim pelo site e gostaria de saber mais sobre a Avaliação Neuropsicológica.');
  const [activeTest, setActiveTest] = useState<string | null>(null);

  const openTest = (id: string) => {
    setActiveTest(id);
    sendGAEvent(`abrir_triagem_${id}`, 'triagem', id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-serif text-white mb-4">Serviços</h2>
        <div className="h-0.5 w-12 bg-white/30 mx-auto mb-6"></div>
        <p className="text-white/80 max-w-2xl mx-auto">
          Ofereço atendimento psicológico individualizado, online e presencial, focado nas suas necessidades. Conheça alguns dos temas abordados:
        </p>
      </div>

      {/* Featured card — Avaliação */}
      <div className="mb-6 bg-white rounded-2xl shadow-lg border-l-4 border-[#4A5D4A] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 group">
        <div className="shrink-0 p-3 bg-[#4A5D4A]/10 rounded-xl group-hover:bg-[#4A5D4A]/20 transition-colors">
          {React.cloneElement(featuredService.icon as React.ReactElement<{ className?: string; size?: number }>, { className: 'text-[#4A5D4A]', size: 28 })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-serif text-[#4A5D4A] font-bold">{featuredService.title}</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-[#4A5D4A] text-white px-2 py-0.5 rounded-full shrink-0">{featuredService.badge}</span>
          </div>
          <p className="text-gray-500 text-sm leading-relaxed">{featuredService.desc}</p>
        </div>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { sendGAEvent('agendar_avaliacao_neuropsicologica', 'servicos', 'whatsapp'); trackWhatsAppClick('servicos'); }}
          className="shrink-0 bg-[#4A5D4A] hover:bg-[#3A4A3A] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap"
        >
          Agendar Avaliação
        </a>
      </div>

      {/* Secondary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceList.map((service, idx) => (
          <div
            key={idx}
            className="bg-white/90 p-5 rounded-xl border border-white/20 hover:bg-white hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex items-start gap-4 group"
          >
            <div className="shrink-0 p-2 bg-[#4A5D4A]/8 rounded-lg group-hover:bg-[#4A5D4A]/15 transition-colors mt-0.5">
              {React.cloneElement(service.icon as React.ReactElement<{ className?: string; size?: number }>, { className: 'text-[#4A5D4A]', size: 20 })}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#3A4A3A] mb-1">{service.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{service.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Screening block */}
      <div className="mt-8 bg-white/10 border border-white/20 rounded-2xl px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h3 className="text-white font-bold text-base">Triagens gratuitas</h3>
            <p className="text-white/60 text-xs mt-0.5">Questionários validados — resultado imediato, sem cadastro</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 bg-white/10 px-3 py-1 rounded-full self-start sm:self-auto">
            Não substitui diagnóstico
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {screeningTests.map((t) => (
            <button
              key={t.id}
              onClick={() => openTest(t.id)}
              className="flex flex-col items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 rounded-xl px-3 py-4 transition-all group"
            >
              <span className="text-2xl">{t.emoji}</span>
              <span className="text-white text-xs font-bold text-center leading-tight">{t.label}</span>
              <span className="text-white/50 text-[10px]">{t.duration}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTest && (
        <Suspense fallback={null}>
          <ScreeningTest testId={activeTest} onClose={() => setActiveTest(null)} />
        </Suspense>
      )}
    </div>
  );
};
