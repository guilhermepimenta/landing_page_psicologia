
import React from 'react';

export const Hero: React.FC = () => {
  return (
    <div className="relative min-h-[70vh] md:min-h-[85vh] flex items-start justify-center overflow-hidden">
      {/* Background Gradient & Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
      // style={{ backgroundImage: `url('https://picsum.photos/id/124/1920/1080')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#4A5D4A]/80 to-black/30 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-40 md:pt-56 pb-20">
        <h2 className="text-4xl md:text-7xl text-white font-serif leading-tight mb-8 drop-shadow-xl animate-fadeIn">
          Cuidado e bem-estar para uma vida mais leve
        </h2>
        <div className="h-1 w-24 bg-[#B4C2B4] mx-auto mb-10 rounded-full shadow-sm"></div>
        <p className="text-lg md:text-2xl text-white/90 font-light max-w-3xl mx-auto mb-12 leading-relaxed">
          Apoio especializado para ajudar você a navegar pelas complexidades da mente e encontrar o equilíbrio emocional necessário.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {/* <a
            href="#agendamento"
            className="w-full sm:w-auto bg-[#B4C2B4] hover:bg-[#9BAB9B] text-white px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            Agendar Consulta
          </a> */}
          <a
            href="#servicos"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:-translate-y-1"
          >
            Conhecer Serviços
          </a>
        </div>
      </div>
    </div>
  );
};
