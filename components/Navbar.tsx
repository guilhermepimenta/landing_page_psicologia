
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { sendGAEvent } from '../utils/analytics';

interface NavbarProps {
  isScrolled: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ isScrolled }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Início', href: '#inicio' },
    { name: 'Sobre Mim', href: '#sobre' },
    { name: 'Serviços', href: '#servicos' },
    { name: 'Agendamento', href: '#agendamento' },
    { name: 'Blog', href: '#blog' },
    { name: 'Contato', href: '#contato' },
    { name: 'Depoimentos', href: '#depoimentos' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex-shrink-0">
            <a href="#inicio" className="block">
              <span className={`text-xl font-serif tracking-wide transition-colors duration-300 ${isScrolled ? 'text-[#4A5D4A]' : 'text-white'}`}>
                Psicóloga <span className="font-bold">Fernanda Abreu Mangia</span>
              </span>
            </a>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-6 lg:space-x-8 items-center">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => sendGAEvent('clique_menu_navegacao', 'navegacao', link.name)}
                className={`text-sm font-medium transition-colors hover:text-[#4A5D4A] relative group py-1 ${isScrolled ? 'text-gray-700' : 'text-white/80 hover:text-white'
                  }`}
              >
                {link.name}
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${isScrolled ? 'bg-[#4A5D4A]' : 'bg-white'}`}></span>
              </a>
            ))}
            {/* Admin Link */}
            <a
              href="/login"
              className={`text-xs opacity-50 hover:opacity-100 transition-opacity ${isScrolled ? 'text-gray-500' : 'text-white'}`}
              title="Acesso Admin"
            >
              🔐
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-md transition-colors ${isScrolled ? 'text-gray-600' : 'text-white'}`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white shadow-2xl absolute top-full left-0 w-full animate-fadeIn border-t border-gray-100">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => {
                  setIsOpen(false);
                  sendGAEvent('clique_menu_mobile', 'navegacao', link.name);
                }}
                className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-[#4A5D4A] transition-all"
              >
                {link.name}
              </a>
            ))}
            {/* Admin Link Mobile */}
            <a
              href="/login"
              className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all text-center border-t mt-2"
            >
              🔐 Acesso Admin
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};
