
import React from 'react';
import { User, Activity, Brain, Heart, Wind, Target, Share2 } from 'lucide-react';

const serviceList = [
  {
    title: 'Terapia Individual',
    desc: 'Atendimento focado em adolescentes e adultos, buscando sempre o autoconhecimento e desenvolvimento.',
    icon: <User />
  },
  {
    title: 'Ansiedade e Estresse',
    desc: 'Desenvolvimento de estratégias e ferramentas práticas para lidar com a ansiedade no dia a dia.',
    icon: <Activity />
  },
  {
    title: 'Depressão',
    desc: 'Apoio especializado para compreender e tratar os sintomas de depressão e transtornos de humor.',
    icon: <Wind />
  },
  {
    title: 'Autoestima',
    desc: 'Jornada para fortalecer a autoestima, confiança e o olhar de acolhimento sobre si mesmo.',
    icon: <Heart />
  },
  {
    title: 'Luto e Perdas',
    desc: 'Acolhimento e suporte para vivenciar processos de luto e perdas significativas de forma saudável.',
    icon: <Brain />
  },
  {
    title: 'Desenvolvimento',
    desc: 'Orientações para alcançar metas, superar desafios e promover o crescimento pessoal e profissional.',
    icon: <Target />
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
        <h2 className="text-4xl font-serif text-[#4A5D4A] mb-4">Serviços</h2>
        <div className="h-0.5 w-12 bg-[#B4C2B4] mx-auto mb-6"></div>
        <p className="text-gray-500 max-w-2xl mx-auto">
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
              className="absolute top-4 right-4 p-2 text-gray-300 hover:text-[#4A5D4A] hover:bg-gray-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
              title="Compartilhar"
            >
              <Share2 size={18} />
            </button>
            <div className="mb-6 transform transition-transform duration-300 group-hover:scale-110 p-4 bg-[#4A5D4A]/5 rounded-full group-hover:bg-[#4A5D4A]/10">
              {React.cloneElement(service.icon as React.ReactElement, { className: "text-[#4A5D4A]", size: 32 })}
            </div>
            <h3 className="text-xl font-serif text-[#4A5D4A] mb-4 group-hover:text-[#2C3E2C] transition-colors">{service.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{service.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-center mt-12 text-gray-400 italic text-sm">
        Entre em contato para saber mais sobre como posso te ajudar!
      </p>
    </div>
  );
};
