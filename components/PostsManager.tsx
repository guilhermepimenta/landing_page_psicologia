import React, { useState, useEffect } from 'react';
import { postsService, Post } from '../services/firebaseService';
import PostFormModal from './PostFormModal';

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

const PostsManager: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterChannel, setFilterChannel] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [showPostModal, setShowPostModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | undefined>(undefined);

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

  const filteredPosts = posts.filter((post) => {
    const matchChannel = filterChannel === 'Todos' || post.channel === filterChannel;
    const matchStatus = filterStatus === 'Todos' || post.status === filterStatus;
    return matchChannel && matchStatus;
  });

  const handlePublish = async (post: Post) => {
    if (!post.id) return;
    await postsService.update(post.id, { status: 'published' });
    fetchPosts();
  };

  const handleDelete = async (post: Post) => {
    if (!post.id || !window.confirm('Tem certeza que deseja excluir este post?')) return;
    await postsService.delete(post.id);
    fetchPosts();
  };

  const counts = {
    total: posts.length,
    published: posts.filter(p => p.status === 'published').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    draft: posts.filter(p => p.status === 'draft').length,
  };

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
          <h2 className="text-xl font-semibold text-gray-900">Gerenciar Posts</h2>
          <button
            onClick={() => {
              setPostToEdit(undefined);
              setShowPostModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            + Novo Post
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
          {(filterChannel !== 'Todos' || filterStatus !== 'Todos') && (
            <button
              onClick={() => { setFilterChannel('Todos'); setFilterStatus('Todos'); }}
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
            <div className="text-6xl mb-4">📱</div>
            <p className="text-lg">
              {posts.length === 0 ? 'Nenhum post criado ainda.' : 'Nenhum post encontrado com esses filtros.'}
            </p>
            <p className="text-sm mt-2">
              {posts.length === 0
                ? 'Clique em "+ Novo Post" para começar.'
                : 'Tente alterar os filtros acima.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Canal</th>
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
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {CHANNEL_ICON[post.channel]} <span className="ml-1">{post.channel}</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[post.status]}`}>
                        {STATUS_LABELS[post.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.date.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.engagement ? `❤️ ${post.engagement}` : '—'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setPostToEdit(post);
                          setShowPostModal(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Editar
                      </button>
                      {post.status !== 'published' && (
                        <button
                          onClick={() => handlePublish(post)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Publicar
                        </button>
                      )}
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
          onSaved={() => {
            setShowPostModal(false);
            fetchPosts();
          }}
          postToEdit={postToEdit}
        />
      )}
    </div>
  );
};

export default PostsManager;
