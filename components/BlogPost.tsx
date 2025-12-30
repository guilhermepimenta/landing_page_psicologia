import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AIChatAssistant } from './AIChatAssistant';
import { ArrowLeft, Clock, Calendar, Share2 } from 'lucide-react';
import { ShareModal } from './ShareModal';

const blogPosts = {
    'ansiedade': {
        title: 'Como lidar com a ansiedade',
        category: 'Bem-estar',
        date: '12 Out 2023',
        readTime: '5 min de leitura',
        image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        content: `
      <p class="mb-6">A ansiedade é uma reação natural do corpo ao estresse, mas quando se torna constante e interfere nas atividades diárias, pode ser um sinal de que precisamos de atenção e cuidado. Neste artigo, vamos explorar estratégias práticas para gerenciar a ansiedade e retomar o equilíbrio emocional.</p>
      
      <h3 class="text-2xl font-serif text-[#4A5D4A] mb-4 mt-8">Reconhecendo os Sinais</h3>
      <p class="mb-6">O primeiro passo para lidar com a ansiedade é reconhecer seus sintomas. Eles podem se manifestar de diversas formas:</p>
      <ul class="list-disc pl-6 mb-6 space-y-2">
        <li>Coração acelerado ou palpitações</li>
        <li>Pensamentos acelerados e preocupação excessiva</li>
        <li>Tensão muscular e dores no corpo</li>
        <li>Dificuldade para dormir ou relaxar</li>
      </ul>

      <h3 class="text-2xl font-serif text-[#4A5D4A] mb-4 mt-8">Técnicas de Respiração</h3>
      <p class="mb-6">A respiração é uma das ferramentas mais poderosas para acalmar o sistema nervoso. A técnica 4-7-8 é simples e eficaz: inspire pelo nariz contando até 4, segure o ar por 7 segundos e expire lentamente pela boca contando até 8. Repetir esse ciclo algumas vezes pode reduzir significativamente a sensação de pânico.</p>

      <h3 class="text-2xl font-serif text-[#4A5D4A] mb-4 mt-8">A Importância do "Aqui e Agora"</h3>
      <p class="mb-6">A ansiedade muitas vezes nos projeta para o futuro, criando cenários catastróficos que podem nunca acontecer. Praticar a atenção plena (Mindfulness) ajuda a trazer o foco para o presente. Tente observar o ambiente ao seu redor, as cores, os sons e as sensações físicas do momento.</p>

      <h3 class="text-2xl font-serif text-[#4A5D4A] mb-4 mt-8">Busque Apoio Profissional</h3>
      <p class="mb-6">Embora essas estratégias ajudem, a ansiedade persistente deve ser acompanhada por um profissional. A Terapia Cognitivo-Comportamental (TCC), por exemplo, é altamente eficaz no tratamento de transtornos de ansiedade, ajudando a reestruturar padrões de pensamento negativos.</p>
      
      <p class="italic text-gray-500 mt-8">Lembre-se: pedir ajuda não é sinal de fraqueza, mas de coragem.</p>
    `
    },
    'autocuidado': {
        title: 'A importância do autocuidado',
        category: 'Estilo de Vida',
        date: '05 Set 2023',
        readTime: '4 min de leitura',
        image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        content: `
      <p class="mb-6">Em um mundo cada vez mais acelerado, reservar um tempo para si mesmo não é luxo, é necessidade. O autocuidado vai muito além de tratamentos estéticos; trata-se de nutrir sua saúde física, mental e emocional.</p>

      <h3 class="text-2xl font-serif text-[#4A5D4A] mb-4 mt-8">O Que Realmente é Autocuidado?</h3>
      <p class="mb-6">Autocuidado é qualquer ação intencional que você toma para cuidar da sua própria saúde física, mental e emocional. Pode ser dizer "não" a um compromisso quando você está exausto, dormir mais cedo, ou simplesmente fazer uma pausa para tomar um café com calma.</p>

      <h3 class="text-2xl font-serif text-[#4A5D4A] mb-4 mt-8">Pequenos Hábitos, Grandes Mudanças</h3>
      <p class="mb-6">Não é preciso mudar toda a sua rotina de uma vez. Comece com pequenos passos:</p>
      <ul class="list-disc pl-6 mb-6 space-y-2">
        <li>Beba mais água durante o dia.</li>
        <li>Reserve 10 minutos para ler algo que você gosta.</li>
        <li>Faça uma caminhada ao ar livre.</li>
        <li>Desconecte-se das redes sociais uma hora antes de dormir.</li>
      </ul>

      <h3 class="text-2xl font-serif text-[#4A5D4A] mb-4 mt-8">Autocuidado Emocional</h3>
      <p class="mb-6">Validar seus sentimentos é uma forma profunda de autocuidado. Permita-se sentir, seja alegria ou tristeza, sem julgamentos. Estabelecer limites saudáveis nos relacionamentos também é fundamental para preservar sua energia e bem-estar.</p>
    `
    },
    'tcc': {
        title: 'Entendendo a Terapia Cognitivo-Comportamental',
        category: 'Psicologia',
        date: '28 Ago 2023',
        readTime: '6 min de leitura',
        image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        content: `
      <p class="mb-6">A Terapia Cognitivo-Comportamental (TCC) é uma das abordagens mais estudadas e eficazes da psicologia moderna. Focada no presente e orientada para a ação, ela ajuda a identificar e modificar padrões de pensamento e comportamento que causam sofrimento.</p>

      <h3 class="text-2xl font-serif text-[#4A5D4A] mb-4 mt-8">Como a TCC Funciona?</h3>
      <p class="mb-6">A premissa básica da TCC é que não são os eventos em si que nos perturbam, mas sim a maneira como os interpretamos. Nossos pensamentos influenciam nossas emoções e, consequentemente, nossos comportamentos. Ao alterar a interpretação (pensamento), podemos mudar como nos sentimos e agimos.</p>

      <h3 class="text-2xl font-serif text-[#4A5D4A] mb-4 mt-8">O Ciclo Cognitivo</h3>
      <p class="mb-6">Imagine que você envia uma mensagem para um amigo e ele não responde imediatamente.
      <br><strong>Pensamento:</strong> "Ele deve estar chateado comigo."
      <br><strong>Emoção:</strong> Tristeza, ansiedade.
      <br><strong>Comportamento:</strong> Isolar-se ou mandar mensagens cobrando resposta.
      <br><br>
      A TCC ajuda a questionar esse pensamento inicial: "Será que ele só não está ocupado?". Essa reestruturação cognitiva alivia a ansiedade e promove respostas mais saudáveis.</p>

      <h3 class="text-2xl font-serif text-[#4A5D4A] mb-4 mt-8">Para Quem é Indicada?</h3>
      <p class="mb-6">A TCC é eficaz para uma ampla gama de questões, incluindo depressão, transtornos de ansiedade, fobias, transtorno obsessivo-compulsivo (TOC) e problemas de relacionamento. É uma terapia colaborativa, onde terapeuta e paciente trabalham juntos como uma equipe.</p>
    `
    },
    'relacionamentos': {
        title: 'Construindo Relacionamentos Saudáveis',
        category: 'Relacionamentos',
        date: '15 Nov 2023',
        readTime: '5 min de leitura',
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        content: `
      <p class="mb-6">Relacionamentos saudáveis são a base para uma vida feliz, mas construí-los exige esforço, comunicação e empatia. Não existem relações perfeitas, mas existem relações funcionais onde ambos os lados se sentem respeitados e valorizados.</p>

      <h3 class="text-2xl font-serif text-[#4A5D4A] mb-4 mt-8">Comunicação Assertiva</h3>
      <p class="mb-6">Muitos conflitos surgem de falhas na comunicação. Ser assertivo significa expressar suas necessidades e sentimentos de forma clara e respeitosa, sem agredir o outro e sem se anular. Use frases como "Eu sinto..." em vez de "Você faz...", focando na sua percepção da situação.</p>

      <h3 class="text-2xl font-serif text-[#4A5D4A] mb-4 mt-8">Respeito à Individualidade</h3>
      <p class="mb-6">Em um relacionamento saudável, 1 + 1 = 3 (eu, você e a relação). É essencial manter a própria identidade, hobbies e amizades. O parceiro deve somar, não completar ou preencher um vazio que é responsabilidade nossa cuidar.</p>

      <h3 class="text-2xl font-serif text-[#4A5D4A] mb-4 mt-8">Linguagens do Amor</h3>
      <p class="mb-6">Cada pessoa demonstra e recebe afeto de formas diferentes. Para alguns, palavras de afirmação são cruciais; para outros, atos de serviço ou toque físico. Entender a "linguagem" do seu parceiro pode transformar a dinâmica do relacionamento.</p>
    `
    }
};

