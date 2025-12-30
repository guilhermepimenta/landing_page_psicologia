
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { MessageSquare, Send, X, AlertCircle, HelpCircle, User } from 'lucide-react';
// import { GoogleGenAI } from '@google/genai';

interface Message {
  role: 'user' | 'ai';
  text: string;
  isTyping?: boolean;
}

const TypingIndicator = () => (
  <div className="flex gap-1.5 px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm w-16 items-center justify-center animate-fadeIn">
    <div className="w-1.5 h-1.5 bg-[#B4C2B4] rounded-full animate-bounce [animation-duration:0.6s]"></div>
    <div className="w-1.5 h-1.5 bg-[#B4C2B4] rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]"></div>
    <div className="w-1.5 h-1.5 bg-[#B4C2B4] rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></div>
  </div>
);

export const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: 'Olá! Sou a assistente virtual da Dra. Fernanda. Como posso te ajudar hoje sobre o processo terapêutico?' }
  ]);
  const [loading, setLoading] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabled = useRef(true);

  const frequentTopics = [
    'Como funciona a primeira consulta?',
    'Quais abordagens você utiliza?',
    'Quais os horários de atendimento?',
    'Atende convênio?'
  ];

  // Helper to scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current && isAutoScrollEnabled.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior
      });
    }
  };

  // Detect manual scroll
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      isAutoScrollEnabled.current = isAtBottom;
    }
  };

  // Immediate scroll on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom('auto'), 100);
    }
  }, [isOpen]);

  // Use useLayoutEffect for scroll during typing to avoid "jumping"
  useLayoutEffect(() => {
    scrollToBottom(isAiTyping ? 'auto' : 'smooth');
  }, [messages, isAiTyping, loading]);

  const simulateTyping = async (fullText: string) => {
    setIsAiTyping(true);
    let currentText = '';

    setMessages(prev => [...prev, { role: 'ai', text: '', isTyping: true }]);

    const baseDelay = fullText.length > 200 ? 5 : 12;

    for (let i = 0; i < fullText.length; i++) {
      currentText += fullText[i];

      // Update state more frequently for smoother visual growth
      if (i % 2 === 0 || i === fullText.length - 1) {
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex] && updated[lastIndex].role === 'ai') {
            updated[lastIndex] = { ...updated[lastIndex], text: currentText };
          }
          return updated;
        });
      }

      const variance = Math.random() * baseDelay;
      const pause = ['.', '!', '?'].includes(fullText[i]) ? 150 : (fullText[i] === ',' ? 80 : 0);
      await new Promise(resolve => setTimeout(resolve, baseDelay + variance + pause));
    }

    setMessages(prev => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      if (updated[lastIndex]) {
        updated[lastIndex] = { ...updated[lastIndex], text: fullText, isTyping: false };
      }
      return updated;
    });
    setIsAiTyping(false);
  };

  const handleSend = async (forcedText?: string) => {
    const textToSend = forcedText || input;
    if (!textToSend.trim() || loading || isAiTyping) return;

    const userMsg = textToSend;
    setInput('');
    isAutoScrollEnabled.current = true; // Force scroll for user messages
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = getMockResponse(userMsg);
      setLoading(false);
      await simulateTyping(response);
    } catch (error) {
      setLoading(false);
      setMessages(prev => [...prev, { role: 'ai', text: 'Tive um problema técnico. Tente novamente.' }]);
    }
  };

  const getMockResponse = (text: string): string => {
    const t = text.toLowerCase();

    if (t.includes('primeira consulta') || t.includes('funciona'))
      return 'A primeira consulta é um momento de acolhimento. Conversamos sobre o que te trouxe à terapia, suas expectativas e explico como funciona meu trabalho (TCC e Esquemas). Dura cerca de 50 minutos.';

    if (t.includes('abordagem') || t.includes('tcc') || t.includes('tecnica'))
      return 'Trabalho com a Terapia Cognitivo-Comportamental (TCC) e a Terapia do Esquema. São abordagens ativas e focadas no presente, mas que buscam entender raízes profundas de padrões emocionais.';

    if (t.includes('horario') || t.includes('agenda') || t.includes('disponivel') || t.includes('marcar'))
      return 'Os horários variam semanalmente. Para verificar a disponibilidade atualizada e agendar, o ideal é me chamar no WhatsApp pelo botão aqui no site!';

    if (t.includes('convenio') || t.includes('plano') || t.includes('unimed') || t.includes('bradesco'))
      return 'Atualmente trabalho com atendimento particular e emito recibo para reembolso. Muitos planos reembolsam uma boa parte do valor. Posso te explicar melhor no WhatsApp!';

    if (t.includes('valor') || t.includes('preço') || t.includes('quanto custa'))
      return 'Os valores das sessões seguem a tabela de referência do CRP, mas gosto de conversar pessoalmente para entender sua possibilidade. Me chame no WhatsApp que te passo todas as informações!';

    if (t.includes('online') || t.includes('virtual'))
      return 'Sim! O atendimento online é feito por videochamada (Google Meet ou WhatsApp), com a mesma eficácia e sigilo do presencial. É ótimo para quem busca praticidade.';

    if (t.includes('presencial') || t.includes('consultorio') || t.includes('onde'))
      return 'Atendo presencialmente em Niterói (Icaraí) e Nova Friburgo (Centro). Qual fica melhor para você?';

    if (t.includes('obrigad') || t.includes('agradeç') || t.includes('valeu') || t.includes('ok') || t.includes('tchau') || t.includes('bom dia') || t.includes('boa tarde') || t.includes('boa noite'))
      return 'Por nada! Fico à disposição. Se precisar de mais alguma coisa ou quiser agendar, é só chamar no WhatsApp. Tenha um ótimo dia!';

    return 'Entendo. Como sou uma assistente virtual, talvez não saiba responder a isso especificamente. Mas a Dra. Fernanda pode te ajudar! Clique no botão do WhatsApp para falar diretamente com ela.';
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      // Reset state after a brief delay to allow animation to start/finish implies we might want to keep it simple.
      // Since the window unmounts immediately (or animates out if we had exit animation, but we assume simple unmout for now unless configured otherwise).
      // The user wants the NEXT iteration to be fresh.
      setTimeout(() => {
        setMessages([
          { role: 'ai', text: 'Olá! Sou a assistente virtual da Dra. Fernanda. Como posso te ajudar hoje sobre o processo terapêutico?' }
        ]);
        setInput('');
      }, 300);
    } else {
      setIsOpen(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {isOpen && (
        <div className="absolute bottom-[calc(100%+8px)] right-0 w-[calc(100vw-3rem)] max-w-[400px] h-[500px] max-h-[calc(100vh-10rem)] bg-white rounded-3xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden animate-slideUp origin-bottom-right">
          {/* Header */}
          <div className="bg-[#4A5D4A] p-5 text-white flex justify-between items-center shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                  <MessageSquare size={20} />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#4A5D4A] rounded-full"></div>
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight">Suporte Virtual</h4>
                <p className="text-[11px] text-white/70 italic">Fernanda Abreu Mangia</p>
              </div>
            </div>
            <button onClick={handleToggle} className="hover:bg-white/10 p-2 rounded-full transition-all active:scale-90">
              <X size={20} />
            </button>
          </div>

          <div className="bg-amber-50/80 backdrop-blur-sm border-b border-amber-100 px-4 py-2 flex items-start gap-2 shrink-0">
            <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-800 leading-tight font-medium">
              Informativo: Não substitui consulta profissional.
            </p>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#FDFCFB] scroll-smooth"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeInUp`}>
                <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {m.role === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-1 border border-gray-100 shadow-sm">
                      <HelpCircle size={14} className="text-[#4A5D4A]" />
                    </div>
                  )}
                  <div className={`p-4 shadow-sm text-[13px] leading-relaxed transition-all duration-300 ${m.role === 'user'
                    ? 'bg-[#4A5D4A] text-white rounded-2xl rounded-tr-none'
                    : 'bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-tl-none'
                    }`}>
                    {m.text}
                    {m.isTyping && <span className="inline-block w-1 h-3.5 ml-1 bg-[#B4C2B4] animate-pulse align-middle"></span>}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2 items-start">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0 mt-1">
                    <HelpCircle size={14} className="text-[#4A5D4A]" />
                  </div>
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>

          {/* Footer Area */}
          <div className="p-4 bg-white border-t border-gray-100 space-y-4 shrink-0">
            {!loading && !isAiTyping && messages.length < 3 && (
              <div className="animate-fadeIn">
                <div className="flex flex-wrap gap-2">
                  {frequentTopics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(topic)}
                      className="text-[10px] bg-gray-50 hover:bg-[#B4C2B4] text-gray-500 hover:text-white border border-gray-200 hover:border-[#B4C2B4] px-3 py-1.5 rounded-full transition-all shadow-sm active:scale-95"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escreva sua mensagem..."
                disabled={loading || isAiTyping}
                className="w-full pl-5 pr-14 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-[#B4C2B4]/30 focus:border-[#B4C2B4] outline-none transition-all disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || isAiTyping || !input.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-[#4A5D4A] text-white rounded-xl hover:scale-105 transition-all active:scale-95 disabled:bg-gray-200"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className="bg-[#9C6644] text-white border border-white/20 p-4 rounded-full shadow-2xl hover:scale-110 hover:bg-[#7F5539] transition-all active:scale-95 flex items-center justify-center gap-3 z-50"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && <span className="hidden md:inline pr-2 font-medium">Posso te ajudar?</span>}
      </button>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};
