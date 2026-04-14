import React, { useEffect, useMemo, useState } from 'react';

interface InstagramPreviewProps {
  username: string;
  displayName: string;
  caption: string;
  imageUrls: string[];
  format?: 'post' | 'reel';
  videoUrl?: string;
  publishDate: Date;
}

const InstagramPreview: React.FC<InstagramPreviewProps> = ({
  username,
  displayName,
  caption,
  imageUrls,
  format = 'post',
  videoUrl,
  publishDate,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [imageUrls]);

  const isReel = format === 'reel';
  const hasImages = imageUrls.length > 0;
  const hasVideo = Boolean(videoUrl);
  const currentImage = imageUrls[activeIndex];
  const initials = useMemo(
    () => displayName.split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase(),
    [displayName],
  );

  const canGoPrev = !isReel && activeIndex > 0;
  const canGoNext = !isReel && activeIndex < imageUrls.length - 1;

  const goPrev = () => {
    if (canGoPrev) {
      setActiveIndex((current) => current - 1);
    }
  };

  const goNext = () => {
    if (canGoNext) {
      setActiveIndex((current) => current + 1);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50 p-4 lg:sticky lg:top-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">Preview do Instagram</h3>
        <span className="text-xs text-gray-500">Tempo real</span>
      </div>

      <div className="rounded-[1.25rem] border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-400 p-[1px]">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-semibold text-gray-700">
                {initials || 'FM'}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 leading-tight">{username}</p>
              <p className="text-[11px] text-gray-500 leading-tight">{displayName}</p>
            </div>
          </div>
          <span className="text-gray-400 text-lg leading-none">•••</span>
        </div>

        <div className="relative aspect-square bg-gray-100">
          {isReel ? (
            hasVideo ? (
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
                controls
                muted
                playsInline
              />
            ) : hasImages ? (
              <>
                <img
                  src={currentImage}
                  alt="Preview da capa do reel"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-black/55 text-white flex items-center justify-center text-2xl">
                    ▶
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <span className="text-4xl mb-2">🎬</span>
                <p className="text-xs">Adicione URL do video para visualizar o Reel</p>
              </div>
            )
          ) : hasImages ? (
            <img
              src={currentImage}
              alt={`Preview imagem ${activeIndex + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl mb-2">🖼️</span>
              <p className="text-xs">Adicione imagens para visualizar</p>
            </div>
          )}

          {!isReel && imageUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                disabled={!canGoPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white disabled:opacity-30"
                aria-label="Imagem anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canGoNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white disabled:opacity-30"
                aria-label="Próxima imagem"
              >
                ›
              </button>
              <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">
                {activeIndex + 1}/{imageUrls.length}
              </div>
            </>
          )}
        </div>

        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between text-lg">
          <div className="flex items-center gap-3">
            <span>♡</span>
            <span>💬</span>
            <span>✈️</span>
          </div>
          <span>🔖</span>
        </div>

        <div className="p-3 space-y-2">
          {!isReel && imageUrls.length > 1 && (
            <div className="flex justify-center gap-1">
              {imageUrls.map((_, index) => (
                <span
                  key={`dot-${index}`}
                  className={`w-1.5 h-1.5 rounded-full ${index === activeIndex ? 'bg-blue-500' : 'bg-gray-300'}`}
                />
              ))}
            </div>
          )}

          <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
            <span className="font-semibold mr-1">{username}</span>
            {caption || 'A legenda aparecerá aqui conforme você digita o conteúdo do post.'}
          </p>

          <p className="text-[11px] text-gray-500">
            {isReel ? 'Formato: Reel' : imageUrls.length > 1 ? 'Formato: Carrossel' : 'Formato: Post'}
          </p>

          <p className="text-[11px] text-gray-400 uppercase tracking-wide">
            {publishDate.toLocaleString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstagramPreview;