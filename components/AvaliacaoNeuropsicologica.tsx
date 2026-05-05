import React, { useState, lazy, Suspense } from 'react';
import { MapPin, Clock, ChevronDown, ChevronUp, CheckCircle, Phone, ExternalLink, ClipboardList, Brain, BookOpen, Briefcase, GraduationCap, Search, Star, X } from 'lucide-react';
import { useWhatsAppUrl } from '../utils/useWhatsAppUrl';
import { sendGAEvent } from '../utils/analytics';

const ScreeningTest = lazy(() =>
  import('./ScreeningTest').then(m => ({ default: m.ScreeningTest }))
);

// ─── Dados ────────────────────────────────────────────────────

const WHATSAPP_MSG_GERAL   = 'Olá Fernanda, vim pelo site e gostaria de agendar uma avaliação psicológica.';
const WHATSAPP_MSG_VALORES = 'Olá Fernanda, gostaria de saber mais sobre os valores da avaliação psicológica.';

const AVALIACOES = [
  {
    icon: <Search size={22} />,
    titulo: 'Transtorno do Espectro Autista (TEA)',
    desc:   'Avaliação diagnóstica criteriosa para crianças e adultos com suspeita de autismo.',
  },
  {
    icon: <Brain size={22} />,
    titulo: 'TDAH — Transtorno de Atenção e Hiperatividade',
    desc:   'Avaliação completa com laudo clínico para crianças e adultos.',
  },
  {
    icon: <BookOpen size={22} />,
    titulo: 'Dificuldades de Aprendizagem',
    desc:   'Dislexia, discalculia, problemas de leitura, escrita e raciocínio.',
  },
  {
    icon: <ClipboardList size={22} />,
    titulo: 'Avaliação Cognitiva e de Memória',
    desc:   'Atenção, raciocínio, memória, linguagem e funções executivas.',
  },
  {
    icon: <Briefcase size={22} />,
    titulo: 'Saúde Mental no Trabalho',
    desc:   'Avaliação de capacidade laborativa, burnout e estresse ocupacional.',
  },
  {
    icon: <GraduationCap size={22} />,
    titulo: 'Orientação Vocacional',
    desc:   'Mapeamento de habilidades, interesses e potencial para escolha profissional.',
  },
];

const TRIAGENS = [
  { id: 'tea',       label: 'TEA / Autismo',    emoji: '🔍' },
  { id: 'tdah',      label: 'TDAH',             emoji: '🎯' },
  { id: 'ansiedade', label: 'Ansiedade',         emoji: '😰' },
  { id: 'depressao', label: 'Depressão',         emoji: '🧠' },
] as const;

type TriagemId = typeof TRIAGENS[number]['id'];

const PASSOS = [
  { n: '1', titulo: 'Contato inicial',       desc: 'Fale pelo WhatsApp — apresentamos o processo e verificamos a indicação para o seu caso.' },
  { n: '2', titulo: 'Anamnese',              desc: 'Entrevista clínica presencial detalhada com o paciente e/ou responsável.' },
  { n: '3', titulo: 'Sessões de avaliação',  desc: 'Bateria de testes científicos validados. O número de sessões varia conforme o caso.' },
  { n: '4', titulo: 'Laudo + devolutiva',    desc: 'Relatório técnico completo, entregue e explicado pessoalmente.' },
];

const UNIDADES = [
  {
    cidade:   'Niterói',
    endereco: 'Rua Mem de Sá, 34',
    bairro:   'Icaraí — Niterói / RJ',
    horario:  'Seg a sex · Sábados a combinar',
    maps:     'https://maps.google.com/?q=Rua+Mem+de+Sá,+34,+Icaraí,+Niterói,+RJ',
    embed:    'https://maps.google.com/maps?q=Rua+Mem+de+Sá+34+Icaraí+Niterói+RJ&output=embed&z=17',
  },
  {
    cidade:   'Nova Friburgo',
    endereco: 'Rua Dr. Ernesto Brasilio, 64 — sala 204',
    bairro:   'Centro — Nova Friburgo / RJ',
    horario:  'Consultar disponibilidade',
    maps:     'https://maps.google.com/?q=Rua+Dr.+Ernesto+Brasilio,+64,+sala+204,+Centro,+Nova+Friburgo,+RJ',
    embed:    'https://maps.google.com/maps?q=Rua+Dr+Ernesto+Brasilio+64+Centro+Nova+Friburgo+RJ&output=embed&z=17',
  },
];

