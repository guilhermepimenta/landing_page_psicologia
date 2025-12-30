
import React, { useState, useEffect } from 'react';
import { Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ShareModal } from './ShareModal';

const posts = [
  {
    id: 'ansiedade',
    title: 'Como lidar com a ansiedade',
    image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    excerpt: 'Descubra estratégias práticas para gerenciar a ansiedade no seu dia a dia e ter mais qualidade de vida.'
  },
  {
    id: 'autocuidado',
    title: 'A importância do autocuidado',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    excerpt: 'Cuidar de si não é luxo, é necessidade. Entenda como pequenos hábitos mudam sua saúde mental.'
  },
  {
    id: 'tcc',
    title: 'Entendendo a TCC',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    excerpt: 'Conheça uma das abordagens mais eficazes da psicologia moderna e como ela pode te ajudar.'
  },
  {
    id: 'relacionamentos',
    title: 'Relacionamentos Saudáveis',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    excerpt: 'Dicas fundamentais para construir relações baseadas em respeito, comunicação e empatia.'
  }
];

export const Blog: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState({ title: '', url: '' });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setItemsPerPage(3);
      } else {
        setItemsPerPage(1);
      }
    };

    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.ceil(posts.length / itemsPerPage);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  };

  // Logic to show visible items seamlessly handling the "end" of the list for visual carousel feeling
  // For simplicity and robustness on a small list, we will just render items based on index logic
  // But standard "grid" behavior on desktop (show 3) vs mobile (show 1) usually implies "pagination" or "sliding window"
  // Let's implement a "Sliding Window" that loops.

  const getVisiblePosts = () => {
    if (itemsPerPage >= posts.length) return posts;

    // Create a circular list for rendering 
    const visible = [];
    for (let i = 0; i < itemsPerPage; i++) {
      visible.push(posts[(currentIndex + i) % posts.length]);
    }
    return visible;
  };

  const activePosts = getVisiblePosts();

  const handleOpenShare = (title: string, id: string) => {
    const url = `${window.location.origin}/blog/${id}`;
    setShareData({ title, url });
    setShareModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-serif text-[#4A5D4A] mb-4">Blog</h2>
        <div className="h-0.5 w-12 bg-[#B4C2B4] mx-auto mb-6"></div>
      </div>

      <div className="relative group/carousel">
        {/* Navigation Buttons */}
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 p-3 bg-white text-[#4A5D4A] rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 border border-gray-100 hidden md:block" // Hidden on mobile touch, can rely on dots or always show? Let's show on mobile always actually or allow swipe. For now, simple buttons.
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 p-3 bg-white text-[#4A5D4A] rounded-full shadow-lg opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:scale-110 border border-gray-100 hidden md:block"
        >
          <ChevronRight size={24} />
        </button>

        {/* Mobile Navigation (Always visible) */}
        <div className="flex md:hidden justify-between absolute top-1/2 -translate-y-1/2 w-full z-10 px-0 pointer-events-none">
          <button onClick={prev} className="pointer-events-auto p-2 bg-white/80 rounded-full shadow-sm text-[#4A5D4A] -ml-4"><ChevronLeft size={20} /></button>
          <button onClick={next} className="pointer-events-auto p-2 bg-white/80 rounded-full shadow-sm text-[#4A5D4A] -mr-4"><ChevronRight size={20} /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {activePosts.map((post, idx) => (
            <div key={`${post.id}-${idx}`} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-500 group animate-fadeIn">
              <div className="h-56 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="p-8">
                <h3 className="text-xl font-serif text-[#4A5D4A] mb-4 leading-snug min-h-[3.5rem]">{post.title}</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/blog/${post.id}`)}
                    className="bg-[#9C6644] hover:bg-[#7F5539] text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors shadow-md hover:shadow-lg"
                  >
                    Leia Mais
                  </button>
                  <button
                    onClick={() => handleOpenShare(post.title, post.id)}
                    className="p-2 text-gray-400 hover:text-[#4A5D4A] hover:bg-gray-50 rounded-lg transition-all"
                    title="Compartilhar postagem"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots Indicators */}
        <div className="flex justify-center gap-2 mt-12">
          {posts.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-[#4A5D4A]' : 'w-2 bg-[#B4C2B4]/50 hover:bg-[#B4C2B4]'}`}
            />
          ))}
        </div>

        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          url={shareData.url}
          title={shareData.title}
        />
      </div>
    </div>
  );
};

