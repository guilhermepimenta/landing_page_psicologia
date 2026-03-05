
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
            © 2024-2026. Todos os direitos reservados.
          </p>
          <p className="text-gray-400 text-sm">
            Desenvolvido com carinho para o seu bem estar.
          </p>
          <div className="flex gap-4 mt-8">
            <a
              href="https://www.instagram.com/fernandamangiapsi/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              title="Instagram"
            >
              <Instagram size={20} />
            </a>
            <a
              href="https://www.linkedin.com/in/fernanda-abreu-mangia-a4b68849/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              title="LinkedIn"
            >
              <Linkedin size={20} />
            </a>
            <a
              href="https://www.doctoralia.com.br/fernanda-abreu-mangia/psicologo/niteroi"
              target="_blank"
              rel="noopener noreferrer"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-gray-500 text-xs tracking-widest uppercase">
          Psicóloga 05/31299
        </p>
        <a
          href="https://wa.me/5521971318289"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-colors shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.403 0 6.556-5.332 11.89-11.891 11.89-2.015 0-3.991-.512-5.747-1.487l-6.246 1.638zm5.836-5.046c1.656.984 3.279 1.484 4.964 1.484 5.422 0 9.835-4.413 9.835-9.835 0-2.628-1.022-5.1-2.871-6.951-1.848-1.847-4.331-2.87-6.964-2.87-5.422 0-9.835 4.413-9.835 9.835 0 1.904.537 3.74 1.554 5.31l-.995 3.634 3.671-.962zm10.103-6.887c-.198-.1-1.174-.58-1.356-.646-.182-.065-.315-.1-.448.1-.133.199-.513.646-.629.779-.117.133-.232.15-.429.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.117-.198-.013-.304.087-.403.09-.089.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.448-1.08-.614-1.482-.162-.389-.326-.335-.448-.341-.117-.005-.252-.006-.388-.006-.136 0-.356.05-.542.253-.187.203-.712.696-.712 1.697 0 1.002.728 1.97.83 2.103.101.133 1.43 2.184 3.465 3.063.483.209.86.335 1.154.428.484.154.925.132 1.273.08.388-.058 1.174-.48 1.34-.943.165-.463.165-.86.115-.943-.049-.084-.182-.133-.38-.232z"/></svg>
          Agendar pelo WhatsApp
        </a>
      </div>
    </footer>
  );
};