const DEPOIMENTOS = [
  {
    texto:  'Consulta muito boa, local organizado, ótima profissional, testes efetivos e de boa avaliação.',
    autor:  'R.S.N.',
    fonte:  'Doctoralia',
  },
  {
    texto:  'Dra Fernanda está atendendo meu filho e ele adora estar com ela. É sempre muito atenciosa e pontual.',
    autor:  'I.',
    fonte:  'Doctoralia',
  },
  {
    texto:  'Excelente profissional. Me sinto muito acolhida e hoje suas sessões são determinantes para que eu alcance o equilíbrio. Super indico!!',
    autor:  'L.M.',
    fonte:  'Doctoralia',
  },
];

const FAQS = [
  { p: 'Quantas sessões são necessárias?',                   r: 'O número de sessões é definido caso a caso, conforme a demanda e os testes necessários para cada perfil. Além das sessões de avaliação em si, há a entrevista inicial e a devolutiva.' },
  { p: 'A avaliação é presencial?',                          r: 'Sim, sempre presencial — nas unidades de Niterói (Icaraí) ou Nova Friburgo. A validade científica e ética do laudo exige a presença do paciente.' },
  { p: 'Aceita plano de saúde?',                             r: 'O atendimento é particular. Emitimos nota fiscal, e muitos planos permitem solicitar reembolso parcial — consulte as condições do seu plano.' },
  { p: 'O que está incluído no laudo?',                      r: 'Relatório técnico completo com resultados dos testes, hipóteses diagnósticas, recomendações clínicas e educacionais, e orientações para escola ou trabalho quando necessário.' },
  { p: 'Qual a faixa etária atendida?',                      r: 'Crianças a partir de 4 anos, adolescentes e adultos.' },
  { p: 'Qual a diferença entre avaliação e psicoterapia?',   r: 'A avaliação psicológica é um processo diagnóstico com início, meio e fim, que resulta em um laudo. A psicoterapia é um processo terapêutico contínuo. São complementares.' },
  { p: 'Posso pedir reembolso ao meu plano de saúde?',       r: 'Sim, é possível solicitar reembolso à maioria dos planos com nota fiscal. O valor reembolsado depende das regras do seu plano.' },
];

// ─── Componente principal ─────────────────────────────────────

