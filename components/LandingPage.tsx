import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { Bio } from './Bio';
import { Services } from './Services';
import { Blog } from './Blog';
import { Contact } from './Contact';
import { Testimonials } from './Testimonials';
import { Footer } from './Footer';
import { AIChatAssistant } from './AIChatAssistant';

export const LandingPage: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#FDFCFB] text-gray-800 selection:bg-[#B4C2B4] selection:text-white">
            <Navbar isScrolled={isScrolled} />

            <main>
                <section id="inicio" className="scroll-mt-[15px]">
                    <Hero />
                </section>

                <section id="sobre" className="pt-20 pb-20 bg-white scroll-mt-[15px]">
                    <Bio />
                </section>

                <section id="servicos" className="bg-[#F0EFEB] py-20 scroll-mt-[15px]">
                    <Services />
                </section>

                <section id="blog" className="bg-white py-20 scroll-mt-[15px]">
                    <Blog />
                </section>

                <section id="contato" className="py-20 bg-[#F7F5F2] scroll-mt-[15px]">
                    <Contact />
                </section>

                <section id="depoimentos" className="py-24 bg-[#4A5D4A] scroll-mt-[15px]">
                    <Testimonials />
                </section>
            </main>

            <Footer />

            {/* Floating AI Assistant for potential patient questions */}
            <AIChatAssistant />

            {/* Fixed WhatsApp Button */}
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
        </div>
    );
};
