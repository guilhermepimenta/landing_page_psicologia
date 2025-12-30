
import React from 'react';
import { Calendar } from 'lucide-react';

export const Scheduling: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-serif text-[#4A5D4A] mb-4">Agendamento</h2>
        <div className="h-0.5 w-12 bg-[#B4C2B4] mx-auto mb-6"></div>
        <p className="text-gray-500">
          Para sua comodidade, você pode agendar sua consulta diretamente online. Escolha o melhor dia e horário para você.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Browser Mockup Style Header */}
        <div className="bg-[#F8F9FA] px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <span className="text-xs font-medium text-gray-400 tracking-widest uppercase">CALENDÁRIO</span>
        </div>

        {/* Calendar Placeholder Body */}
        <div className="p-12 md:p-24 flex flex-col items-center justify-center text-center">
          <div className="bg-[#FDFCFB] w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-gray-50">
            <Calendar className="text-[#B4C2B4]" size={40} />
          </div>
          <h3 className="text-2xl font-serif text-[#4A5D4A] mb-2">Selecione uma data</h3>
          <p className="text-gray-400 mb-10 max-w-xs">
            O widget de agendamento carregará aqui para sua região.
          </p>
          <button className="bg-[#4A90E2] hover:bg-[#357ABD] text-white px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-lg active:scale-95">
            Agendar Agora
          </button>
        </div>
      </div>

      <div className="mt-10 text-center text-xs text-gray-400">
        <p>Se tiver dúvidas ou precisar de ajuda para agendar, utilize o formulário abaixo ou entre em contato pelo WhatsApp.</p>
      </div>
    </div>
  );
};
