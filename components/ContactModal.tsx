import React, { useState, useEffect } from 'react';
import { Send, AlertCircle, CheckCircle, X } from 'lucide-react';
import { sendGAEvent } from '../utils/analytics';
import { messagesService } from '../services/firebaseService';

interface ContactModalProps {
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState({ email: '', phone: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const len = digits.length;
    if (len <= 2) return digits.length > 0 ? `(${digits}` : digits;
    if (len <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (len <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: id === 'phone' ? formatPhone(value) : value }));
    if (errors[id as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = { email: '', phone: '' };
    let isValid = true;

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Por favor, insira um e-mail válido.';
      isValid = false;
    }
    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Insira um telefone válido com DDD (ex: 21 98888-7777).';
      isValid = false;
    }
    if (!isValid) { setErrors(newErrors); return; }

    setSending(true);
    try {
      await messagesService.create(formData);
      sendGAEvent('envio_formulario_contato', 'contato', 'footer');
      setSent(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => { setSent(false); onClose(); }, 3000);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#3A4A3A]">Envie uma mensagem</h2>
            <p className="text-xs text-gray-400 mt-0.5">Retorno em até 24h</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-6">
          {sent ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <CheckCircle size={48} className="text-[#4A5D4A]" />
              <p className="font-bold text-[#3A4A3A] text-lg">Mensagem recebida!</p>
              <p className="text-gray-400 text-sm">Retornaremos em breve.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nome</label>
                  <input
                    id="name" type="text" required
                    value={formData.name} onChange={handleInputChange}
                    placeholder="Maria Silva"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4C2B4]/50 transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-widest">E-mail</label>
                  <input
                    id="email" type="email" required
                    value={formData.email} onChange={handleInputChange}
                    placeholder="maria@email.com"
                    className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-300' : 'border-gray-200'} bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4C2B4]/50 transition-all text-sm`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle size={10} /> {errors.email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Telefone / WhatsApp</label>
                <input
                  id="phone" type="tel" required maxLength={15}
                  value={formData.phone} onChange={handleInputChange}
                  placeholder="(21) 98888-7777"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-300' : 'border-gray-200'} bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4C2B4]/50 transition-all text-sm`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle size={10} /> {errors.phone}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mensagem</label>
                <textarea
                  id="message" rows={3} required
                  value={formData.message} onChange={handleInputChange}
                  placeholder="Como posso te ajudar?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4C2B4]/50 transition-all resize-none text-sm"
                />
              </div>

              <button
                type="submit" disabled={sending}
                className="w-full bg-[#4A5D4A] hover:bg-[#3A4A3A] disabled:opacity-60 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Send size={18} />
                {sending ? 'Enviando...' : 'Enviar Mensagem'}
              </button>

              <p className="text-center text-xs text-gray-400">Seus dados estão protegidos.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
