
import React from 'react';
import { sendGAEvent, trackWhatsAppClick } from '../utils/analytics';
import { useWhatsAppUrl } from '../utils/useWhatsAppUrl';

export const Hero: React.FC = () => {
  const waUrl = useWhatsAppUrl('Site - Início', 'Olá Fernanda, vim pelo site e gostaria de agendar uma consulta.');

  return (
    <div className="relative min-h-[70vh] md:min-h-[85vh] flex items-start justify-center overflow-hidden">
      {/* Background Gradient & Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
      // style={{ backgroundImage: `url('https://picsum.photos/id/124/1920/1080')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#4A5D4A]/80 to-black/30 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-28 md:pt-56 pb-20">
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md">
            <span className="text-yellow-400 text-base leading-none">★★★★★</span>
            5,0 · 23 avaliações no Google
          </span>
          <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/25 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md">
            <span className="text-yellow-400 text-base leading-none">★★★★★</span>
            5,0 · 153 avaliações no Doctoralia
          </span>
        </div>
        <h1 className="text-4xl md:text-7xl text-white font-serif leading-tight mb-8 drop-shadow-xl animate-fadeIn">
          Você merece se sentir bem consigo mesmo
        </h1>
        <div className="h-1 w-24 bg-[#B4C2B4] mx-auto mb-10 rounded-full shadow-sm"></div>
        <p className="text-lg md:text-2xl text-white/90 font-light max-w-3xl mx-auto mb-12 leading-relaxed">
          Psicoterapia individual para adultos e adolescentes — online e presencial em Niterói e Nova Friburgo. Acolhimento, técnica e presença em cada fase da vida.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { sendGAEvent('agendar_consulta_hero', 'hero', 'whatsapp'); trackWhatsAppClick('hero'); }}
            className="w-full sm:w-auto bg-[#4A5D4A] hover:bg-[#3A4A3A] text-white px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Agendar Consulta
          </a>
          <a
            href="#servicos"
            onClick={() => sendGAEvent('ver_servicos', 'hero', 'link_ancora')}
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:-translate-y-1"
          >
            Conhecer Serviços
          </a>
        </div>
      </div>
    </div>
  );
};
