
import React, { useState } from 'react';
import { MapPin, Monitor, Calendar } from 'lucide-react';
import { sendGAEvent } from '../utils/analytics';

type Tab = 'niteroi' | 'nova-friburgo' | 'online';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'niteroi', label: 'Niterói', icon: <MapPin size={16} /> },
  { id: 'nova-friburgo', label: 'Nova Friburgo', icon: <MapPin size={16} /> },
  { id: 'online', label: 'Online', icon: <Monitor size={16} /> },
];

const PSICOMANAGER_URL = 'https://app2.psicomanager.com/agendamentos-online/Fernandamangia';

const tabContent: Record<Tab, {
  address: string;
  schedule: string;
  services: string[];
  whatsappMsg: string;
  doctoralia?: string;
}> = {
  'niteroi': {
    address: 'Rua Mem de Sá, 34 — Icaraí, Niterói - RJ',
    schedule: 'Segunda a sexta · Sábados a combinar',
    services: ['Terapia Individual', 'Avaliação Psicológica e Neuropsicológica', 'Orientação Vocacional'],
    whatsappMsg: 'Olá Dra. Fernanda, gostaria de agendar uma consulta presencial em Niterói.',
    doctoralia: 'https://www.doctoralia.com.br/fernanda-abreu-mangia/psicologo/niteroi',
  },
  'nova-friburgo': {
    address: 'Rua Dr. Ernesto Brasilio, 51 — Centro, Nova Friburgo - RJ',
    schedule: 'Dias e horários a confirmar',
    services: ['Terapia Individual', 'Avaliação Psicológica e Neuropsicológica', 'Orientação Vocacional'],
    whatsappMsg: 'Olá Dra. Fernanda, gostaria de agendar uma consulta presencial em Nova Friburgo.',
  },
  'online': {
    address: 'Atendimento para todo o Brasil via videoconferência',
    schedule: 'Segunda a sexta · Sábados a combinar',
    services: ['Terapia Individual', 'Orientação Vocacional', 'Avaliação Psicológica'],
    whatsappMsg: 'Olá Dra. Fernanda, gostaria de agendar uma consulta online.',
  },
};

export const Scheduling: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('niteroi');
  const content = tabContent[activeTab];

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    sendGAEvent('selecionar_cidade_agendamento', 'agendamento', tab);
  };

  const handleScheduleClick = () => {
    const msg = encodeURIComponent(content.whatsappMsg);
    sendGAEvent(`agendar_whatsapp_${activeTab}`, 'agendamento', 'whatsapp');
    window.open(`https://wa.me/5521971318289?text=${msg}`, '_blank');
  };

  const handleDoctoraliaClick = () => {
    sendGAEvent('agendar_doctoralia_niteroi', 'agendamento', 'doctoralia');
  };

  const handlePsicomanagerClick = () => {
    sendGAEvent(`agendar_psicomanager_${activeTab}`, 'agendamento', 'psicomanager');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-serif text-[#4A5D4A] mb-4">Agendamento</h2>
        <div className="h-0.5 w-12 bg-[#B4C2B4] mx-auto mb-6"></div>
        <p className="text-gray-500 max-w-xl mx-auto">
          Atendimentos presenciais em Niterói e Nova Friburgo, e online para todo o Brasil. Escolha sua modalidade e agende com facilidade.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all duration-200
                ${activeTab === tab.id
                  ? 'text-[#4A5D4A] border-b-2 border-[#4A5D4A] bg-[#4A5D4A]/5'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Info */}
            <div className="flex-1 space-y-5">
              <div className="flex gap-3 items-start">
                <div className="mt-1 p-2 bg-[#4A5D4A]/10 rounded-lg text-[#4A5D4A] shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Endereço</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{content.address}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="mt-1 p-2 bg-[#4A5D4A]/10 rounded-lg text-[#4A5D4A] shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Horários</p>
                  <p className="text-gray-700 text-sm">{content.schedule}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Serviços disponíveis</p>
                <ul className="space-y-1.5">
                  {content.services.map((s) => (
                    <li key={s} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B4C2B4] shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[200px]">
              <button
                onClick={handleScheduleClick}
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold px-7 py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.403 0 6.556-5.332 11.89-11.891 11.89-2.015 0-3.991-.512-5.747-1.487l-6.246 1.638zm5.836-5.046c1.656.984 3.279 1.484 4.964 1.484 5.422 0 9.835-4.413 9.835-9.835 0-2.628-1.022-5.1-2.871-6.951-1.848-1.847-4.331-2.87-6.964-2.87-5.422 0-9.835 4.413-9.835 9.835 0 1.904.537 3.74 1.554 5.31l-.995 3.634 3.671-.962zm10.103-6.887c-.198-.1-1.174-.58-1.356-.646-.182-.065-.315-.1-.448.1-.133.199-.513.646-.629.779-.117.133-.232.15-.429.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.117-.198-.013-.304.087-.403.09-.089.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.448-1.08-.614-1.482-.162-.389-.326-.335-.448-.341-.117-.005-.252-.006-.388-.006-.136 0-.356.05-.542.253-.187.203-.712.696-.712 1.697 0 1.002.728 1.97.83 2.103.101.133 1.43 2.184 3.465 3.063.483.209.86.335 1.154.428.484.154.925.132 1.273.08.388-.058 1.174-.48 1.34-.943.165-.463.165-.86.115-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                Agendar pelo WhatsApp
              </button>

              {content.doctoralia && (
                <a
                  href={content.doctoralia}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleDoctoraliaClick}
                  className="flex items-center justify-center gap-2 bg-[#4A90E2] hover:bg-[#357ABD] text-white font-bold px-7 py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
                >
                  Agendar no Doctoralia
                </a>
              )}

              <a
                href={PSICOMANAGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handlePsicomanagerClick}
                className="flex items-center justify-center gap-2 bg-[#6C63FF] hover:bg-[#574fd6] text-white font-bold px-7 py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
              >
                Agendar pelo PsicoManager
              </a>

              {/* Avaliação destaque */}
              <a
                href={`https://wa.me/5521971318289?text=${encodeURIComponent('Olá Dra. Fernanda, gostaria de informações sobre a Avaliação Neuropsicológica ' + (activeTab === 'online' ? 'online.' : activeTab === 'nova-friburgo' ? 'em Nova Friburgo.' : 'em Niterói.'))}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sendGAEvent(`agendar_avaliacao_neuropsicologica_${activeTab}`, 'agendamento', 'whatsapp')}
                className="flex items-center justify-center gap-2 bg-white border-2 border-[#4A5D4A] text-[#4A5D4A] hover:bg-[#4A5D4A] hover:text-white font-bold px-7 py-3.5 rounded-2xl transition-all text-sm active:scale-95"
              >
                Avaliação Neuropsicológica
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        <p>Dúvidas? Use o formulário de contato abaixo ou fale diretamente pelo WhatsApp.</p>
      </div>
    </div>
  );
};
