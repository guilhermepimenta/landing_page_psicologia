import React, { useState, lazy, Suspense } from 'react';
import { MapPin, Clock, ChevronDown, ChevronUp, CheckCircle, Phone, ExternalLink, ClipboardList, Brain, BookOpen, Briefcase, GraduationCap, Search, Star } from 'lucide-react';
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
  },
  {
    cidade:   'Nova Friburgo',
    endereco: 'Rua Dr. Ernesto Brasilio, 64 — sala 204',
    bairro:   'Centro — Nova Friburgo / RJ',
    horario:  'Consultar disponibilidade',
    maps:     'https://maps.google.com/?q=Rua+Dr.+Ernesto+Brasilio,+64,+sala+204,+Centro,+Nova+Friburgo,+RJ',
  },
];

const DEPOIMENTOS = [
  { texto: 'A Dra. Fernanda foi extremamente cuidadosa em todo o processo de avaliação do meu filho. O laudo foi detalhado e nos ajudou muito a entender como apoiá-lo melhor.', autor: 'Mãe de paciente, Niterói' },
  { texto: 'Processo acolhedor e muito profissional. Consegui finalmente entender as minhas dificuldades e ter o suporte adequado no trabalho.', autor: 'Paciente adulto, Nova Friburgo' },
  { texto: 'Recomendo muito. A devolutiva foi clara, humana e transformadora. Mudou a forma como enxergo meu filho.', autor: 'Pai de paciente, Niterói' },
];

