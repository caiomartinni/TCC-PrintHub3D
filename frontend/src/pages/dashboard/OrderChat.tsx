import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Send, Package, MessageSquare,
  CheckCheck, Check, RefreshCw, AlertTriangle,
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Avatar from '@/components/ui/Avatar';
import OrderStatusBadge from '@/components/shared/OrderStatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { chatService } from '@/services/chat.service';
import type { Chat, ChatMessage } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(dateStr: string): string {
  const d   = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) +
      ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, isMine }: { msg: ChatMessage; isMine: boolean }) {
  return (
    <div className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {!isMine && (
        <Avatar name={msg.sender.name} src={msg.sender.avatar ?? undefined} size="sm" />
      )}
      <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && (
          <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender.name}</span>
        )}
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
          isMine
            ? 'bg-gradient-to-br from-neon-blue to-neon-purple text-white rounded-br-sm'
            : 'glass border border-white/10 text-gray-200 rounded-bl-sm'
        }`}>
          {msg.content}
        </div>
        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-gray-600">{formatTime(msg.createdAt)}</span>
          {isMine && (
            msg.isRead
              ? <CheckCheck size={12} className="text-neon-blue" />
              : <Check      size={12} className="text-gray-600"   />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OrderChat() {
  const { id: orderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user }        = useAuth();
  const { error }       = useToast();

  const [chat,      setChat]      = useState<Chat | null>(null);
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [input,     setInput]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [polling,   setPolling]   = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLTextAreaElement>(null);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = (smooth = true) =>
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });

  // ── Load chat ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setLoadError(null);
    chatService.getOrCreate(orderId)
      .then((c) => {
        setChat(c);
        setMessages(c.messages ?? []);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        const msg    = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

        const friendlyMsg = status === 403
          ? 'Você não tem permissão para acessar esta conversa. Certifique-se de estar logado com a conta correta (cliente ou maker do pedido).'
          : status === 404
          ? 'Pedido não encontrado.'
          : msg || 'Não foi possível carregar a conversa. Verifique se o backend está rodando.';

        setLoadError(friendlyMsg);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => { if (!loading) scrollToBottom(false); }, [loading]);

  // ── Polling (5s) ──────────────────────────────────────────────────────────
  const pollMessages = useCallback(async () => {
    if (!chat?.id) return;
    setPolling(true);
    try {
      const { messages: fresh } = await chatService.getMessages(chat.id);
      setMessages(fresh);
    } catch { /* silent */ }
    finally { setPolling(false); }
  }, [chat?.id]);

  useEffect(() => {
    if (!chat?.id) return;
    pollInterval.current = setInterval(pollMessages, 5000);
    return () => { if (pollInterval.current) clearInterval(pollInterval.current); };
  }, [chat?.id, pollMessages]);

  useEffect(() => { scrollToBottom(); }, [messages.length]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (sending) return;

    if (!chat?.id) {
      error('Chat não carregado', 'Aguarde o carregamento da conversa e tente novamente.');
      return;
    }
    if (!input.trim()) return;

    const text = input.trim();
    setInput('');

    const optimistic: ChatMessage = {
      id:        `opt-${Date.now()}`,
      chatId:    chat.id,
      senderId:  user!.id,
      content:   text,
      isRead:    false,
      createdAt: new Date().toISOString(),
      sender:    { id: user!.id, name: user!.name, avatar: user?.avatar, role: user!.role },
    };
    setMessages(prev => [...prev, optimistic]);

    setSending(true);
    try {
      const saved = await chatService.sendMessage(chat.id, text);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? saved : m));
    } catch (err: unknown) {
      // Rollback optimistic message
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(text);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Não foi possível enviar a mensagem.';
      error('Erro ao enviar', msg);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Participants ──────────────────────────────────────────────────────────
  const otherParticipant = chat?.order
    ? user?.id === chat.order.client.id
      ? chat.order.maker.user
      : chat.order.client
    : null;

  const orderName = chat?.order?.items?.[0]?.product?.name
    ?? `Pedido #${(orderId ?? '').slice(-8).toUpperCase()}`;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    /* Full-screen flex layout — sidebar + chat column */
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <Sidebar />

      {/* Chat column — fills remaining width, fixed height */}
      <div className="flex flex-col flex-1 min-w-0 h-screen">

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 glass-dark shrink-0">
          <button onClick={() => navigate(-1)} className="btn-ghost !p-2 shrink-0">
            <ChevronLeft size={20} />
          </button>

          {otherParticipant ? (
            <>
              <Avatar name={otherParticipant.name} src={otherParticipant.avatar ?? undefined} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{otherParticipant.name}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                  <Package size={10} /> {orderName}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MessageSquare size={18} className="text-neon-blue shrink-0" />
              <span className="font-bold text-white truncate">{orderName}</span>
            </div>
          )}

          {chat?.order && <OrderStatusBadge status={chat.order.status} />}

          <button
            onClick={pollMessages}
            className="btn-ghost !p-2 text-gray-400 shrink-0"
            title="Atualizar"
          >
            <RefreshCw size={16} className={polling ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ── Messages — scrollable area ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-2 text-gray-500 text-sm">
              <span className="w-4 h-4 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
              Carregando conversa...
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400"><AlertTriangle size={22} /></div>
              <p className="text-red-400 font-semibold text-sm">Não foi possível carregar a conversa</p>
              <p className="text-gray-500 text-xs leading-relaxed max-w-sm">{loadError}</p>
              <button
                onClick={() => { setLoadError(null); setLoading(true);
                  chatService.getOrCreate(orderId ?? '').then(c => { setChat(c); setMessages(c.messages ?? []); })
                    .catch((e: unknown) => setLoadError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Erro ao carregar'))
                    .finally(() => setLoading(false));
                }}
                className="btn-secondary text-sm"
              >
                Tentar novamente
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <MessageSquare size={40} className="text-gray-700" />
              <p className="text-gray-400 text-sm">Nenhuma mensagem ainda.</p>
              <p className="text-gray-600 text-xs">Seja o primeiro a enviar uma mensagem!</p>
            </div>
          ) : (
            messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMine={msg.senderId === user?.id}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar — always at bottom ── */}
        <div className="shrink-0 border-t border-white/5 bg-[#0d0d0d] px-6 py-4">
          {!chat && !loading && (
            <p className="text-center text-sm text-red-400 mb-2 flex items-center justify-center gap-1.5">
              <AlertTriangle size={14} />Conversa não carregada. Recarregue a página.
            </p>
          )}

          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <div className={`flex-1 glass rounded-xl border transition-colors ${
              chat
                ? 'border-white/10 focus-within:border-neon-blue/40'
                : 'border-white/5 opacity-50'
            }`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!chat || loading}
                placeholder={
                  loading
                    ? 'Carregando conversa...'
                    : !chat
                    ? 'Conversa não disponível'
                    : 'Digite sua mensagem… (Enter envia, Shift+Enter nova linha)'
                }
                rows={1}
                className="w-full bg-transparent text-white text-sm px-4 py-3 resize-none outline-none placeholder-gray-600 disabled:cursor-not-allowed"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                }}
              />
            </div>

            {/* ── SEND BUTTON ── */}
            <button
              onClick={handleSend}
              disabled={!chat || !input.trim() || sending || loading}
              title={!chat ? 'Aguarde o carregamento' : 'Enviar mensagem (Enter)'}
              className="
                flex items-center justify-center
                w-12 h-12 shrink-0 rounded-xl
                bg-gradient-to-br from-neon-blue to-neon-purple
                text-white
                hover:opacity-90 active:scale-95
                transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              {sending
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send size={18} />
              }
            </button>
          </div>

          <p className="text-center text-xs text-gray-700 mt-2">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
}
