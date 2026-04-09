import React from 'react';
import { sendGAEvent } from '../utils/analytics';

export const MediaContent: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="text-xs font-bold text-[#4A5D4A] uppercase tracking-widest">Guia Prático</span>
        <h2 className="text-4xl font-serif text-gray-800 mt-2 mb-4">Insights da Fernanda</h2>
        <div className="h-0.5 w-12 bg-[#B4C2B4] mx-auto mb-6"></div>
        <p className="text-gray-500 max-w-xl mx-auto leading-relaxed">
          Além do consultório, compartilho orientações práticas sobre saúde mental, relacionamentos e desenvolvimento emocional.
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
        {/* Video Embed */}
        <div className="w-full lg:w-[60%]">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-100 aspect-video">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/nLVA7YeejEI"
              title="3 Dicas Para um Bom Relacionamento com seu Filho — Fernanda Mangia"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>

        {/* Side Info */}
        <div className="w-full lg:w-[40%] space-y-8">
          {/* Video Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {/* YouTube icon */}
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M19.582 2.186A2.506 2.506 0 0 0 17.82.418C16.254 0 10 0 10 0S3.746 0 2.18.418A2.506 2.506 0 0 0 .418 2.186C0 3.755 0 7 0 7s0 3.245.418 4.814a2.506 2.506 0 0 0 1.762 1.768C3.746 14 10 14 10 14s6.254 0 7.82-.418a2.506 2.506 0 0 0 1.762-1.768C20 10.245 20 7 20 7s0-3.245-.418-4.814ZM7.991 9.999V4.001L13.182 7 7.99 9.999Z" fill="#FF0000"/>
              </svg>
              <span className="text-xs font-bold text-red-600 uppercase tracking-widest">YouTube</span>
            </div>
            <h3 className="text-xl md:text-2xl font-serif text-gray-800 mb-3 leading-snug">
              3 Passos Para Fortalecer o Vínculo com seu Filho
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Estratégias acessíveis para construir uma conexão genuína entre pais e filhos, desenvolvidas a partir da vivência clínica e do cuidado com o desenvolvimento emocional das crianças.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3">
            <a
              href="https://www.youtube.com/watch?v=nLVA7YeejEI"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sendGAEvent('ver_video_youtube', 'media', 'youtube')}
              className="flex items-center justify-center gap-3 bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
            >
              <svg width="18" height="13" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M19.582 2.186A2.506 2.506 0 0 0 17.82.418C16.254 0 10 0 10 0S3.746 0 2.18.418A2.506 2.506 0 0 0 .418 2.186C0 3.755 0 7 0 7s0 3.245.418 4.814a2.506 2.506 0 0 0 1.762 1.768C3.746 14 10 14 10 14s6.254 0 7.82-.418a2.506 2.506 0 0 0 1.762-1.768C20 10.245 20 7 20 7s0-3.245-.418-4.814ZM7.991 9.999V4.001L13.182 7 7.99 9.999Z" fill="white"/>
              </svg>
              Assistir no YouTube
            </a>
            <a
              href="https://www.instagram.com/fernandamangiapsi/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sendGAEvent('ver_instagram', 'media', 'instagram')}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
            >
              {/* Instagram icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="2"/>
                <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="2"/>
                <circle cx="17.5" cy="6.5" r="1.5" fill="white"/>
              </svg>
              Seguir no Instagram
            </a>
          </div>

          {/* Editorial note */}
          <p className="text-xs text-gray-400 italic leading-relaxed border-l-2 border-[#B4C2B4] pl-4">
            "Compartilho conteúdos porque acredito que informação de qualidade é o primeiro passo para o cuidado com a saúde mental."
          </p>
        </div>
      </div>
    </div>
  );
};
