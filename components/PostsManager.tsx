import React, { useState, useEffect } from 'react';
import { postsService, Post } from '../services/firebaseService';
import { publishToInstagram } from '../services/instagramService';
import { publishToFacebook } from '../services/facebookService';
import { prepareImagesForInstagram } from '../services/imageService';
import PostFormModal from './PostFormModal';
import ContentStudio from './ContentStudio';
import AdaptContentModal from './AdaptContentModal';
import CampaignStudio from './CampaignStudio';

const CHANNEL_OPTIONS = ['Todos', 'Instagram', 'GMB', 'Blog', 'Email'] as const;
const STATUS_OPTIONS = ['Todos', 'published', 'scheduled', 'draft'] as const;

const STATUS_LABELS: Record<string, string> = {
  published: '✅ Publicado',
  scheduled: '📅 Agendado',
  draft: '✏️ Rascunho',
};

const STATUS_BADGE: Record<string, string> = {
  published: 'bg-green-100 text-green-800',
  scheduled: 'bg-blue-100 text-blue-800',
  draft: 'bg-yellow-100 text-yellow-800',
};

const CHANNEL_ICON: Record<string, string> = {
  Instagram: '📱',
  GMB: '📍',
  Blog: '📝',
  Email: '📧',
};

interface PostsManagerProps {
  fixedChannel?: Post['channel'];
}

const CHANNEL_META: Record<NonNullable<Post['channel']>, { label: string; icon: string; emptyIcon: string }> = {
  Instagram: { label: 'Criativos Instagram', icon: '📱', emptyIcon: '📱' },
  Blog:      { label: 'Artigos do Blog',      icon: '📝', emptyIcon: '📝' },
  GMB:       { label: 'Google Meu Negócio',   icon: '📍', emptyIcon: '📍' },
  Facebook:  { label: 'Posts do Facebook',    icon: '📘', emptyIcon: '📘' },
  Email:     { label: 'Campanhas de E-mail',  icon: '📧', emptyIcon: '📧' },
};

