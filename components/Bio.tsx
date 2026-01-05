
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const Bio: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 md:mb-32">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row -mt-16 md:-mt-24 relative z-20 border border-gray-100">
        {/* Photo Column */}
        <div className="md:w-1/3 bg-[#F0EFEB] p-8 flex flex-col items-center justify-center">
          <div className="relative group">
            <img
              src="/assets/image.png"
              alt="Fernanda Abreu Mangia"
              className="w-full h-auto rounded-2xl shadow-lg transition-transform duration-500 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 rounded-2xl border-2 border-[#B4C2B4] transform translate-x-4 translate-y-4 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-all"></div>
          </div>
          <a
            href="https://www.doctoralia.com.br/fernanda-abreu-mangia/psicologo/niteroi"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 bg-gray-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors inline-block"
          >
            Ver perfil no Doctoralia
          </a>
        </div>

        {/* Text Column */}
        <div className="md:w-2/3 p-8 md:p-12 lg:p-16">
          <p className="text-gray-600 mb-6 leading-relaxed">
            Olá, sou psicóloga clínica, com mestrado em Saúde Coletiva pela UFF, <span className="font-bold">especialista em Psicologia Clínica e em Psicologia da Saúde.</span>
          </p>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Atualmente trabalho com a <span className="text-[#4A5D4A] font-semibold">Terapia Cognitivo-Comportamental</span> e <span className="text-[#4A5D4A] font-semibold">Terapia do Esquema</span>, buscando uma abordagem integral desde a infância até os momentos atuais, de acordo com a demanda de cada um.
          </p>

          <p className="text-gray-600 mb-8 leading-relaxed italic">
            Tenho experiência no atendimento a crianças, adolescentes, adultos e idosos. Realizo Orientação Vocacional/Profissional e Avaliação Neuropsicológica.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-gray-700">
              <CheckCircle2 className="text-[#B4C2B4]" size={20} />
              <span>Atendimentos online e presencial.</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <CheckCircle2 className="text-[#B4C2B4]" size={20} />
              <span>Agenda de segunda à sexta, aos sábados à combinar.</span>
            </div>
          </div>

          <p className="text-[#4A5D4A] font-serif italic text-xl">
            "Entre em contato, será um prazer apresentar o meu trabalho!"
          </p>
        </div>
      </div>
    </div>
  );
};
