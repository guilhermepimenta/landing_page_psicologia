
import React from 'react';
import { Instagram, Linkedin, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1C1C1C] text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {/* Branding */}
        <div>
          <h2 className="text-2xl font-serif font-bold mb-6">Psicóloga Fernanda Abreu Mangia</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-xs">
            © 2024-2025. Todos os direitos reservados.
          </p>
          <p className="text-gray-400 text-sm">
            Desenvolvido com carinho para o seu bem estar.
          </p>
          <div className="flex gap-4 mt-8">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              title="Instagram"
            >
              <Instagram size={20} />
            </a>
            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              title="LinkedIn"
            >
              <Linkedin size={20} />
            </a>
            <a
              href="#"
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              title="Doctoralia"
            >
              <div className="w-5 h-5 flex items-center justify-center font-bold text-xs italic">d</div>
            </a>
          </div>
        </div>

        {/* Clinics Info */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-[#B4C2B4]"></div>
              <h3 className="text-lg font-bold tracking-wider">Consultórios</h3>
            </div>

            <div className="space-y-8">
              <div className="flex gap-4 items-start">
                <div className="mt-1 bg-white/5 p-2 rounded-lg text-[#B4C2B4]">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-[#B4C2B4] mb-1 uppercase text-[10px] tracking-[0.2em]">Niterói</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Rua Mem de Sá, 34 - Icaraí<br />
                    Niterói - RJ
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="mt-1 bg-white/5 p-2 rounded-lg text-[#B4C2B4]">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-[#B4C2B4] mb-1 uppercase text-[10px] tracking-[0.2em]">Nova Friburgo</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Rua Dr. Ernesto Brasilio, 51 - Centro<br />
                    Nova Friburgo - RJ
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-white/10 text-center">
        <p className="text-gray-500 text-xs tracking-widest uppercase">
          Psicóloga 05/31299
        </p>
      </div>
    </footer>
  );
};
