
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Alexandre Soldão',
    initials: 'AS',
    source: 'VIA GOOGLE',
    text: '"Comecei a me tratar com a Fernanda durante um período muito ruim, há cerca de 1 ano e 6 meses. Hoje me sinto bem melhor, entretanto continuo com o tratamento..."',
    stars: 5
  },
  {
    id: 2,
    name: 'Juliana Mendes',
    initials: 'JM',
    source: 'DOCTORALIA',
    text: '"Uma profissional incrível, atenciosa e muito competente. Me ajudou a passar por um momento de luto com muita humanidade."',
    stars: 5
  },
  {
    id: 3,
    name: 'Roberto Carlos',
    initials: 'RC',
    source: 'VIA GOOGLE',
    text: '"A terapia com a Dra. Fernanda mudou minha forma de encarar os desafios no trabalho. Recomendo muito!"',
    stars: 5
  }
];

export const Testimonials: React.FC = () => {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-serif text-white mb-4">O que dizem os pacientes</h2>
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${i === current ? 'bg-white' : 'bg-white/30'}`}
            ></div>
          ))}
        </div>
      </div>

      <div className="relative">
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 translate-x-1 md:-translate-x-12 p-3 bg-white/10 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          aria-label="Depoimento anterior"
        >
          <ChevronLeft size={28} />
        </button>

        <div className="bg-white p-10 md:p-16 rounded-[40px] shadow-2xl border border-white/10 text-center animate-fadeIn">
          <div className="flex justify-center mb-8">
            <div
              className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-[#4A5D4A] flex items-center justify-center"
              aria-label={testimonials[current].name}
            >
              <span className="text-white text-xl font-bold">{testimonials[current].initials}</span>
            </div>
          </div>

          <div className="flex justify-center gap-1 mb-6 text-yellow-400">
            {[...Array(testimonials[current].stars)].map((_, i) => (
              <Star key={i} size={20} fill="currentColor" />
            ))}
          </div>

          <p className="text-gray-600 font-serif italic text-lg md:text-xl leading-relaxed mb-8">
            {testimonials[current].text}
          </p>

          <h4 className="font-bold text-[#4A5D4A] text-lg uppercase tracking-wider mb-1">
            {testimonials[current].name}
          </h4>
          <span className="text-gray-400 text-xs font-bold">{testimonials[current].source}</span>
        </div>

        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1 md:translate-x-12 p-3 bg-white/10 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          aria-label="Próximo depoimento"
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </div>
  );
};
