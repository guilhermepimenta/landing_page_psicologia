import React from 'react';
import { CalendarCheck, MessageCircle, Brain, FileText } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: <CalendarCheck size={28} />,
    title: 'Agendamento',
    description: 'Entre em contato pelo WhatsApp ou Doctoralia. Conversamos sobre sua demanda e agendamos a primeira sessão no horário que melhor encaixa na sua rotina.',
  },
  {
    number: '02',
    icon: <MessageCircle size={28} />,
    title: 'Entrevista Inicial',
    description: 'Na primeira sessão, conhecemos você (ou seu filho) com mais profundidade. Mapeamos a história de vida, queixas e objetivos para desenhar a avaliação adequada.',
  },
  {
    number: '03',
    icon: <Brain size={28} />,
    title: 'Sessões de Avaliação',
    description: 'Aplicamos os instrumentos neuropsicológicos validados — testes de atenção, memória, funções executivas e cognição — em sessões de aproximadamente 50 minutos.',
  },
  {
    number: '04',
    icon: <FileText size={28} />,
    title: 'Laudo e Devolutiva',
    description: 'Entregamos o laudo completo e realizamos a devolutiva: uma sessão dedicada a explicar os resultados, o diagnóstico e orientar os próximos passos do tratamento.',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <h2 className="text-4xl font-serif text-[#3A4A3A] mb-4">Como funciona a avaliação</h2>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Um processo transparente e cuidadoso, do primeiro contato até o diagnóstico.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        {/* Connecting line — desktop only */}
        <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-[#B4C2B4] via-[#4A5D4A]/40 to-[#B4C2B4]" />

        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-4 relative">
            {/* Icon circle */}
            <div className="w-20 h-20 rounded-full bg-[#4A5D4A] text-white flex items-center justify-center shadow-lg relative z-10">
              {step.icon}
            </div>

            {/* Step number badge */}
            <span className="text-xs font-bold text-[#B4C2B4] tracking-widest uppercase">
              Passo {step.number}
            </span>

            <h3 className="text-lg font-bold text-[#3A4A3A]">{step.title}</h3>

            <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 text-center">
        <a
          href={`https://wa.me/5521971318289?text=${encodeURIComponent('[Site - Como Funciona] Olá Fernanda, vi como funciona a avaliação e gostaria de iniciar o processo.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#4A5D4A] hover:bg-[#3A4A3A] text-white px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
          Iniciar minha avaliação
        </a>
      </div>
    </div>
  );
};
