import React, { useState, useEffect } from 'react';
import { postsService, Post } from '../services/firebaseService';
import PostFormModal from './PostFormModal';

const CHANNEL_ICON: Record<string, string> = {
  Instagram: '📱',
  GMB: '📍',
  Blog: '📝',
  Email: '📧',
};

const STATUS_COLOR: Record<string, string> = {
  published: 'bg-green-200 border-green-400 text-green-900',
  scheduled: 'bg-blue-200 border-blue-400 text-blue-900',
  draft: 'bg-yellow-200 border-yellow-400 text-yellow-900',
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

const ContentCalendar: React.FC = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  const days = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = days[0].getDay();

  const getPostsForDay = (date: Date): Post[] => {
    return posts.filter(p => isSameDay(p.date, date));
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const handleDayClick = (date: Date) => {
    const dayPosts = getPostsForDay(date);
    if (dayPosts.length === 1) {
      setPostToEdit(dayPosts[0]);
      setShowPostModal(true);
    } else if (dayPosts.length > 1) {
      setSelectedDate(date);
    } else {
      // Create new post on this date
      setPostToEdit(undefined);
      setSelectedDate(null);
      setShowPostModal(true);
    }
  };

  // Stats
  const monthPosts = posts.filter(p => p.date.getMonth() === currentMonth && p.date.getFullYear() === currentYear);
  const scheduled = monthPosts.filter(p => p.status === 'scheduled').length;
  const published = monthPosts.filter(p => p.status === 'published').length;
  const drafts = monthPosts.filter(p => p.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Month stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">📅 Agendados</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">{scheduled}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-sm text-green-600 font-medium">✅ Publicados</p>
          <p className="text-2xl font-bold text-green-800 mt-1">{published}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-sm text-yellow-600 font-medium">✏️ Rascunhos</p>
          <p className="text-2xl font-bold text-yellow-800 mt-1">{drafts}</p>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button onClick={goToToday} className="text-sm text-purple-600 hover:text-purple-800 ml-2 font-medium">
              Hoje
            </button>
          </div>
          <button
            onClick={() => {
              setPostToEdit(undefined);
              setShowPostModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          >
            + Novo Post
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">
            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p>Carregando calendário...</p>
          </div>
        ) : (
          <>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the 1st */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[100px] p-1" />
              ))}

              {days.map((date) => {
                const dayPosts = getPostsForDay(date);
                const isToday = isSameDay(date, today);

                return (
                  <div
                    key={date.toISOString()}
                    onClick={() => handleDayClick(date)}
                    className={`min-h-[100px] p-1.5 border rounded-lg cursor-pointer transition-all hover:border-purple-300 hover:shadow-sm ${
                      isToday ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${isToday ? 'text-purple-700 font-bold' : 'text-gray-500'}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayPosts.slice(0, 3).map((post) => (
                        <div
                          key={post.id}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate ${STATUS_COLOR[post.status]}`}
                          title={`${post.title} (${post.channel})${post.status === 'scheduled' && post.channel === 'Instagram' ? ' • Será publicado automaticamente' : ''}`}
                        >
                          {CHANNEL_ICON[post.channel]} {post.title}
                          {post.status === 'scheduled' && post.channel === 'Instagram' && (
                            <span className="ml-1" aria-label="Será publicado automaticamente" title="Será publicado automaticamente">
                              ⏰
                            </span>
                          )}
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <div className="text-[10px] text-gray-400 px-1">
                          +{dayPosts.length - 3} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-3 h-3 rounded bg-green-200 border border-green-400" />
            Publicado
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-3 h-3 rounded bg-blue-200 border border-blue-400" />
            Agendado
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-400" />
            Rascunho
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span>⏰</span>
            Será publicado automaticamente
          </div>
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Posts em {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            {getPostsForDay(selectedDate).map(post => (
              <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{CHANNEL_ICON[post.channel]} {post.title}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_COLOR[post.status]}`}>
                    {post.status === 'published' ? 'Publicado' : post.status === 'scheduled' ? 'Agendado' : 'Rascunho'}
                  </span>
                  {post.status === 'scheduled' && post.channel === 'Instagram' && (
                    <p className="text-xs text-blue-700 mt-1">⏰ Será publicado automaticamente</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setPostToEdit(post);
                    setSelectedDate(null);
                    setShowPostModal(true);
                  }}
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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

export default ContentCalendar;