const PostsManager: React.FC<PostsManagerProps> = ({ fixedChannel }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterChannel, setFilterChannel] = useState<string>(fixedChannel ?? 'Todos');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [showCampaign, setShowCampaign] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | undefined>(undefined);
  const [postToAdapt, setPostToAdapt] = useState<Post | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<{ id: string; message: string } | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const result = await postsService.getAll();
      if (result.success) {
        setPosts(result.data);
      }
    } catch (err) {
      console.error('Erro ao carregar posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const channelPosts = fixedChannel ? posts.filter(p => p.channel === fixedChannel) : posts;

  const filteredPosts = channelPosts.filter((post) => {
    const matchStatus = filterStatus === 'Todos' || post.status === filterStatus;
    return matchStatus;
  });

  const handlePublish = async (post: Post) => {
    if (!post.id) return;
    setPublishingId(post.id);
    setPublishError(null);
    try {
      if (post.channel === 'Instagram') {
        if (!post.imageUrls || post.imageUrls.length === 0) {
          throw new Error('O post precisa ter pelo menos uma imagem para publicar no Instagram.');
        }
        const readyUrls = await prepareImagesForInstagram(post.imageUrls);
        const igResult  = await publishToInstagram(readyUrls, post.content ?? '');
        await postsService.update(post.id, {
          status: 'published',
          instagramPostId: igResult.instagramPostId,
          instagramPermalink: igResult.instagramPermalink,
        });
      } else if (post.channel === 'Facebook') {
        await publishToFacebook(post.content ?? '', post.imageUrls?.[0]);
        await postsService.update(post.id, { status: 'published' });
      } else {
        // Blog, Email, GMB — sem API de publicação direta, apenas marca como publicado
        await postsService.update(post.id, { status: 'published' });
      }
      fetchPosts();
    } catch (e: any) {
      setPublishError({ id: post.id, message: e?.message ?? 'Erro desconhecido' });
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (post: Post) => {
    if (!post.id || !window.confirm('Tem certeza que deseja excluir este post?')) return;
    await postsService.delete(post.id);
    fetchPosts();
  };

  const counts = {
    total: channelPosts.length,
    published: channelPosts.filter(p => p.status === 'published').length,
    scheduled: channelPosts.filter(p => p.status === 'scheduled').length,
    draft: channelPosts.filter(p => p.status === 'draft').length,
  };

  const meta = fixedChannel ? CHANNEL_META[fixedChannel] : null;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.total, color: 'bg-gray-100 text-gray-800' },
          { label: 'Publicados', value: counts.published, color: 'bg-green-100 text-green-800' },
          { label: 'Agendados', value: counts.scheduled, color: 'bg-blue-100 text-blue-800' },
          { label: 'Rascunhos', value: counts.draft, color: 'bg-yellow-100 text-yellow-800' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <p className="text-sm font-medium opacity-70">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{loading ? '—' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {meta && <span>{meta.icon}</span>}
            {meta ? meta.label : 'Todos os Criativos'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCampaign(true)}
              className="bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md flex items-center gap-1.5"
            >
              <span>🎯</span> Criar Série
            </button>
            <button
              onClick={() => setShowStudio(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-md flex items-center gap-1.5"
            >
              <span>✨</span> Content Studio
            </button>
            <button
              onClick={() => { setPostToEdit(undefined); setShowPostModal(true); }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Manual
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {!fixedChannel && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Canal:</label>
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                {CHANNEL_OPTIONS.map(ch => (
                  <option key={ch} value={ch}>{ch === 'Todos' ? '🔗 Todos os Canais' : `${CHANNEL_ICON[ch]} ${ch}`}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
            >
              <option value="Todos">Todos os Status</option>
              {STATUS_OPTIONS.filter(s => s !== 'Todos').map(st => (
                <option key={st} value={st}>{STATUS_LABELS[st]}</option>
              ))}
            </select>
          </div>
          {filterStatus !== 'Todos' && (
            <button
              onClick={() => setFilterStatus('Todos')}
              className="text-sm text-purple-600 hover:text-purple-800 underline"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p>Carregando posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">{meta?.emptyIcon ?? '📋'}</div>
            <p className="text-lg">
              {channelPosts.length === 0 ? 'Nenhum criativo ainda.' : 'Nenhum criativo encontrado com esse filtro.'}
            </p>
            <p className="text-sm mt-2">
              {channelPosts.length === 0
                ? 'Use o Content Studio para criar o primeiro.'
                : 'Tente alterar o filtro de status acima.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  {!fixedChannel && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canal</th>}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engajamento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 max-w-xs">
                        {post.imageUrls?.[0] ? (
                          <img
                            src={post.imageUrls[0]}
                            alt={post.title}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 flex-shrink-0">
                            🖼️
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{post.title}</div>
                          {post.content && (
                            <div className="text-xs text-gray-400 mt-0.5 truncate">{post.content.slice(0, 60)}...</div>
                          )}
                          {post.imageUrls && post.imageUrls.length > 1 && (
                            <div className="text-xs text-purple-600 mt-1">{post.imageUrls.length} imagens</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {!fixedChannel && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {CHANNEL_ICON[post.channel]} <span className="ml-1">{post.channel}</span>
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[post.status]}`}>
                          {STATUS_LABELS[post.status]}
                        </span>
                        {post.instagramPostId && (
                          post.instagramPermalink ? (
                            <a
                              href={post.instagramPermalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800 hover:bg-pink-200 transition-colors"
                            >
                              📱 No Instagram →
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                              📱 No Instagram
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.date.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.engagement ? `❤️ ${post.engagement}` : '—'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => { setPostToEdit(post); setShowPostModal(true); }}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Editar
                      </button>
                      {post.status !== 'published' && (
                        <button
                          onClick={() => handlePublish(post)}
                          disabled={publishingId === post.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-wait"
                        >
                          {publishingId === post.id ? 'Publicando...' : 'Publicar'}
                        </button>
                      )}
                      {publishError?.id === post.id && (
                        <span className="text-xs text-red-500 block mt-1">
                          ⚠ {publishError.message}
                        </span>
                      )}
                      <button
                        onClick={() => setPostToAdapt(post)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Adaptar para outros canais"
                      >
                        Adaptar →
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPostModal && (
        <PostFormModal
          onClose={() => setShowPostModal(false)}
          onSaved={() => { setShowPostModal(false); fetchPosts(); }}
          postToEdit={postToEdit}
        />
      )}

      {showStudio && (
        <ContentStudio
          onClose={() => setShowStudio(false)}
          onSaved={() => { setShowStudio(false); fetchPosts(); }}
          initialChannel={fixedChannel}
        />
      )}

      {showCampaign && (
        <CampaignStudio
          onClose={() => setShowCampaign(false)}
          onSaved={() => fetchPosts()}
          initialChannel={fixedChannel}
        />
      )}

      {postToAdapt && (
        <AdaptContentModal
          post={postToAdapt}
          onClose={() => setPostToAdapt(null)}
          onSaved={() => { fetchPosts(); }}
        />
      )}
    </div>
  );
};

export default PostsManager;