export const BlogPost: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [shareModalOpen, setShareModalOpen] = useState(false);
    // Default to first post if id not found (or handle error)
    const post = blogPosts[id as keyof typeof blogPosts];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const handleOpenShare = () => {
        setShareModalOpen(true);
    };

    if (!post) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB]">
                <h2 className="text-2xl font-serif text-[#4A5D4A] mb-4">Artigo não encontrado</h2>
                <Link to="/" className="text-[#4A5D4A] hover:underline flex items-center gap-2">
                    <ArrowLeft size={20} /> Voltar para a Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* Simplify Navbar for Blog Page or reuse main one (but links might need adjustment) */}
            {/* For simplicity we can use the same Navbar but maybe we want a specific behavior. 
          Let's reuse standard Navbar logic via Link if we were using routing globally, 
          but our Navbar uses anchor tags. For the blog page, we might want a simple header 
          or just the "Back" button prominent. Let's use a simple header. */}

            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-serif font-bold text-[#4A5D4A]">
                        Fernanda Abreu
                    </Link>
                    <Link to="/" className="text-[#4A5D4A] hover:bg-[#4A5D4A]/10 px-4 py-2 rounded-full transition-all flex items-center gap-2 text-sm font-medium">
                        <ArrowLeft size={18} />
                        Voltar
                    </Link>
                </div>
            </header>

            <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="bg-[#B4C2B4]/20 text-[#4A5D4A] px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase">
                            {post.category}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-serif text-[#4A5D4A] mb-6 leading-tight">
                        {post.title}
                    </h1>
                    <div className="flex items-center justify-center gap-6 text-gray-500 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            {post.date}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} />
                            {post.readTime}
                        </div>
                    </div>
                </div>

                {/* Featured Image */}
                <div className="mb-12 rounded-3xl overflow-hidden shadow-xl aspect-video relative group">
                    <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                    />
                </div>

                {/* Content */}
                <div
                    className="prose prose-lg prose-headings:font-serif prose-headings:text-[#4A5D4A] prose-p:text-gray-600 prose-li:text-gray-600 max-w-none mb-12"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Share Section */}
                <div className="border-t border-b border-gray-100 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="font-serif text-lg text-[#4A5D4A] italic">Gostou desse artigo?</p>
                    <button
                        onClick={handleOpenShare}
                        className="flex items-center gap-2 text-[#4A5D4A] hover:bg-[#4A5D4A]/10 px-6 py-3 rounded-full border border-[#4A5D4A]/20 transition-all font-medium"
                    >
                        <Share2 size={18} />
                        Compartilhar
                    </button>
                </div>
            </article>

            <section className="bg-white py-20 border-t border-gray-50">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h3 className="text-3xl font-serif text-[#4A5D4A] mb-6">Comece sua jornada hoje</h3>
                    <p className="text-gray-500 mb-8 max-w-xl mx-auto">
                        Se você se identificou com este conteúdo e sente que precisa de apoio, estou aqui para ajudar.
                    </p>
                    <a
                        href="https://wa.me/5500000000000"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-[#128C7E] text-white px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-xl hover:bg-[#075E54] flex items-center justify-center gap-2 max-w-xs mx-auto"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.403 0 6.556-5.332 11.89-11.891 11.89-2.015 0-3.991-.512-5.747-1.487l-6.246 1.638zm5.836-5.046c1.656.984 3.279 1.484 4.964 1.484 5.422 0 9.835-4.413 9.835-9.835 0-2.628-1.022-5.1-2.871-6.951-1.848-1.847-4.331-2.87-6.964-2.87-5.422 0-9.835 4.413-9.835 9.835 0 1.904.537 3.74 1.554 5.31l-.995 3.634 3.671-.962zm10.103-6.887c-.198-.1-1.174-.58-1.356-.646-.182-.065-.315-.1-.448.1-.133.199-.513.646-.629.779-.117.133-.232.15-.429.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.117-.198-.013-.304.087-.403.09-.089.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.448-1.08-.614-1.482-.162-.389-.326-.335-.448-.341-.117-.005-.252-.006-.388-.006-.136 0-.356.05-.542.253-.187.203-.712.696-.712 1.697 0 1.002.728 1.97.83 2.103.101.133 1.43 2.184 3.465 3.063.483.209.86.335 1.154.428.484.154.925.132 1.273.08.388-.058 1.174-.48 1.34-.943.165-.463.165-.86.115-.943-.049-.084-.182-.133-.38-.232z" />
                        </svg>
                        Falar no WhatsApp
                    </a>
                </div>
            </section>

            <Footer />
            <AIChatAssistant />

            {/* WhatsApp Button */}
            <a
                href="https://wa.me/5500000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform duration-300 flex items-center justify-center"
                aria-label="Falar no WhatsApp"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.403 0 6.556-5.332 11.89-11.891 11.89-2.015 0-3.991-.512-5.747-1.487l-6.246 1.638zm5.836-5.046c1.656.984 3.279 1.484 4.964 1.484 5.422 0 9.835-4.413 9.835-9.835 0-2.628-1.022-5.1-2.871-6.951-1.848-1.847-4.331-2.87-6.964-2.87-5.422 0-9.835 4.413-9.835 9.835 0 1.904.537 3.74 1.554 5.31l-.995 3.634 3.671-.962zm10.103-6.887c-.198-.1-1.174-.58-1.356-.646-.182-.065-.315-.1-.448.1-.133.199-.513.646-.629.779-.117.133-.232.15-.429.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.117-.198-.013-.304.087-.403.09-.089.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.448-1.08-.614-1.482-.162-.389-.326-.335-.448-.341-.117-.005-.252-.006-.388-.006-.136 0-.356.05-.542.253-.187.203-.712.696-.712 1.697 0 1.002.728 1.97.83 2.103.101.133 1.43 2.184 3.465 3.063.483.209.86.335 1.154.428.484.154.925.132 1.273.08.388-.058 1.174-.48 1.34-.943.165-.463.165-.86.115-.943-.049-.084-.182-.133-.38-.232z" />
                </svg>
            </a>

            <ShareModal
                isOpen={shareModalOpen}
                onClose={() => setShareModalOpen(false)}
                url={window.location.href}
                title={post?.title || ''}
            />
        </div>
    );
};
