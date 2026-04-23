import React, { useState, useEffect } from 'react';
import { postsService, Post } from '../services/firebaseService';

interface SchedulePickerModalProps {
  onClose: () => void;
  onScheduled: () => void;
  initialDate?: Date;
}

const CHANNEL_ICON: Record<string, string> = {
  Instagram: '📱',
  GMB: '📍',
  Blog: '📝',
  Email: '📧',
};

const FORMAT_LABEL: Record<string, string> = {
  post: 'Post',
  carrossel: 'Carrossel',
  reels: 'Reels',
  reel: 'Reels',
  artigo: 'Artigo',
  atualizacao: 'Atualização',
  newsletter: 'Newsletter',
};

const STATUS_FILTER_OPTIONS = [
  { value: 'draft', label: '✏️ Rascunhos' },
  { value: 'all', label: '📋 Todos' },
  { value: 'scheduled', label: '📅 Agendados' },
];

const SchedulePickerModal: React.FC<SchedulePickerModalProps> = ({
  onClose,
  onScheduled,
  initialDate,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'draft' | 'scheduled' | 'all'>('draft');
  const [selected, setSelected] = useState<Post | null>(null);
  const [scheduleDate, setScheduleDate] = useState(
    (initialDate ?? new Date()).toISOString().slice(0, 16),
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    postsService.getAll().then(res => {
      if (res.success) setPosts(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = posts.filter(p => {
    if (statusFilter === 'draft') return p.status === 'draft';
    if (statusFilter === 'scheduled') return p.status === 'scheduled';
    return p.status !== 'published';
  });

  const handlePublishNow = async () => {
    if (!selected?.id) return;
    setSaving(true);
    setError('');
    try {
      await postsService.update(selected.id, { status: 'published', date: new Date() });
      setSuccess(`"${selected.title}" publicado agora!`);
      onScheduled();
    } catch {
      setError('Erro ao publicar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!selected?.id) return;
    setSaving(true);
    setError('');
    try {
      await postsService.update(selected.id, {
        status: 'scheduled',
        date: new Date(scheduleDate),
      });
      setSuccess(
        `"${selected.title}" agendado para ${new Date(scheduleDate).toLocaleString('pt-BR', {
          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
        })}`,
      );
      onScheduled();
    } catch {
      setError('Erro ao agendar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-black/50">
      <div className="bg-white w-full h-full md:h-auto md:max-h-[88vh] md:max-w-xl md:rounded-2xl md:shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">📅</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Agendar Publicação</h2>
              <p className="text-xs text-gray-400">
                {initialDate
                  ? `Para ${initialDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`
                  : 'Escolha um criativo e defina quando publicar'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {success ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-base font-semibold text-gray-900 mb-1">{success}</p>
              <button
                onClick={onClose}
                className="mt-6 bg-purple-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              {/* Section 1: Pick a criativo */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">1. Escolha o criativo</h3>
                  <div className="flex gap-1">
                    {STATUS_FILTER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setStatusFilter(opt.value as typeof statusFilter)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                          statusFilter === opt.value
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="text-sm">
                      {statusFilter === 'draft'
                        ? 'Nenhum rascunho encontrado.'
                        : 'Nenhum criativo encontrado.'}
                    </p>
                    <p className="text-xs mt-1">Crie criativos nas abas Instagram, Blog, Google ou E-mail.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {filtered.map(post => (
                      <button
                        key={post.id}
                        onClick={() => setSelected(s => s?.id === post.id ? null : post)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          selected?.id === post.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{CHANNEL_ICON[post.channel] ?? '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{post.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-400">{post.channel}</span>
                            {post.format && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                                {FORMAT_LABEL[post.format] ?? post.format}
                              </span>
                            )}
                            {post.status === 'scheduled' && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                📅 {post.date.toLocaleDateString('pt-BR')}
                              </span>
                            )}
                            {post.imageUrls && post.imageUrls.length > 0 && (
                              <span className="text-xs text-gray-400">🖼️ {post.imageUrls.length} img</span>
                            )}
                          </div>
                          {post.content && (
                            <p className="text-xs text-gray-400 mt-1 truncate">{post.content.slice(0, 80)}</p>
                          )}
                        </div>
                        {selected?.id === post.id && (
                          <span className="text-purple-600 shrink-0">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Action (only when a criativo is selected) */}
              {selected && (
                <div className="px-5 pb-5 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">2. Quando publicar?</h3>

                  {error && <p className="text-xs text-red-500 mb-3 text-center">{error}</p>}

                  <div className="space-y-3">
                    {/* Publish now */}
                    <button
                      onClick={handlePublishNow}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
                    >
                      {saving
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : '🚀'
                      }
                      Publicar Agora
                    </button>

                    {/* Schedule */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Agendar para</p>
                      </div>
                      <div className="p-4 space-y-3">
                        <input
                          type="datetime-local"
                          value={scheduleDate}
                          onChange={e => setScheduleDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                        <button
                          onClick={handleSchedule}
                          disabled={saving}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 hover:from-blue-600 hover:to-indigo-700 transition-all"
                        >
                          {saving
                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : '📅'
                          }
                          Agendar para{' '}
                          {new Date(scheduleDate).toLocaleString('pt-BR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchedulePickerModal;
