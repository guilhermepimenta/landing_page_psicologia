import React, { useState, useEffect } from 'react';
import { messagesService, Message } from '../services/firebaseService';
import { MessageCircle, Phone, Mail, Trash2, CheckCheck, Eye, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
  nova: { label: 'Nova', class: 'bg-red-100 text-red-700' },
  lida: { label: 'Lida', class: 'bg-yellow-100 text-yellow-700' },
  respondida: { label: 'Respondida', class: 'bg-green-100 text-green-700' },
};

const MessagesInbox: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'todas' | Message['status']>('todas');

  const load = async () => {
    setLoading(true);
    const result = await messagesService.getAll();
    if (result.success) setMessages(result.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSelect = async (msg: Message) => {
    setSelected(msg);
    if (msg.status === 'nova' && msg.id) {
      await messagesService.updateStatus(msg.id, 'lida');
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: 'lida' } : m))
      );
    }
  };

  const handleStatus = async (id: string, status: Message['status']) => {
    await messagesService.updateStatus(id, status);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : s);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta mensagem?')) return;
    await messagesService.delete(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = filter === 'todas' ? messages : messages.filter((m) => m.status === filter);
  const novasCount = messages.filter((m) => m.status === 'nova').length;

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Lista */}
      <div className="w-full md:w-2/5 flex flex-col bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle size={20} className="text-purple-600" />
            <h2 className="font-semibold text-gray-800">Caixa de Entrada</h2>
            {novasCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {novasCount}
              </span>
            )}
          </div>
          <button onClick={load} className="text-gray-400 hover:text-purple-600 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-1 p-2 border-b bg-gray-50">
          {(['todas', 'nova', 'lida', 'respondida'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium capitalize transition-colors ${
                filter === f ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f === 'todas' ? 'Todas' : STATUS_CONFIG[f].label}
            </button>
          ))}
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto divide-y">
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhuma mensagem.</div>
          ) : (
            filtered.map((msg) => (
              <button
                key={msg.id}
                onClick={() => handleSelect(msg)}
                className={`w-full text-left p-4 hover:bg-purple-50 transition-colors ${
                  selected?.id === msg.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                } ${msg.status === 'nova' ? 'font-semibold' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm text-gray-900 truncate">{msg.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_CONFIG[msg.status].class}`}>
                    {STATUS_CONFIG[msg.status].label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{msg.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleString('pt-BR') : '—'}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detalhe */}
      <div className="hidden md:flex flex-1 flex-col bg-white rounded-xl shadow-md overflow-hidden">
        {selected ? (
          <>
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{selected.name}</h3>
                <p className="text-xs text-gray-400">
                  {selected.createdAt ? new Date(selected.createdAt).toLocaleString('pt-BR') : '—'}
                </p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_CONFIG[selected.status].class}`}>
                {STATUS_CONFIG[selected.status].label}
              </span>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* Contato */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5"><Mail size={14} /> {selected.email}</span>
                <span className="flex items-center gap-1.5"><Phone size={14} /> {selected.phone}</span>
              </div>

              {/* Mensagem */}
              <div className="bg-gray-50 rounded-xl p-4 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap border">
                {selected.message}
              </div>
            </div>

            {/* Ações */}
            <div className="p-4 border-t flex flex-wrap gap-2">
              <a
                href={`https://wa.me/55${selected.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${selected.name}, obrigada pelo contato!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => selected.id && handleStatus(selected.id, 'respondida')}
                className="flex-1 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.556 5.332-11.891 11.891-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.403 0 6.556-5.332 11.89-11.891 11.89-2.015 0-3.991-.512-5.747-1.487l-6.246 1.638zm5.836-5.046c1.656.984 3.279 1.484 4.964 1.484 5.422 0 9.835-4.413 9.835-9.835 0-2.628-1.022-5.1-2.871-6.951-1.848-1.847-4.331-2.87-6.964-2.87-5.422 0-9.835 4.413-9.835 9.835 0 1.904.537 3.74 1.554 5.31l-.995 3.634 3.671-.962zm10.103-6.887c-.198-.1-1.174-.58-1.356-.646-.182-.065-.315-.1-.448.1-.133.199-.513.646-.629.779-.117.133-.232.15-.429.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.117-.198-.013-.304.087-.403.09-.089.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.448-1.08-.614-1.482-.162-.389-.326-.335-.448-.341-.117-.005-.252-.006-.388-.006-.136 0-.356.05-.542.253-.187.203-.712.696-.712 1.697 0 1.002.728 1.97.83 2.103.101.133 1.43 2.184 3.465 3.063.483.209.86.335 1.154.428.484.154.925.132 1.273.08.388-.058 1.174-.48 1.34-.943.165-.463.165-.86.115-.943-.049-.084-.182-.133-.38-.232z" />
                </svg>
                Responder no WhatsApp
              </a>

              {selected.status !== 'respondida' && (
                <button
                  onClick={() => selected.id && handleStatus(selected.id, 'respondida')}
                  className="bg-green-100 hover:bg-green-200 text-green-700 text-sm font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <CheckCheck size={16} /> Marcar respondida
                </button>
              )}

              {selected.status === 'nova' && (
                <button
                  onClick={() => selected.id && handleStatus(selected.id, 'lida')}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-sm font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Eye size={16} /> Marcar lida
                </button>
              )}

              <button
                onClick={() => selected.id && handleDelete(selected.id)}
                className="bg-red-100 hover:bg-red-200 text-red-600 text-sm font-medium py-2.5 px-4 rounded-xl flex items-center gap-2 transition-colors"
              >
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm flex-col gap-3">
            <MessageCircle size={40} className="opacity-30" />
            <p>Selecione uma mensagem para ler</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesInbox;
