import React from 'react';
import { X, Copy, Mail, MessageCircle, Send, Check } from 'lucide-react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    title: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, url, title }) => {
    const [copied, setCopied] = React.useState(false);

    if (!isOpen) return null;

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(`Confira este artigo: ${title} - ${url}`);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#4A5D4A]/60 backdrop-blur-md transition-all duration-300 animate-fadeIn" onClick={onClose}>
            <div
                className="bg-[#FDFCFB] rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative border border-white/50 transform transition-all duration-300 scale-100 hover:shadow-3xl"
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 p-2 text-gray-400 hover:text-[#4A5D4A] hover:bg-[#4A5D4A]/10 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-8">
                    <h3 className="text-2xl font-serif text-[#4A5D4A] mb-2">Compartilhar</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Escolha uma opção</p>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-8">
                    {/* WhatsApp */}
                    <a
                        href={`https://api.whatsapp.com/send?text=${encodedText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className="w-14 h-14 bg-[#25D366]/10 rounded-2xl flex items-center justify-center text-[#25D366] group-hover:bg-[#25D366] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1">
                            <MessageCircle size={28} />
                        </div>
                        <span className="text-xs text-gray-500 font-medium group-hover:text-[#25D366] transition-colors">WhatsApp</span>
                    </a>

                    {/* Telegram */}
                    <a
                        href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className="w-14 h-14 bg-[#0088cc]/10 rounded-2xl flex items-center justify-center text-[#0088cc] group-hover:bg-[#0088cc] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1">
                            <Send size={26} className="-ml-1 mt-1" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium group-hover:text-[#0088cc] transition-colors">Telegram</span>
                    </a>

                    {/* Email */}
                    <a
                        href={`mailto:?subject=${encodedTitle}&body=${encodedText}`}
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600 group-hover:bg-gray-800 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1">
                            <Mail size={28} />
                        </div>
                        <span className="text-xs text-gray-500 font-medium group-hover:text-gray-800 transition-colors">E-mail</span>
                    </a>

                    {/* Copy Link */}
                    <button
                        onClick={handleCopyLink}
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:-translate-y-1 ${copied ? 'bg-[#4A5D4A] text-white' : 'bg-[#4A5D4A]/10 text-[#4A5D4A] group-hover:bg-[#4A5D4A] group-hover:text-white'}`}>
                            {copied ? <Check size={28} /> : <Copy size={28} />}
                        </div>
                        <span className={`text-xs font-medium transition-colors ${copied ? 'text-[#4A5D4A]' : 'text-gray-500 group-hover:text-[#4A5D4A]'}`}>
                            {copied ? 'Copiado!' : 'Copiar'}
                        </span>
                    </button>
                </div>

                <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-xs">Link:</span>
                    </div>
                    <input
                        type="text"
                        readOnly
                        value={url}
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-xs text-gray-500 font-mono focus:outline-none focus:border-[#4A5D4A] focus:ring-1 focus:ring-[#4A5D4A] transition-all truncate"
                        onClick={handleCopyLink}
                    />
                </div>
            </div>
        </div>
    );
};
