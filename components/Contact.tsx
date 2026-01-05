
import React, { useState } from 'react';
import { Send, AlertCircle, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { sendGAEvent } from '../utils/analytics';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [errors, setErrors] = useState({
    email: '',
    phone: ''
  });

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    // Remove all non-digits for validation
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  };

  const formatPhone = (value: string) => {
    if (!value) return value;

    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    const len = digits.length;

    if (len <= 2) {
      return digits.length > 0 ? `(${digits}` : digits;
    }
    if (len <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }
    if (len <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;

    let newValue = value;
    if (id === 'phone') {
      newValue = formatPhone(value);
    }

    setFormData(prev => ({ ...prev, [id]: newValue }));

    // Clear errors when user starts typing again
    if (errors[id as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newErrors = { email: '', phone: '' };
    let isValid = true;

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Por favor, insira um e-mail válido.';
      isValid = false;
    }

    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Insira um telefone válido com DDD (ex: 21 98888-7777).';
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    // In a real scenario, this would handle form submission
    const message = `Olá Dra. Fernanda, meu nome é ${formData.name}. ${formData.message} (Contato: ${formData.phone})`;
    const encodedMessage = encodeURIComponent(message);

    // Track conversion
    sendGAEvent('generate_lead', 'contact', 'whatsapp_submit');

    window.open(`https://wa.me/5521993718343?text=${encodedMessage}`, '_blank');

    setFormData({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Contact Info & Branding */}
        <div className="md:w-5/12 bg-[#4A5D4A] p-10 md:p-14 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Entre em Contato</h2>
            <div className="h-1 w-12 bg-[#B4C2B4] mb-8"></div>
            <p className="text-white/80 text-lg leading-relaxed mb-12">
              Estou aqui para acolher você. Fique à vontade para agendar uma consulta ou tirar suas dúvidas sobre o tratamento.
            </p>

            <div className="space-y-6">
              {/* Phone number removed as requested */}

              <div className="flex items-center gap-4 text-white/90">
                <div className="p-3 bg-white/10 rounded-xl">
                  <Mail size={20} />
                </div>
                <span className="font-medium tracking-wide">contato@fernandaabreu.com.br</span>
              </div>

              <div className="flex items-center gap-4 text-white/90">
                <div className="p-3 bg-white/10 rounded-xl">
                  <MapPin size={20} />
                </div>
                <span className="font-medium tracking-wide">Icaraí, Niterói - RJ</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12">
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-[#B4C2B4]"></div>
              <div className="w-2 h-2 rounded-full bg-[#B4C2B4]/50"></div>
              <div className="w-2 h-2 rounded-full bg-[#B4C2B4]/30"></div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-7/12 p-8 md:p-10 bg-white flex flex-col justify-center">
          <h3 className="text-[#4A5D4A] font-bold text-lg mb-8 uppercase tracking-widest flex items-center gap-2">
            <MessageCircle size={20} />
            Envie sua mensagem
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Maria Silva"
                  className="w-full px-6 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4C2B4]/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Ex: maria@email.com"
                  className={`w-full px-6 py-3 rounded-xl border ${errors.email ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-100'} bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4C2B4]/50 transition-all`}
                />
                {errors.email && (
                  <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1 animate-fadeIn">
                    <AlertCircle size={12} /> {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
              <input
                id="phone"
                type="tel"
                required
                maxLength={15}
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Ex: (21) 98888-7777"
                className={`w-full px-6 py-3 rounded-xl border ${errors.phone ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-100'} bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4C2B4]/50 transition-all`}
              />
              {errors.phone && (
                <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1 animate-fadeIn">
                  <AlertCircle size={12} /> {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Sua Mensagem</label>
              <textarea
                id="message"
                rows={3}
                required
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Como posso te ajudar hoje?"
                className="w-full px-6 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4C2B4]/50 transition-all resize-none"
              ></textarea>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-[#4A5D4A] hover:bg-[#3A4A3A] text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Send size={20} />
                Enviar Mensagem
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              Seus dados estão protegidos. Retorno em até 24h.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