const AvaliacaoNeuropsicologica: React.FC = () => {
  const waGeral   = useWhatsAppUrl('Avaliacao Landing - Geral',   WHATSAPP_MSG_GERAL);
  const waValores = useWhatsAppUrl('Avaliacao Landing - Valores',  WHATSAPP_MSG_VALORES);

  const [triagem, setTriagem]     = useState<TriagemId | null>(null);
  const [faqAberto, setFaqAberto] = useState<number | null>(null);
  const [mapAberto, setMapAberto] = useState<number | null>(null);
  const [form, setForm]           = useState({ nome: '', whatsapp: '', paraQuem: '' });
  const [enviando, setEnviando]   = useState(false);
  const [enviado, setEnviado]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const { leadsService } = await import('../services/firebaseService');
      await leadsService.create({
        name:    form.nome,
        phone:   form.whatsapp,
        source:  'avaliacao_landing',
        message: form.paraQuem,
      });
      sendGAEvent('lead_avaliacao', 'avaliacao_landing', 'formulario');
      setEnviado(true);
    } catch {
      // silently fail — WhatsApp é o canal principal
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans">

      {/* ── HEADER MÍNIMO ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] sm:text-sm font-bold text-[#4A5D4A] leading-tight">Fernanda Mangia</p>
            <p className="text-[11px] sm:text-xs text-gray-500">Psicóloga · CRP 05/31299</p>
          </div>
          <a
            href={waGeral}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sendGAEvent('cta_header_whatsapp', 'avaliacao_landing', 'header')}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-[13px] sm:text-sm font-semibold px-3 sm:px-5 py-2 rounded-full transition-colors"
          >
            <Phone size={14} />
            <span>WhatsApp</span>
          </a>
        </div>
      </header>

      {/* espaço do header fixo */}
      <div className="h-[56px]" />

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-[#4A5D4A] to-[#3A4A3A] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-12 md:pt-16 md:pb-20">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="inline-flex items-center gap-1 bg-white/15 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              5,0 · 153 avaliações Doctoralia
            </span>
            <span className="inline-flex items-center gap-1 bg-white/15 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              5,0 · 23 avaliações Google
            </span>
          </div>

          <div className="md:grid md:grid-cols-[1fr_auto] md:gap-12 md:items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold leading-tight mb-4">
                Avaliação Psicológica para crianças e adultos
              </h1>
              <p className="text-white/85 text-base md:text-lg leading-relaxed mb-2">
                TEA · TDAH · Dificuldades de aprendizagem e outras avaliações
              </p>
              <p className="text-white/70 text-sm md:text-base mb-8">
                Presencial em Niterói e Nova Friburgo · Laudo completo
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={waGeral}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sendGAEvent('cta_hero_whatsapp', 'avaliacao_landing', 'hero')}
                  className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white text-center font-bold text-base px-8 py-4 rounded-2xl shadow-lg transition-all"
                >
                  Agendar pelo WhatsApp
                </a>
                <a
                  href="#triagem"
                  className="flex-1 sm:flex-none text-center border border-white/30 hover:border-white/60 text-white/85 hover:text-white text-sm sm:text-base font-medium px-6 py-4 rounded-2xl transition-colors"
                  onClick={() => sendGAEvent('cta_hero_triagem', 'avaliacao_landing', 'hero')}
                >
                  Fazer triagem gratuita →
                </a>
              </div>
            </div>

            {/* Credenciais — visível só em desktop */}
            <div className="hidden md:flex flex-col gap-3 min-w-[220px]">
              {[
                'Mestre em Saúde Coletiva — UFF',
                'Especialista em TCC e Terapia do Esquema',
                'Avaliação de crianças e adultos',
                'Niterói e Nova Friburgo',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-white/80">
                  <CheckCircle size={15} className="text-green-400 mt-0.5 shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── O QUE AVALIAMOS ── */}
      <section className="bg-[#EDE8DF] py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">O que avaliamos</h2>
          <p className="text-sm md:text-base text-gray-600 mb-8">Avaliação completa com laudo técnico para cada caso</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVALIACOES.map((av, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 flex gap-3 items-start shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-[#4A5D4A]/10 flex items-center justify-center text-[#4A5D4A] shrink-0">
                  {av.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 leading-tight mb-1">{av.titulo}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{av.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <a
              href={waGeral}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sendGAEvent('cta_servicos_whatsapp', 'avaliacao_landing', 'servicos')}
              className="inline-block bg-[#4A5D4A] hover:bg-[#3A4A3A] text-white text-center font-semibold text-sm md:text-base px-10 py-4 rounded-2xl transition-colors shadow-md"
            >
              Agendar minha avaliação
            </a>
          </div>
        </div>
      </section>

      {/* ── TRIAGEM ONLINE ── */}
      <section id="triagem" className="bg-white py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Não sabe se precisa de avaliação?</h2>
          <p className="text-sm md:text-base text-gray-500 mb-8">
            Faça a triagem gratuita — leva 3 minutos e você recebe uma orientação
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {TRIAGENS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTriagem(t.id); sendGAEvent('triagem_iniciada', 'avaliacao_landing', t.id); }}
                className="flex flex-col items-center gap-2 bg-gray-50 border border-gray-200 hover:border-[#4A5D4A] hover:bg-[#4A5D4A]/5 active:scale-[0.97] rounded-2xl p-5 transition-all group cursor-pointer"
              >
                <span className="text-3xl">{t.emoji}</span>
                <span className="text-xs md:text-sm font-semibold text-gray-800 text-center leading-tight">{t.label}</span>
                <span className="text-[11px] md:text-xs text-[#4A5D4A] font-medium">Iniciar →</span>
              </button>
            ))}
          </div>

          <p className="text-[11px] md:text-xs text-gray-400 text-center">
            A triagem é orientativa e não substitui avaliação profissional
          </p>
        </div>
      </section>

      {/* Modal de triagem */}
      {triagem && (
        <Suspense fallback={null}>
          <ScreeningTest
            testId={triagem}
            onClose={() => setTriagem(null)}
          />
        </Suspense>
      )}

      {/* Modal de mapa */}
      {mapAberto !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setMapAberto(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden w-full max-w-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-900 text-sm">📍 {UNIDADES[mapAberto].cidade}</p>
                <p className="text-xs text-gray-500 mt-0.5">{UNIDADES[mapAberto].endereco} · {UNIDADES[mapAberto].bairro}</p>
              </div>
              <button
                onClick={() => setMapAberto(null)}
                className="text-gray-400 hover:text-gray-600 ml-4 shrink-0"
                aria-label="Fechar mapa"
              >
                <X size={20} />
              </button>
            </div>
            <iframe
              src={UNIDADES[mapAberto].embed}
              width="100%"
              height="320"
              className="border-0 block"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Mapa do consultório em ${UNIDADES[mapAberto].cidade}`}
            />
            <div className="px-5 py-3 flex justify-center border-t border-gray-100">
              <a
                href={UNIDADES[mapAberto].maps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#4A5D4A] font-semibold hover:text-[#3A4A3A] transition-colors"
              >
                <ExternalLink size={12} />
                Abrir no Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── COMO FUNCIONA ── */}
      <section className="bg-[#4A5D4A] py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Como funciona a avaliação</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PASSOS.map((p) => (
              <div key={p.n} className="flex md:flex-col gap-4 md:gap-3 items-start md:items-start">
                <div className="w-10 h-10 rounded-full bg-white text-[#4A5D4A] font-bold text-base flex items-center justify-center shrink-0">
                  {p.n}
                </div>
                <div>
                  <p className="text-sm md:text-base font-semibold text-white mb-1">{p.titulo}</p>
                  <p className="text-xs md:text-sm text-white/70 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ONDE ATENDEMOS ── */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Onde atendemos</h2>
          <p className="text-sm md:text-base text-gray-500 mb-8">A avaliação é sempre presencial</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {UNIDADES.map((u, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-[#4A5D4A] px-5 py-3">
                  <p className="text-white font-semibold text-sm md:text-base">📍 {u.cidade}</p>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex gap-2 items-start">
                    <MapPin size={16} className="text-[#4A5D4A] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm md:text-base font-medium text-gray-900">{u.endereco}</p>
                      <p className="text-xs md:text-sm text-gray-500">{u.bairro}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Clock size={16} className="text-[#4A5D4A] shrink-0" />
                    <p className="text-xs md:text-sm text-gray-600">{u.horario}</p>
                  </div>
                  <button
                    onClick={() => { setMapAberto(i); sendGAEvent('maps_click', 'avaliacao_landing', u.cidade); }}
                    className="inline-flex items-center gap-1.5 mt-1 text-[#4A5D4A] hover:text-[#3A4A3A] text-xs md:text-sm font-semibold transition-colors"
                  >
                    <MapPin size={13} />
                    Ver no mapa
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5">
            <p className="text-xs md:text-sm text-amber-800 leading-relaxed">
              ⚠️ A avaliação psicológica exige encontros presenciais para garantir a validade científica e ética do laudo.
            </p>
          </div>
        </div>
      </section>

      {/* ── INVESTIMENTO ── */}
      <section className="bg-[#EDE8DF] py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Investimento</h2>

          <div className="md:grid md:grid-cols-[1fr_auto] md:gap-8 md:items-start">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm mb-5 md:mb-0">
              {[
                { ok: true,  text: 'Atendimento particular' },
                { ok: true,  text: 'Nota fiscal emitida' },
                { ok: true,  text: 'Possibilidade de reembolso pelo plano de saúde' },
                { ok: false, text: 'Não aceita convênio diretamente' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={18} className={item.ok ? 'text-[#4A5D4A]' : 'text-red-400'} />
                  <p className="text-sm md:text-base text-gray-800">{item.text}</p>
                </div>
              ))}
              <p className="text-xs md:text-sm text-gray-500 pt-1">
                O valor varia conforme o tipo de avaliação e número de sessões.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:min-w-[260px]">
              <a
                href={waValores}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sendGAEvent('cta_valores_whatsapp', 'avaliacao_landing', 'investimento')}
                className="block text-center border-2 border-[#4A5D4A] text-[#4A5D4A] hover:bg-[#4A5D4A] hover:text-white font-semibold text-sm md:text-base px-6 py-4 rounded-2xl transition-colors"
              >
                Consultar valores pelo WhatsApp
              </a>
              <a
                href={waGeral}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sendGAEvent('cta_agendar_investimento', 'avaliacao_landing', 'investimento')}
                className="block text-center bg-[#4A5D4A] hover:bg-[#3A4A3A] text-white font-semibold text-sm md:text-base px-6 py-4 rounded-2xl transition-colors"
              >
                Agendar minha avaliação
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROVA SOCIAL ── */}
      <section className="bg-[#3A4A3A] py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Notas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/15">
              <p className="text-3xl md:text-4xl font-bold text-white">5,0</p>
              <p className="text-sm text-yellow-400 font-bold mt-0.5">★★★★★</p>
              <p className="text-xs text-white/60 mt-0.5">153 avaliações</p>
              <p className="text-xs text-white/40">Doctoralia</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 text-center border border-white/15">
              <p className="text-3xl md:text-4xl font-bold text-white">5,0</p>
              <p className="text-sm text-yellow-400 font-bold mt-0.5">★★★★★</p>
              <p className="text-xs text-white/60 mt-0.5">23 avaliações</p>
              <p className="text-xs text-white/40">Google</p>
            </div>
            <div className="hidden md:block bg-white/10 rounded-2xl p-4 text-center border border-white/15">
              <p className="text-3xl md:text-4xl font-bold text-white">+10</p>
              <p className="text-xs text-white/60 mt-1">anos de experiência</p>
            </div>
            <div className="hidden md:block bg-white/10 rounded-2xl p-4 text-center border border-white/15">
              <p className="text-3xl md:text-4xl font-bold text-white">NIT<br/>+FRI</p>
              <p className="text-xs text-white/60 mt-1">duas unidades</p>
            </div>
          </div>

          {/* Depoimentos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEPOIMENTOS.map((d, i) => (
              <div key={i} className="bg-white/10 rounded-2xl p-5 border border-white/15">
                <p className="text-yellow-400 text-sm mb-2">★★★★★</p>
                <p className="text-sm text-white/85 leading-relaxed mb-4 italic">"{d.texto}"</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/60 font-semibold">— {d.autor}</p>
                  <span className="text-[10px] text-white/40 bg-white/10 px-2 py-0.5 rounded-full">{d.fonte}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUEM É FERNANDA ── */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Quem é Fernanda Mangia</h2>

          <div className="md:flex md:gap-10 md:items-start">
            {/* Foto */}
            <div className="flex gap-4 items-start mb-6 md:mb-0 md:flex-col md:items-center md:min-w-[160px]">
              <picture>
                <source srcSet="/assets/image.webp" type="image/webp" />
                <source srcSet="/assets/image.jpg"  type="image/jpeg" />
                <img
                  src="/assets/image.jpg"
                  alt="Fernanda Abreu Mangia — Psicóloga"
                  width="120"
                  height="150"
                  className="w-24 h-24 md:w-36 md:h-36 rounded-2xl object-cover shrink-0 shadow-md"
                  loading="lazy"
                />
              </picture>
              <div className="md:text-center">
                <p className="text-base font-bold text-gray-900">Fernanda Abreu Mangia</p>
                <p className="text-sm text-[#4A5D4A] font-medium">Psicóloga · CRP 05/31299</p>
              </div>
            </div>

            {/* Credenciais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              {[
                'Mestre em Saúde Coletiva — UFF',
                'Especialista em TCC e Terapia do Esquema',
                'Avaliação psicológica de crianças e adultos',
                'Atendimento em Niterói (Icaraí) e Nova Friburgo',
                'Processos de avaliação criteriosos com laudo completo',
                'Devolutiva pessoal e humanizada para famílias e pacientes',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle size={15} className="text-[#4A5D4A] mt-0.5 shrink-0" />
                  <p className="text-sm md:text-base text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FORMULÁRIO ── */}
      <section className="bg-[#EDE8DF] py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="md:grid md:grid-cols-2 md:gap-12 md:items-start">
            {/* Texto de apoio — visível apenas no desktop */}
            <div className="hidden md:block">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Agende sua avaliação</h2>
              <p className="text-gray-500 mb-6">Resposta em até 24h pelo WhatsApp</p>
              <div className="space-y-4">
                {[
                  'Laudo técnico completo e reconhecido',
                  'Devolutiva pessoal com orientações',
                  'Presencial em Niterói e Nova Friburgo',
                  'Nota fiscal emitida',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle size={18} className="text-[#4A5D4A] mt-0.5 shrink-0" />
                    <p className="text-base text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulário */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1 md:hidden">Agende sua avaliação</h2>
              <p className="text-sm text-gray-500 mb-6 md:hidden">Resposta em até 24h pelo WhatsApp</p>

              {enviado ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                  <CheckCircle size={36} className="text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-green-800 mb-1">Mensagem recebida!</p>
                  <p className="text-sm text-green-700">Entraremos em contato em breve pelo WhatsApp.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Seu nome"
                    value={form.nome}
                    onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/40 bg-white"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp (com DDD)"
                    value={form.whatsapp}
                    onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/40 bg-white"
                  />
                  <select
                    required
                    value={form.paraQuem}
                    onChange={e => setForm(f => ({ ...f, paraQuem: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/40 bg-white text-gray-700"
                  >
                    <option value="">Para quem é a avaliação?</option>
                    <option value="filho_crianca">Para meu filho(a) — criança</option>
                    <option value="filho_adolescente">Para meu filho(a) — adolescente</option>
                    <option value="adulto_eu">Para mim (adulto)</option>
                    <option value="familiar_adulto">Para outro familiar adulto</option>
                  </select>

                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full bg-[#4A5D4A] hover:bg-[#3A4A3A] disabled:opacity-60 text-white font-bold text-base py-4 rounded-2xl transition-colors shadow-md"
                  >
                    {enviando ? 'Enviando...' : 'Quero agendar minha avaliação'}
                  </button>
                </form>
              )}

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <a
                href={waGeral}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sendGAEvent('cta_formulario_whatsapp', 'avaliacao_landing', 'formulario')}
                className="block w-full bg-green-500 hover:bg-green-600 text-white text-center font-semibold text-sm md:text-base py-4 rounded-2xl transition-colors"
              >
                💬 Falar pelo WhatsApp agora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#EDE8DF] py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Perguntas frequentes</h2>

          <div className="md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-2 md:mb-0">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setFaqAberto(faqAberto === i ? null : i)}
                >
                  <span className="text-sm md:text-base font-semibold text-gray-900 pr-3 leading-snug">{faq.p}</span>
                  {faqAberto === i
                    ? <ChevronUp size={16} className="text-[#4A5D4A] shrink-0" />
                    : <ChevronDown size={16} className="text-gray-400 shrink-0" />
                  }
                </button>
                {faqAberto === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">{faq.r}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="bg-[#4A5D4A] text-white py-14 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-3">Pronto para agendar?</h2>
          <p className="text-white/80 text-sm md:text-lg mb-8 leading-relaxed max-w-xl mx-auto">
            Entre em contato pelo WhatsApp e tire todas as suas dúvidas antes de agendar.
          </p>
          <a
            href={waGeral}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sendGAEvent('cta_final_whatsapp', 'avaliacao_landing', 'footer_cta')}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold text-base md:text-lg px-12 py-4 rounded-2xl shadow-lg transition-colors mb-6"
          >
            Agendar pelo WhatsApp
          </a>
          <p className="text-white/60 text-sm">Fernanda Mangia · Psicóloga · CRP 05/31299</p>
          <p className="text-white/60 text-sm">Niterói e Nova Friburgo · RJ</p>
        </div>
      </section>

      {/* ── WHATSAPP FLUTUANTE ── */}
      <a
        href={waGeral}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => sendGAEvent('cta_flutuante_whatsapp', 'avaliacao_landing', 'floating')}
        aria-label="Agendar pelo WhatsApp"
        className="fixed bottom-6 right-5 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 active:scale-95 rounded-full shadow-xl flex items-center justify-center transition-all"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.122 1.529 5.855L.057 23.215a.75.75 0 0 0 .928.928l5.36-1.472A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 0 1-4.964-1.364l-.355-.212-3.683 1.011 1.011-3.683-.212-.355A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
        </svg>
      </a>

    </div>
  );
};

export default AvaliacaoNeuropsicologica;