const FAQS = [
  { p: 'Quantas sessões são necessárias?',                   r: 'Varia conforme o tipo de avaliação e o perfil do paciente. Em média, são 2 a 4 sessões de avaliação, além da entrevista inicial e da devolutiva.' },
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-bold text-[#4A5D4A] leading-tight">Fernanda Mangia</p>
          <p className="text-[11px] text-gray-500">Psicóloga · CRP 05/31299</p>
        </div>
        <a
          href={waGeral}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sendGAEvent('cta_header_whatsapp', 'avaliacao_landing', 'header')}
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-[13px] font-semibold px-3 py-2 rounded-full transition-colors"
        >
          <Phone size={14} />
          WhatsApp
        </a>
      </header>

      {/* espaço do header fixo */}
      <div className="h-[56px]" />

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-[#4A5D4A] to-[#3A4A3A] text-white px-4 pt-8 pb-10">
        {/* Badge prova social */}
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

        <h1 className="text-[28px] font-serif font-bold leading-tight mb-3">
          Avaliação Psicológica para crianças e adultos
        </h1>
        <p className="text-white/85 text-base leading-relaxed mb-2">
          TEA · TDAH · Dificuldades de aprendizagem e outras avaliações
        </p>
        <p className="text-white/70 text-sm mb-7">
          Presencial em Niterói e Nova Friburgo · Laudo completo
        </p>

        <a
          href={waGeral}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sendGAEvent('cta_hero_whatsapp', 'avaliacao_landing', 'hero')}
          className="block w-full bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white text-center font-bold text-base py-4 rounded-2xl shadow-lg transition-all mb-3"
        >
          Agendar pelo WhatsApp
        </a>
        <a
          href="#triagem"
          className="block w-full text-center text-white/80 text-sm py-2"
          onClick={() => sendGAEvent('cta_hero_triagem', 'avaliacao_landing', 'hero')}
        >
          Fazer triagem gratuita →
        </a>
      </section>

      {/* ── O QUE AVALIAMOS ── */}
      <section className="px-4 py-10 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-900 mb-1">O que avaliamos</h2>
        <p className="text-sm text-gray-500 mb-6">Avaliação completa com laudo técnico para cada caso</p>

        <div className="space-y-3">
          {AVALIACOES.map((av, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex gap-3 items-start shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-[#4A5D4A]/10 flex items-center justify-center text-[#4A5D4A] shrink-0">
                {av.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 leading-tight mb-1">{av.titulo}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{av.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <a
          href={waGeral}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sendGAEvent('cta_servicos_whatsapp', 'avaliacao_landing', 'servicos')}
          className="block w-full mt-6 bg-[#4A5D4A] text-white text-center font-semibold text-sm py-4 rounded-2xl"
        >
          Agendar minha avaliação
        </a>
      </section>

      {/* ── TRIAGEM ONLINE ── */}
      <section id="triagem" className="px-4 py-10 bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Não sabe se precisa de avaliação?</h2>
        <p className="text-sm text-gray-500 mb-6">
          Faça a triagem gratuita — leva 3 minutos e você recebe uma orientação
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {TRIAGENS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTriagem(t.id); sendGAEvent('triagem_iniciada', 'avaliacao_landing', t.id); }}
              className="flex flex-col items-center gap-2 bg-gray-50 border border-gray-200 hover:border-[#4A5D4A] hover:bg-[#4A5D4A]/5 active:scale-[0.97] rounded-2xl p-4 transition-all"
            >
              <span className="text-2xl">{t.emoji}</span>
              <span className="text-xs font-semibold text-gray-800 text-center leading-tight">{t.label}</span>
              <span className="text-[11px] text-[#4A5D4A] font-medium">Iniciar →</span>
            </button>
          ))}
        </div>

        <p className="text-[11px] text-gray-400 text-center">
          A triagem é orientativa e não substitui avaliação profissional
        </p>
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

      {/* ── COMO FUNCIONA ── */}
      <section className="px-4 py-10 bg-[#4A5D4A]/5">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Como funciona a avaliação</h2>

        <div className="space-y-4">
          {PASSOS.map((p) => (
            <div key={p.n} className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-full bg-[#4A5D4A] text-white font-bold text-sm flex items-center justify-center shrink-0">
                {p.n}
              </div>
              <div className="pt-1">
                <p className="text-sm font-semibold text-gray-900 mb-0.5">{p.titulo}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ONDE ATENDEMOS ── */}
      <section className="px-4 py-10 bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Onde atendemos</h2>
        <p className="text-sm text-gray-500 mb-6">A avaliação é sempre presencial</p>

        <div className="space-y-4">
          {UNIDADES.map((u, i) => (
            <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="bg-[#4A5D4A] px-4 py-2.5">
                <p className="text-white font-semibold text-sm">📍 {u.cidade}</p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex gap-2 items-start">
                  <MapPin size={14} className="text-[#4A5D4A] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.endereco}</p>
                    <p className="text-xs text-gray-500">{u.bairro}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Clock size={14} className="text-[#4A5D4A] shrink-0" />
                  <p className="text-xs text-gray-600">{u.horario}</p>
                </div>
                <a
                  href={u.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sendGAEvent('maps_click', 'avaliacao_landing', u.cidade)}
                  className="inline-flex items-center gap-1.5 mt-1 text-[#4A5D4A] text-xs font-semibold"
                >
                  <ExternalLink size={12} />
                  Ver no Google Maps
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-800 leading-relaxed">
            ⚠️ A avaliação psicológica exige encontros presenciais para garantir a validade científica e ética do laudo.
          </p>
        </div>
      </section>

      {/* ── INVESTIMENTO ── */}
      <section className="px-4 py-10 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Investimento</h2>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-[#4A5D4A]" />
            <p className="text-sm text-gray-800">Atendimento particular</p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-[#4A5D4A]" />
            <p className="text-sm text-gray-800">Nota fiscal emitida</p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-[#4A5D4A]" />
            <p className="text-sm text-gray-800">Possibilidade de reembolso pelo plano de saúde</p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-red-400" />
            <p className="text-sm text-gray-800">Não aceita convênio diretamente</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          O valor varia conforme o tipo de avaliação e número de sessões.
        </p>

        <a
          href={waValores}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sendGAEvent('cta_valores_whatsapp', 'avaliacao_landing', 'investimento')}
          className="block w-full mt-4 border-2 border-[#4A5D4A] text-[#4A5D4A] text-center font-semibold text-sm py-4 rounded-2xl"
        >
          Consultar valores pelo WhatsApp
        </a>
      </section>

      {/* ── PROVA SOCIAL ── */}
      <section className="px-4 py-10 bg-white">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
            <p className="text-2xl font-bold text-[#4A5D4A]">5,0</p>
            <p className="text-[10px] text-yellow-500 font-bold">★★★★★</p>
            <p className="text-[10px] text-gray-500 mt-0.5">153 avaliações</p>
            <p className="text-[10px] text-gray-400">Doctoralia</p>
          </div>
          <div className="flex-1 bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
            <p className="text-2xl font-bold text-[#4A5D4A]">5,0</p>
            <p className="text-[10px] text-yellow-500 font-bold">★★★★★</p>
            <p className="text-[10px] text-gray-500 mt-0.5">23 avaliações</p>
            <p className="text-[10px] text-gray-400">Google</p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-3 w-max pb-2">
            {DEPOIMENTOS.map((d, i) => (
              <div key={i} className="w-[280px] shrink-0 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-yellow-400 text-sm mb-2">★★★★★</p>
                <p className="text-xs text-gray-700 leading-relaxed mb-3 italic">"{d.texto}"</p>
                <p className="text-[11px] text-gray-500 font-medium">— {d.autor}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUEM É FERNANDA ── */}
      <section className="px-4 py-10 bg-[#4A5D4A]/5">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quem é Fernanda Mangia</h2>

        <div className="flex gap-4 items-start mb-5">
          <picture>
            <source srcSet="/assets/image.webp" type="image/webp" />
            <source srcSet="/assets/image.jpg"  type="image/jpeg" />
            <img
              src="/assets/image.jpg"
              alt="Fernanda Abreu Mangia — Psicóloga"
              width="80"
              height="80"
              className="w-20 h-20 rounded-2xl object-cover shrink-0"
              loading="lazy"
            />
          </picture>
          <div>
            <p className="text-base font-bold text-gray-900">Fernanda Abreu Mangia</p>
            <p className="text-sm text-[#4A5D4A] font-medium">Psicóloga · CRP 05/31299</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {[
            'Mestre em Saúde Coletiva — UFF',
            'Especialista em TCC e Terapia do Esquema',
            'Avaliação psicológica de crianças e adultos',
            'Atendimento em Niterói (Icaraí) e Nova Friburgo',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle size={15} className="text-[#4A5D4A] mt-0.5 shrink-0" />
              <p className="text-sm text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FORMULÁRIO ── */}
      <section className="px-4 py-10 bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Agende sua avaliação</h2>
        <p className="text-sm text-gray-500 mb-6">Resposta em até 24h pelo WhatsApp</p>

        {enviado ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
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
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/40 bg-gray-50"
            />
            <input
              type="tel"
              required
              placeholder="WhatsApp (com DDD)"
              value={form.whatsapp}
              onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/40 bg-gray-50"
            />
            <select
              required
              value={form.paraQuem}
              onChange={e => setForm(f => ({ ...f, paraQuem: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4A5D4A]/40 bg-gray-50 text-gray-700"
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
          className="block w-full bg-green-500 hover:bg-green-600 text-white text-center font-semibold text-sm py-4 rounded-2xl"
        >
          💬 Falar pelo WhatsApp agora
        </a>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 py-10 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Perguntas frequentes</h2>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-4 text-left"
                onClick={() => setFaqAberto(faqAberto === i ? null : i)}
              >
                <span className="text-sm font-semibold text-gray-900 pr-3 leading-snug">{faq.p}</span>
                {faqAberto === i
                  ? <ChevronUp size={16} className="text-[#4A5D4A] shrink-0" />
                  : <ChevronDown size={16} className="text-gray-400 shrink-0" />
                }
              </button>
              {faqAberto === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{faq.r}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-4 py-10 bg-[#4A5D4A] text-white text-center">
        <h2 className="text-xl font-bold mb-2">Pronto para agendar?</h2>
        <p className="text-white/80 text-sm mb-6 leading-relaxed">
          Entre em contato pelo WhatsApp e tire todas as suas dúvidas antes de agendar.
        </p>
        <a
          href={waGeral}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => sendGAEvent('cta_final_whatsapp', 'avaliacao_landing', 'footer_cta')}
          className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold text-base py-4 rounded-2xl shadow-lg mb-4"
        >
          Agendar pelo WhatsApp
        </a>
        <p className="text-white/60 text-xs">Fernanda Mangia · Psicóloga · CRP 05/31299</p>
        <p className="text-white/60 text-xs">Niterói e Nova Friburgo · RJ</p>
      </section>

      {/* ── WHATSAPP FLUTUANTE ── */}
      <a
        href={waGeral}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => sendGAEvent('cta_flutuante_whatsapp', 'avaliacao_landing', 'floating')}
        aria-label="Agendar pelo WhatsApp"
        className="fixed bottom-5 right-4 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 active:scale-95 rounded-full shadow-xl flex items-center justify-center transition-all"
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
