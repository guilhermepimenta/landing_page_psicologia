import React, { useState, useEffect, useMemo } from 'react';
import { postsService, Post } from '../services/firebaseService';
import { imageService } from '../services/imageService';
import { publishToInstagram } from '../services/instagramService';
import ImageUploader from './ImageUploader';
import InstagramPreview from './InstagramPreview';

interface PostFormModalProps {
  onClose: () => void;
  onSaved: () => void;
  postToEdit?: Post | null;
}

const CHANNELS: Array<Post['channel']> = ['Instagram', 'GMB', 'Blog', 'Email'];
const STATUSES: Array<Post['status']> = ['draft', 'scheduled', 'published'];

const STATUS_LABELS = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  published: 'Publicado',
};

const PostFormModal: React.FC<PostFormModalProps> = ({ onClose, onSaved, postToEdit }) => {
  const [title, setTitle] = useState(postToEdit?.title || '');
  const [channel, setChannel] = useState<Post['channel']>(postToEdit?.channel || 'Instagram');
  const [status, setStatus] = useState<Post['status']>(postToEdit?.status || 'draft');
  const [date, setDate] = useState<string>(
    postToEdit?.date 
      ? postToEdit.date.toISOString().slice(0, 16) 
      : new Date().toISOString().slice(0, 16)
  );
  const [content, setContent] = useState(postToEdit?.content || '');
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(postToEdit?.imageUrls || []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [instagramSuccess, setInstagramSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingPreviewUrls = useMemo(
    () => pendingFiles.map((file) => URL.createObjectURL(file)),
    [pendingFiles],
  );

  useEffect(() => {
    return () => {
      pendingPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pendingPreviewUrls]);

  const previewImages = [...existingImageUrls, ...pendingPreviewUrls];
  const previewDate = new Date(date);

  useEffect(() => {
    setExistingImageUrls(postToEdit?.imageUrls || []);
    setPendingFiles([]);
  }, [postToEdit]);

  const uploadAndBuildData = async (): Promise<Omit<Post, 'id' | 'createdAt' | 'updatedAt'> & { instagramPostId?: string; instagramPermalink?: string }> => {
    const uploadedUrls = pendingFiles.length > 0
      ? await imageService.uploadMultipleImages(pendingFiles)
      : [];

    return {
      title,
      channel,
      status,
      date: new Date(date),
      content,
      engagement: postToEdit?.engagement || 0,
      imageUrls: [...existingImageUrls, ...uploadedUrls],
      instagramPostId: postToEdit?.instagramPostId,
      instagramPermalink: postToEdit?.instagramPermalink,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      setError('O título é obrigatório.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setInstagramSuccess(null);

    try {
      const postData = await uploadAndBuildData();

      if (postToEdit?.id) {
        const result = await postsService.update(postToEdit.id, postData);
        if (!result.success) throw result.error;
      } else {
        const result = await postsService.create(postData);
        if (!result.success) throw result.error;
      }

      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar post. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishInstagram = async () => {
    if (!title) {
      setError('O título é obrigatório antes de publicar.');
      return;
    }
    const allImages = [...existingImageUrls, ...pendingFiles.map(() => '')];
    if (allImages.length === 0) {
      setError('Adicione ao menos uma imagem para publicar no Instagram.');
      return;
    }

    setIsPublishing(true);
    setError(null);
    setInstagramSuccess(null);

    try {
      // 1. Fazer upload das imagens pendentes e montar os dados do post
      const postData = await uploadAndBuildData();
      const finalImageUrls = postData.imageUrls ?? [];

      if (finalImageUrls.length === 0) {
        throw new Error('Adicione ao menos uma imagem para publicar no Instagram.');
      }

      // 2. Publicar no Instagram via Graph API
      const igResult = await publishToInstagram(finalImageUrls, content || title);

      // 3. Salvar/atualizar post no Firestore com os IDs do Instagram
      const dataWithIG = {
        ...postData,
        status: 'published' as Post['status'],
        instagramPostId: igResult.instagramPostId,
        instagramPermalink: igResult.instagramPermalink,
      };

      if (postToEdit?.id) {
        const result = await postsService.update(postToEdit.id, dataWithIG);
        if (!result.success) throw result.error;
      } else {
        const result = await postsService.create(dataWithIG);
        if (!result.success) throw result.error;
      }

      setInstagramSuccess(igResult.instagramPermalink);
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Erro ao publicar no Instagram. Tente novamente.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {postToEdit ? 'Editar Post' : 'Criar Novo Post'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Título */}
              <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Título do Post</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: 5 Dicas para Lidar com a Ansiedade"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                required
              />
              </div>

              {/* Canal */}
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Canal</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as Post['channel'])}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white"
              >
                {CHANNELS.map(ch => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
              </div>

              {/* Status */}
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Post['status'])}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-white"
              >
                {STATUSES.map(st => (
                  <option key={st} value={st}>{STATUS_LABELS[st]}</option>
                ))}
              </select>
              </div>

              {/* Data e Hora */}
              <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Data e Hora (Agendamento / Publicação)</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                required
              />
              </div>

              {/* Conteúdo */}
              <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo do Post</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="Escreva o conteúdo do post ou a legenda aqui..."
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
              />
              </div>

              <div className="md:col-span-2">
              <ImageUploader
                existingUrls={existingImageUrls}
                pendingFiles={pendingFiles}
                onFilesAdded={(files) => setPendingFiles((current) => [...current, ...files])}
                onRemoveExisting={(index) => {
                  setExistingImageUrls((current) => current.filter((_, currentIndex) => currentIndex !== index));
                }}
                onRemovePending={(index) => {
                  setPendingFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
                }}
              />
              </div>
            </div>

            <div className="lg:col-span-2">
              <InstagramPreview
                username="fernandamangiapsi"
                displayName="Fernanda Mangia"
                caption={content}
                imageUrls={previewImages}
                publishDate={Number.isNaN(previewDate.getTime()) ? new Date() : previewDate}
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl space-y-3">
          {instagramSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-lg text-sm">
              <span>✅</span>
              <span>Publicado no Instagram com sucesso!</span>
              <a
                href={instagramSuccess}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto underline font-medium hover:text-green-900"
              >
                Ver post →
              </a>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              type="button"
              className="px-6 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-medium transition-colors"
            >
              Cancelar
            </button>
            {channel === 'Instagram' && (
              <button
                onClick={handlePublishInstagram}
                disabled={isPublishing || isSaving}
                type="button"
                className="px-6 py-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-xl hover:opacity-90 font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isPublishing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <span>📱</span>
                    Publicar no Instagram
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isSaving || isPublishing}
              className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Post'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostFormModal;
