
import React, { useState } from 'react';
import { Star, ChevronDown } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  initials: string;
  time: string;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Juliana Claudino',
    initials: 'JC',
    time: '7 meses atrás',
    text: 'Conheci Fernanda através de um aplicativo num momento bem delicado da minha vida. Tenho aprendido lidar com meus conflitos e me reconhecer nessas diferentes etapas. Fernanda foi essencial nessa jornada para a minha evolução pessoal.',
  },
  {
    id: 2,
    name: 'Bianca L. Targhetta',
    initials: 'BL',
    time: '7 meses atrás',
    text: 'A Fernanda é uma excelente profissional, atenciosa e assertiva. Já passo em consulta há alguns anos e estou satisfeita com o atendimento que recebo.',
  },
  {
    id: 3,
    name: 'Alexandra Soilho',
    initials: 'AS',
    time: '1 ano atrás',
    text: 'Comecei a me tratar com a Fernanda durante um período muito ruim, acerca de 1 ano e 6 meses. Hoje me sinto bem melhor, entretanto, continuo com o tratamento. Recomendo-a fortemente pela sua forma atenciosa e acolhedora, e sobretudo pela sua capacidade de me ajudar a expressar de forma clara meus sentimentos.',
  },
  {
    id: 4,
    name: 'Gabriela C. Marques',
    initials: 'GM',
    time: '1 ano atrás',
    text: 'Eu me consulto com a Fernanda há mais de 2 anos e foi a única psicóloga que me senti à vontade o suficiente para ficar por tanto tempo. Ela é extremamente atenciosa e uma profissional maravilhosa! Consegui me desenvolver muito emocionalmente nesses mais de 2 anos e sou grata a ela por isso. Não poderia indicar mais!',
  },
  {
    id: 5,
    name: 'Taís Freitas',
    initials: 'TF',
    time: '1 ano atrás',
    text: 'Excelente profissional! Atenciosa e competente. Conheci por indicação de uma amiga também paciente e só tenho elogios a fazer.',
  },
  {
    id: 6,
    name: 'Elisa Bragança',
    initials: 'EB',
    time: '7 meses atrás',
    text: 'Ótima profissional! Atenciosa e competente!',
  },
  {
    id: 7,
    name: 'Manoela Maria',
    initials: 'MM',
    time: '1 ano atrás',
    text: 'A experiência de ser atendida pela Fernanda é sensacional. Ótima profissional e com um excelente profissionalismo.',
  },
  {
    id: 8,
    name: 'Anna Castro',
    initials: 'AC',
    time: '1 ano atrás',
    text: 'Uma maravilha ser atendida com tamanha atenção e gentileza pela Fernanda! Recomendo muito o trabalho dela.',
  },
  {
    id: 9,
    name: 'Sabrina F. Silva',
    initials: 'SF',
    time: '3 anos atrás',
    text: 'Estava com muitas questões e dúvidas profissionais, a melhor decisão foi procurar ajuda. Fernanda é muito atenciosa e paciente, realmente dedica tempo às análises e aos detalhes. Gostaria muito de ter tido essa orientação antes!',
  },
  {
    id: 10,
    name: 'Ana Paula Armelin',
    initials: 'AP',
    time: '4 anos atrás',
    text: 'É muito importante uma sessão com um psicólogo, pois auxilia na busca do autoconhecimento, de relembrar quem foi e de saber quem é hoje. A Fernanda tem me ajudado muito nisto! Além de ser uma profissional muito bem qualificada, ela possui muita sensibilidade em suas palavras. Recomendo.',
  },
  {
    id: 11,
    name: 'Izabella Pestana',
    initials: 'IP',
    time: '1 ano atrás',
    text: 'Eu não sei nem como descrever o quão ela é boa atendendo. Ela te ouve, te traz soluções com imparcialidade e realmente quer te ajudar... É incrível, recomendo demais.',
  },
  {
    id: 12,
    name: 'Jaqueline Paula',
    initials: 'JP',
    time: '1 ano atrás',
    text: 'Uma profissional de excelência, trata seus pacientes com muito cuidado, direcionando de uma forma cautelosa me deixando completamente tranquila.',
  },
  {
    id: 13,
    name: 'Ana Luísa Vila',
    initials: 'AV',
    time: '1 ano atrás',
    text: 'Uma ótima profissional, muito atenciosa e prestativa.',
  },
  {
    id: 14,
    name: 'Beatriz Teixeira Silva',
    initials: 'BT',
    time: '7 meses atrás',
    text: 'Excelente profissional!',
  },
  {
    id: 15,
    name: 'Ana Carolina',
    initials: 'AC',
    time: '4 anos atrás',
    text: 'Excelente profissional, super indico! Fiz minha avaliação psicológica com ela e amei.',
  },
];

const INITIAL_VISIBLE = 6;

export const Testimonials: React.FC = () => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? testimonials : testimonials.slice(0, INITIAL_VISIBLE);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <h2 className="text-4xl font-serif text-white mb-3">O que dizem os pacientes</h2>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-white/80 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="flex gap-0.5 text-yellow-400 text-base">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
            </span>
            <span>5,0 · 23 avaliações no Google</span>
          </span>
          <span className="text-white/30 hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <span className="flex gap-0.5 text-yellow-400 text-base">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
            </span>
            <span>5,0 · 153 avaliações no Doctoralia</span>
          </span>
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
              <div>
                <span className="font-bold text-[#3A4A3A] text-sm block">{t.name}</span>
                <span className="text-xs text-gray-400">{t.time}</span>
              </div>
            </div>

            <div className="flex gap-0.5 text-yellow-400">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
            </div>

            <p className="text-gray-600 font-serif italic text-sm leading-relaxed flex-1">
              "{t.text}"
            </p>

            <span className="text-gray-400 text-xs font-bold">VIA GOOGLE</span>
          </div>
        ))}
      </div>

      {!showAll && testimonials.length > INITIAL_VISIBLE && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-2 text-white/80 hover:text-white border border-white/30 hover:border-white/60 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200"
          >
            Ver todos os depoimentos ({testimonials.length})
            <ChevronDown size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
