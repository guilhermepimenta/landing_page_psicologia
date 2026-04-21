import React from 'react';
import { GraduationCap, Brain, ClipboardCheck, Monitor, MapPin, ShieldCheck } from 'lucide-react';

const credentials = [
  { icon: <GraduationCap size={16} />, text: 'Mestra em Saúde Coletiva · UFF' },
  { icon: <Brain size={16} />, text: 'Especialista em TCC e Terapia do Esquema' },
  { icon: <ClipboardCheck size={16} />, text: 'Avaliação Psicológica e Neuropsicológica' },
  { icon: <Monitor size={16} />, text: 'Online e Presencial' },
  { icon: <MapPin size={16} />, text: 'Niterói · Nova Friburgo' },
  { icon: <ShieldCheck size={16} />, text: 'CRP 05/31299' },
];

export const AuthorityBar: React.FC = () => {
  return (
    <div className="bg-[#3A4A3A] py-4 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:gap-x-10">
          {credentials.map((item, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2 text-white/80 text-xs md:text-sm font-medium">
                <span className="text-[#B4C2B4] shrink-0">{item.icon}</span>
                <span>{item.text}</span>
              </div>
              {i < credentials.length - 1 && (
                <span className="hidden md:block w-px h-4 bg-white/20 shrink-0" aria-hidden="true" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
