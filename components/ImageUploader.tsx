import React, { useEffect, useMemo } from 'react';

interface ImageUploaderProps {
  existingUrls: string[];
  pendingFiles: File[];
  onFilesAdded: (files: File[]) => void;
  onRemoveExisting: (index: number) => void;
  onRemovePending: (index: number) => void;
  maxFiles?: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  existingUrls,
  pendingFiles,
  onFilesAdded,
  onRemoveExisting,
  onRemovePending,
  maxFiles = 10,
}) => {
  const pendingPreviews = useMemo(
    () => pendingFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    })),
    [pendingFiles],
  );

  useEffect(() => {
    return () => {
      pendingPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [pendingPreviews]);

  const totalImages = existingUrls.length + pendingFiles.length;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const imageFiles = selectedFiles.filter((file) => file.type.startsWith('image/'));

    if (!imageFiles.length) {
      return;
    }

    const availableSlots = Math.max(0, maxFiles - totalImages);
    onFilesAdded(imageFiles.slice(0, availableSlots));
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Imagens do post</label>
        <span className="text-xs text-gray-500">{totalImages}/{maxFiles} imagens</span>
      </div>

      <label className="block border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/40 transition-colors">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="sr-only"
          disabled={totalImages >= maxFiles}
        />
        <div className="space-y-2">
          <div className="text-3xl">🖼️</div>
          <p className="text-sm font-medium text-gray-700">Clique para selecionar imagens</p>
          <p className="text-xs text-gray-500">JPEG, PNG ou WebP. O upload acontece ao salvar o post.</p>
        </div>
      </label>

      {totalImages > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {existingUrls.map((url, index) => (
            <div key={url} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square group">
              <img src={url} alt={`Imagem ${index + 1}`} className="w-full h-full object-cover" />
              <span className="absolute left-2 top-2 text-[10px] font-medium bg-white/90 text-gray-700 px-2 py-1 rounded-full">
                Salva
              </span>
              <button
                type="button"
                onClick={() => onRemoveExisting(index)}
                className="absolute right-2 top-2 bg-black/60 text-white rounded-full w-7 h-7 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remover imagem salva"
              >
                ×
              </button>
            </div>
          ))}

          {pendingPreviews.map((preview, index) => (
            <div key={preview.url} className="relative rounded-xl overflow-hidden border border-purple-200 bg-purple-50 aspect-square group">
              <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
              <span className="absolute left-2 top-2 text-[10px] font-medium bg-purple-600 text-white px-2 py-1 rounded-full">
                Nova
              </span>
              <button
                type="button"
                onClick={() => onRemovePending(index)}
                className="absolute right-2 top-2 bg-black/60 text-white rounded-full w-7 h-7 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remover imagem pendente"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;