
import React, { useState } from 'react';
import { Star, ChevronDown } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  initials: string;
  source: 'VIA GOOGLE' | 'DOCTORALIA' | 'VIA INSTAGRAM';
  profile: string;
  profileColor: string;
  text: string;
  stars: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Alexandre S.',
    initials: 'AS',
    source: 'VIA GOOGLE',
    profile: 'Ansiedade e Luto',
    profileColor: 'bg-[#E8F0E8] text-[#4A5D4A]',
    text: '"Comecei a me tratar com a Fernanda durante um período muito ruim, há cerca de 1 ano e 6 meses. Hoje me sinto bem melhor, entretanto continuo com o tratamento. Ela é uma excelente profissional — atenciosa, cuidadosa e muito competente."',
    stars: 5
  },
  {
    id: 2,
    name: 'Juliana M.',
    initials: 'JM',
    source: 'DOCTORALIA',
    profile: 'Luto',
    profileColor: 'bg-[#E8F0E8] text-[#4A5D4A]',
    text: '"Uma profissional incrível, atenciosa e muito competente. Me ajudou a passar por um momento de luto com muita humanidade. Recomendo de olhos fechados."',
    stars: 5
  },
  {
    id: 3,
    name: 'Roberto C.',
    initials: 'RC',
    source: 'VIA GOOGLE',
    profile: 'Desempenho Profissional',
    profileColor: 'bg-[#EEE8F5] text-[#6B4A8A]',
    text: '"A terapia com a Dra. Fernanda mudou minha forma de encarar os desafios no trabalho. Recomendo muito!"',
    stars: 5
  },
  {
    id: 4,
    name: 'Carla B.',
    initials: 'CB',
    source: 'VIA GOOGLE',
    profile: 'Mãe — Avaliação TDAH',
    profileColor: 'bg-[#E8EFF5] text-[#2E5F8A]',
    text: '"Levei meu filho para avaliação neuropsicológica com a Fernanda e finalmente tivemos respostas. O processo foi cuidadoso, claro e o laudo foi aceito pela escola sem questionamentos. Profissional excepcional."',
    stars: 5
  },
  {
    id: 5,
    name: 'Marcos T.',
    initials: 'MT',
    source: 'DOCTORALIA',
    profile: 'TDAH Adulto',
    profileColor: 'bg-[#EEE8F5] text-[#6B4A8A]',
    text: '"Descobri meu TDAH aos 34 anos com a ajuda da Fernanda. O diagnóstico mudou completamente minha relação com o trabalho e comigo mesmo. A avaliação foi rigorosa e o atendimento, muito humanizado."',
    stars: 5
  },
  {
    id: 6,
    name: 'Patrícia L.',
    initials: 'PL',
    source: 'VIA GOOGLE',
    profile: 'Burnout',
    profileColor: 'bg-[#F5EEE8] text-[#8A5A2E]',
    text: '"Cheguei completamente esgotada, sem conseguir trabalhar direito. A Fernanda me ajudou a entender o que estava acontecendo e a reconstruir minha rotina com mais saúde. Gratidão enorme."',
    stars: 5
  },
  {
    id: 7,
    name: 'Ana F.',
    initials: 'AF',
    source: 'VIA INSTAGRAM',
    profile: 'Mãe — TEA',
    profileColor: 'bg-[#E8EFF5] text-[#2E5F8A]',
    text: '"A avaliação do meu filho foi feita com muito cuidado e atenção. A Fernanda nos explicou cada etapa e o relatório final foi detalhado e claro. Nos deu o direcionamento que precisávamos para iniciar o tratamento."',
    stars: 5
  },
  {
    id: 8,
    name: 'Rodrigo V.',
    initials: 'RV',
    source: 'VIA GOOGLE',
    profile: 'Ansiedade',
    profileColor: 'bg-[#E8F0E8] text-[#4A5D4A]',
    text: '"Estava em crise de ansiedade quando comecei o atendimento online. Em poucos meses já conseguia gerenciar melhor meus pensamentos. A Fernanda tem uma escuta diferenciada e uma abordagem muito eficaz."',
    stars: 5
  }
];

const INITIAL_VISIBLE = 6;

export const Testimonials: React.FC = () => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? testimonials : testimonials.slice(0, INITIAL_VISIBLE);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <h2 className="text-4xl font-serif text-white mb-3">O que dizem os pacientes</h2>
        <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
          <span className="flex gap-0.5 text-yellow-400 text-base">
            {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
          </span>
          <span>4,8 · mais de 153 avaliações</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl p-8 shadow-xl border border-white/10 flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#4A5D4A] flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">{t.initials}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-[#3A4A3A] text-sm">{t.name}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${t.profileColor}`}>
                  {t.profile}
                </span>
              </div>
            </div>

            <div className="flex gap-0.5 text-yellow-400">
              {[...Array(t.stars)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
            </div>

            <p className="text-gray-600 font-serif italic text-sm leading-relaxed flex-1">
              {t.text}
            </p>

            <span className="text-gray-400 text-xs font-bold">{t.source}</span>
          </div>
        ))}
      </div>

      {!showAll && testimonials.length > INITIAL_VISIBLE && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-2 text-white/80 hover:text-white border border-white/30 hover:border-white/60 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200"
          >
            Ver todos os depoimentos
            <ChevronDown size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
