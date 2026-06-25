import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, FileText, Heart, Bell, ArrowRight,
  Clock, Package, ChevronRight, RefreshCw,
  MapPin, MessageSquare, Star, Plus,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import OrderStatusBadge from '@/components/shared/OrderStatusBadge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { ordersService } from '@/services/orders.service';
import { quotesService } from '@/services/quotes.service';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Order, QuoteRequest, QuoteResponse, MakerProfile, User } from '@/types';

interface QuoteWithResponses extends QuoteRequest {
  responses: (QuoteResponse & { maker?: MakerProfile & { user?: Pick<User, 'name'|'avatar'> } })[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'agora';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

const ORDER_STEPS = ['PENDING','CONFIRMED','PRINTING','QUALITY_CHECK','SHIPPED','DELIVERED'];

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const { notifications, unreadCount } = useNotifications();
  const { favoriteProducts }           = useFavorites();

  const [orders,   setOrders]   = useState<Order[]>([]);
  const [quotes,   setQuotes]   = useState<QuoteWithResponses[]>([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ordRes, quotRes] = await Promise.all([
        ordersService.getAll(),
        quotesService.getAll(),
      ]);
      setOrders(ordRes.data);
      setQuotes(quotRes.data as QuoteWithResponses[]);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeOrders   = orders.filter(o => !['DELIVERED','CANCELLED','REFUNDED'].includes(o.status));
  const openQuotes     = quotes.filter(q => q.status === 'OPEN');
  const pendingQuotes  = quotes.filter(q => q.responses?.some(r => r.status === 'PENDING') && q.status !== 'ACCEPTED');
  const nextDelivery   = activeOrders.find(o => o.estimatedAt);

  const stats = [
    {
      icon: ShoppingBag, label: 'Pedidos Ativos',
      value: activeOrders.length, color: 'text-neon-blue', bg: 'bg-neon-blue/10',
      to: '/dashboard/client/orders',
    },
    {
      icon: FileText, label: 'Orçamentos',
      value: openQuotes.length + pendingQuotes.length, color: 'text-neon-purple', bg: 'bg-neon-purple/10',
      to: '/dashboard/client/quotes',
      badge: pendingQuotes.length > 0 ? `${pendingQuotes.length} nova${pendingQuotes.length > 1 ? 's' : ''}` : undefined,
    },
    {
      icon: Heart, label: 'Favoritos',
      value: favoriteProducts.length, color: 'text-red-400', bg: 'bg-red-400/10',
      to: '/dashboard/client/favorites',
    },
    {
      icon: Bell, label: 'Notificações',
      value: unreadCount, color: 'text-yellow-400', bg: 'bg-yellow-400/10',
      to: '/dashboard/client/notifications',
    },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">
            Olá, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-400 mt-1">
            {loading ? 'Carregando...' : `${activeOrders.length} pedido${activeOrders.length !== 1 ? 's' : ''} ativo${activeOrders.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={load} className="btn-ghost !p-2" title="Atualizar">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value, color, bg, to, badge }) => (
          <Link key={label} to={to}
            className="glass rounded-2xl p-5 border border-white/5 hover:border-white/15 hover:scale-[1.02] transition-all group"
          >
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-white">{value}</span>
              {badge && (
                <span className="text-xs bg-neon-blue text-[#0a0a0a] font-bold px-1.5 py-0.5 rounded-full mb-0.5">
                  {badge}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs text-gray-400">{label}</span>
              <ArrowRight size={12} className="text-gray-700 group-hover:text-gray-400 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag size={16} className="text-neon-blue" /> Pedidos Ativos
              </h2>
              <Link to="/dashboard/client/orders" className="btn-ghost text-sm">
                Ver todos <ArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="glass rounded-2xl p-8 border border-white/5 text-center text-gray-500 text-sm">
                Carregando pedidos...
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="glass rounded-2xl p-8 border border-white/5 text-center">
                <ShoppingBag size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Nenhum pedido ativo no momento.</p>
                <Link to="/marketplace" className="inline-flex items-center gap-1 text-neon-blue text-sm mt-3 hover:underline">
                  Explorar marketplace <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {activeOrders.slice(0, 3).map(order => {
                  const stepIdx  = ORDER_STEPS.indexOf(order.status);
                  const progress = stepIdx >= 0 ? Math.round(((stepIdx + 1) / ORDER_STEPS.length) * 100) : 0;
                  const title    = order.notes ?? order.items?.[0]?.product?.name ?? `Pedido #${order.id.slice(-8).toUpperCase()}`;
                  const makerName = order.maker?.user?.name ?? order.maker?.companyName ?? 'Maker';

                  return (
                    <Link key={order.id} to={`/order/${order.id}`}
                      className="block glass rounded-2xl p-4 border border-white/5 hover:border-neon-blue/20 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="font-mono text-xs text-gray-600">#{order.id.slice(-8).toUpperCase()}</span>
                            <OrderStatusBadge status={order.status} />
                          </div>
                          <p className="font-semibold text-white text-sm truncate">{title}</p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                            <Avatar name={makerName} src={order.maker?.user?.avatar} size="sm" />
                            <span>{makerName}</span>
                            {order.maker?.city && <><MapPin size={9} /><span>{order.maker.city}</span></>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-white">{formatCurrency(order.total)}</p>
                          {order.estimatedAt && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              <Clock size={9} className="inline mr-0.5" />
                              {formatDate(order.estimatedAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full transition-all duration-700"
                            style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-700">
                          {['Criado','Confirmado','Imprimindo','QA','Enviado','Entregue'].map((s, i) => (
                            <span key={s} className={i <= stepIdx ? 'text-neon-blue' : ''}>{s}</span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
                        <Link to={`/order/${order.id}/chat`} onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-neon-blue transition-colors">
                          <MessageSquare size={12} /> Chat
                        </Link>
                        <span className="ml-auto flex items-center gap-1 text-xs text-gray-600 group-hover:text-white transition-colors">
                          Ver detalhes <ChevronRight size={12} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quotes with pending proposals */}
          {pendingQuotes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText size={16} className="text-neon-purple" /> Propostas Aguardando Resposta
                  <span className="text-xs bg-neon-blue text-[#0a0a0a] font-bold px-2 py-0.5 rounded-full">
                    {pendingQuotes.length}
                  </span>
                </h2>
                <Link to="/dashboard/client/quotes" className="btn-ghost text-sm">
                  Ver todas <ArrowRight size={13} />
                </Link>
              </div>
              <div className="space-y-3">
                {pendingQuotes.slice(0, 2).map(q => {
                  const pending = q.responses?.filter(r => r.status === 'PENDING') ?? [];
                  return (
                    <Link key={q.id} to="/dashboard/client/quotes"
                      className="block glass rounded-xl p-4 border border-neon-blue/20 bg-neon-blue/3 hover:border-neon-blue/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{q.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(q.createdAt)}</p>
                        </div>
                        <span className="text-xs bg-neon-blue text-[#0a0a0a] font-bold px-2 py-1 rounded-full shrink-0">
                          {pending.length} proposta{pending.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Favorites preview */}
          {favoriteProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Heart size={16} className="text-red-400" /> Favoritos
                </h2>
                <Link to="/dashboard/client/favorites" className="btn-ghost text-sm">
                  Ver todos <ArrowRight size={13} />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {favoriteProducts.slice(0, 3).map(p => {
                  const imgs = p.images as string[];
                  return (
                    <Link key={p.id} to={`/product/${p.slug}`}
                      className="glass rounded-xl border border-white/5 hover:border-white/15 overflow-hidden group transition-all"
                    >
                      <div className="aspect-square overflow-hidden bg-dark-700">
                        <img src={imgs[0] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200'}
                          alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-semibold text-white line-clamp-1">{p.name}</p>
                        <p className="text-xs text-neon-blue font-bold mt-0.5">{formatCurrency(p.price)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="space-y-5">

          {/* Next delivery */}
          {nextDelivery ? (
            <div className="glass rounded-2xl p-5 border border-neon-blue/15 bg-neon-blue/5">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-neon-blue" />
                <span className="font-bold text-white text-sm">Próxima Entrega</span>
              </div>
              <p className="text-2xl font-black text-white">
                {Math.max(0, Math.ceil((new Date(nextDelivery.estimatedAt!).getTime() - Date.now()) / 86400000))} dias
              </p>
              <p className="text-xs text-gray-400 mt-1 truncate">
                {nextDelivery.notes ?? nextDelivery.items?.[0]?.product?.name ?? `Pedido #${nextDelivery.id.slice(-8).toUpperCase()}`}
              </p>
              <Link to={`/order/${nextDelivery.id}`}>
                <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
                  Rastrear Pedido
                </Button>
              </Link>
            </div>
          ) : (
            <div className="glass rounded-2xl p-5 border border-white/5 text-center">
              <Package size={28} className="text-gray-700 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Nenhuma entrega prevista</p>
              <Link to="/marketplace">
                <Button size="sm" className="mt-3 w-full text-xs"><Plus size={12} /> Fazer Pedido</Button>
              </Link>
            </div>
          )}

          {/* Quick actions */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <h3 className="font-bold text-white mb-3 text-sm">Ações Rápidas</h3>
            <div className="space-y-1.5">
              {[
                { to: '/marketplace',    icon: <Package  size={14} className="text-neon-blue"   />, label: 'Explorar Marketplace',  bg: 'bg-neon-blue/10'   },
                { to: '/quote/request',  icon: <FileText size={14} className="text-neon-purple" />, label: 'Solicitar Orçamento',   bg: 'bg-neon-purple/10' },
                { to: '/dashboard/client/favorites', icon: <Heart size={14} className="text-red-400"/>, label: 'Meus Favoritos', bg: 'bg-red-400/10' },
              ].map(({ to, icon, label, bg }) => (
                <Link key={to} to={to}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center shrink-0`}>{icon}</div>
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex-1">{label}</span>
                  <ArrowRight size={12} className="text-gray-700 group-hover:text-gray-400" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent notifications */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Bell size={14} className="text-yellow-400" /> Notificações
              </h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-neon-blue text-[#0a0a0a] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4">Nenhuma notificação</p>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 4).map(n => (
                  <button key={n.id} onClick={() => navigate(
                    n.type === 'ORDER_UPDATE' ? '/dashboard/client/orders' :
                    n.type.includes('QUOTE') ? '/dashboard/client/quotes' :
                    '/dashboard/client/notifications'
                  )}
                    className={`w-full text-left p-2.5 rounded-xl transition-all ${
                      !n.isRead ? 'bg-neon-blue/8 border border-neon-blue/15' : 'hover:bg-white/3'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-neon-blue mt-1 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white line-clamp-1">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.message}</p>
                      </div>
                      <span className="text-[10px] text-gray-700 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                    </div>
                  </button>
                ))}
                <Link to="/dashboard/client/notifications"
                  className="block text-center text-xs text-gray-500 hover:text-neon-blue transition-colors pt-1">
                  Ver todas →
                </Link>
              </div>
            )}
          </div>

          {/* Rating reminder if delivered orders exist */}
          {orders.some(o => o.status === 'DELIVERED') && (
            <div className="glass rounded-2xl p-4 border border-yellow-400/15 bg-yellow-400/3">
              <div className="flex items-center gap-2 mb-2">
                <Star size={14} className="text-yellow-400" />
                <span className="text-sm font-bold text-white">Avalie seu pedido</span>
              </div>
              <p className="text-xs text-gray-400">Você tem pedidos entregues aguardando avaliação.</p>
              <Link to="/dashboard/client/orders">
                <button className="mt-3 w-full text-xs py-1.5 rounded-lg border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 transition-colors">
                  Avaliar agora
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
