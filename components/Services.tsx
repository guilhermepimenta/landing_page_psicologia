
import React from 'react';
import { User, Activity, Brain, Heart, Wind, ClipboardCheck, GraduationCap } from 'lucide-react';
import { sendGAEvent } from '../utils/analytics';
import { useWhatsAppUrl } from '../utils/useWhatsAppUrl';

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

export const Services: React.FC = () => {
  const waUrl = useWhatsAppUrl('Site - Avaliação', 'Olá Fernanda, vim pelo site e gostaria de saber mais sobre a Avaliação Neuropsicológica.');

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
          onClick={() => sendGAEvent('agendar_avaliacao_neuropsicologica', 'servicos', 'whatsapp')}
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

    </div>
  );
};
