
import React from 'react';
import { User, Activity, Brain, Heart, Wind, ClipboardCheck, Share2, GraduationCap } from 'lucide-react';
import { sendGAEvent } from '../utils/analytics';

const serviceList = [
  {
    title: 'Terapia Individual',
    desc: 'Espaço seguro e acolhedor para adolescentes e adultos trabalharem o autoconhecimento, superar bloqueios e construir uma versão mais plena de si mesmos.',
    icon: <User />
  },
  {
    title: 'Ansiedade e Estresse',
    desc: 'Aprenda a identificar gatilhos, regular emoções e recuperar a leveza do dia a dia com técnicas baseadas em evidências da TCC.',
    icon: <Activity />
  },
  {
    title: 'Depressão',
    desc: 'Acolhimento especializado para compreender os sintomas, resgatar a motivação e retomar o prazer nas pequenas coisas da vida.',
    icon: <Wind />
  },
  {
    title: 'Autoestima',
    desc: 'Reconecte-se com sua própria força. Trabalharemos juntos para construir uma visão mais compassiva e confiante de quem você é.',
    icon: <Heart />
  },
  {
    title: 'Luto e Perdas',
    desc: 'Um espaço seguro para atravessar a dor da perda com suporte emocional, sem pressa, respeitando cada etapa do seu processo.',
    icon: <Brain />
  },
  {
    title: 'Avaliação Psicológica e Neuropsicológica',
    desc: 'Avaliação completa das funções emocionais e cognitivas — atenção, memória, aprendizado — para embasar diagnósticos precisos e orientar o tratamento mais adequado.',
    icon: <ClipboardCheck />
  },
  {
    title: 'Orientação Vocacional',
    desc: 'Descubra seus talentos, valores e propósito profissional. Ideal para adolescentes em dúvida sobre o futuro e adultos em transição de carreira.',
    icon: <GraduationCap />
  }
];

export const Services: React.FC = () => {
  const handleShare = async (title: string) => {
    const shareData = {
      title: 'Psicóloga Fernanda Abreu Mangia',
      text: `Conheça o serviço de ${title} da Dra. Fernanda Abreu Mangia.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copiado para a área de transferência!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {serviceList.map((service, idx) => (
          <div
            key={idx}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-[#B4C2B4] hover:border-b-[#4A5D4A] hover:-translate-y-2 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group relative"
          >
            <button
              onClick={() => handleShare(service.title)}
              className="absolute top-4 right-4 p-2 text-gray-300 hover:text-[#4A5D4A] hover:bg-gray-50 rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
              title="Compartilhar"
            >
              <Share2 size={18} />
            </button>
            <div className="mb-6 transform transition-transform duration-300 group-hover:scale-110 p-4 bg-[#4A5D4A]/5 rounded-full group-hover:bg-[#4A5D4A]/10">
              {React.cloneElement(service.icon as React.ReactElement<{ className?: string; size?: number }>, { className: "text-[#4A5D4A]", size: 32 })}
            </div>
            <h3 className="text-xl font-serif text-[#4A5D4A] mb-4 group-hover:text-[#2C3E2C] transition-colors">{service.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{service.desc}</p>
            {service.title === 'Avaliação Psicológica e Neuropsicológica' && (
              <a
                href="https://wa.me/5521971318289?text=Olá%20Dra.%20Fernanda%2C%20gostaria%20de%20agendar%20uma%20Avaliação%20Neuropsicológica."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sendGAEvent('agendar_avaliacao_neuropsicologica', 'servicos', 'whatsapp')}
                className="mt-6 inline-block bg-[#4A5D4A] hover:bg-[#3A4A3A] text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Agendar Avaliação
              </a>
            )}
          </div>
        ))}
      </div>

      <p className="text-center mt-12 text-white/60 italic text-sm">
        Entre em contato para saber mais sobre como posso te ajudar!
      </p>
    </div>
  );
};
