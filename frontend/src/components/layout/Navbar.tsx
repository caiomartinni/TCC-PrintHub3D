import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, ShoppingCart, Menu, X, ChevronDown,
  User, LogOut, Settings, Package, Check, CheckCheck,
  FileText, Star, DollarSign, RefreshCw, MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

function NotifIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ReactNode; color: string }> = {
    ORDER_UPDATE:      { icon: <Package       size={14} />, color: 'text-neon-blue'   },
    QUOTE_RECEIVED:    { icon: <FileText      size={14} />, color: 'text-neon-purple' },
    QUOTE_ACCEPTED:    { icon: <Check         size={14} />, color: 'text-emerald-400' },
    PAYMENT_CONFIRMED: { icon: <DollarSign    size={14} />, color: 'text-emerald-400' },
    REVIEW_RECEIVED:   { icon: <Star          size={14} />, color: 'text-yellow-400'  },
    NEW_MESSAGE:       { icon: <MessageSquare size={14} />, color: 'text-neon-purple' },
    SYSTEM:            { icon: <Bell          size={14} />, color: 'text-gray-400'    },
  };
  const s = map[type] ?? map['SYSTEM']!;
  return <span className={s.color}>{s.icon}</span>;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'agora';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

// Determine where to navigate based on notification type + user role
function getNotifLink(type: string, role: string, data?: Record<string, unknown>): string {
  const isMaker = role === 'MAKER';
  switch (type) {
    case 'NEW_MESSAGE': {
      const orderId = data?.orderId as string | undefined;
      return orderId ? `/order/${orderId}/chat` : (isMaker ? '/dashboard/maker/orders' : '/dashboard/client/orders');
    }
    case 'ORDER_UPDATE':
      return isMaker ? '/dashboard/maker/orders' : '/dashboard/client/orders';
    case 'QUOTE_RECEIVED':
      return isMaker ? '/dashboard/maker/quotes' : '/dashboard/client/quotes';
    case 'QUOTE_ACCEPTED':
      return isMaker ? '/dashboard/maker/quotes' : '/dashboard/client/quotes';
    case 'PAYMENT_CONFIRMED':
      return '/dashboard/client/orders';
    case 'REVIEW_RECEIVED':
      return '/dashboard/maker/reviews';
    case 'SYSTEM':
    default:
      return isMaker ? '/dashboard/maker/quotes' : '/dashboard/client/quotes';
  }
}

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, openCart } = useCart();
  const { notifications, unreadCount, loading, refresh, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen,  setNotifOpen]  = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);

  // Fecha os menus suspensos ao clicar em qualquer lugar fora deles
  useEffect(() => {
    if (!userMenuOpen && !notifOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuOpen && !userMenuRef.current?.contains(target)) setUserMenuOpen(false);
      if (notifOpen    && !notifRef.current?.contains(target))    setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, notifOpen]);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const dashboardPath =
    user?.role === 'ADMIN' ? '/admin' :
    user?.role === 'MAKER' ? '/dashboard/maker' :
    '/dashboard/client';

  const notifPath =
    user?.role === 'MAKER' ? '/dashboard/maker/notifications' :
    '/dashboard/client/notifications';

  const handleNotifClick = async (id: string, type: string, isRead: boolean, data?: Record<string, unknown>) => {
    if (!isRead) await markRead(id);
    setNotifOpen(false);
    navigate(getNotifLink(type, user?.role ?? '', data));
  };

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-40 glass-dark border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/logo.jpg" alt="PrintHub3D" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
            <span className="font-bold text-white text-xl">
              Print<span className="gradient-text">Hub3D</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/quote/request"  className="btn-ghost">Orçamento</Link>
            <Link to="/marketplace"    className="btn-ghost">Marketplace</Link>
            <Link to="/makers"         className="btn-ghost">Makers</Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* ── Notification Bell ── */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); if (!notifOpen) refresh(); }}
                    className="btn-ghost !p-2 relative"
                    title="Notificações"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-neon-blue text-[#0a0a0a] text-[10px] font-bold flex items-center justify-center leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <>
                      <div className="absolute right-0 mt-2 w-96 z-20 animate-fade-in flex flex-col max-h-[520px] rounded-xl overflow-hidden shadow-2xl"
                        style={{ background: '#131313', border: '1px solid rgba(255,255,255,0.15)' }}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 shrink-0"
                          style={{ background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.12)' }}
                        >
                          <div className="flex items-center gap-2">
                            <Bell size={15} className="text-neon-blue" />
                            <span className="font-bold text-white text-sm">Notificações</span>
                            {unreadCount > 0 && (
                              <span className="text-xs bg-neon-blue text-[#0a0a0a] font-bold px-2 py-0.5 rounded-full">
                                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={refresh} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Atualizar">
                              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                            </button>
                            {unreadCount > 0 && (
                              <button onClick={markAllRead} className="p-1.5 rounded-lg text-gray-400 hover:text-neon-blue hover:bg-neon-blue/10 transition-colors text-xs flex items-center gap-1" title="Marcar todas como lidas">
                                <CheckCheck size={13} /> Lidas
                              </button>
                            )}
                          </div>
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto flex-1">
                          {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#222' }}>
                                <Bell size={22} className="text-gray-500" />
                              </div>
                              <p className="text-sm text-gray-400 font-medium">Nenhuma notificação</p>
                              <p className="text-xs text-gray-600">Você está em dia!</p>
                            </div>
                          ) : (
                            notifications.slice(0, 15).map((n) => (
                              <button
                                key={n.id}
                                onClick={() => handleNotifClick(n.id, n.type, n.isRead, n.data)}
                                className="w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors"
                                style={{
                                  background: !n.isRead ? 'rgba(0,212,255,0.06)' : 'transparent',
                                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = !n.isRead ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.05)')}
                                onMouseLeave={e => (e.currentTarget.style.background = !n.isRead ? 'rgba(0,212,255,0.06)' : 'transparent')}
                              >
                                {/* Icon */}
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                  style={{ background: !n.isRead ? 'rgba(0,212,255,0.2)' : '#222' }}
                                >
                                  <NotifIcon type={n.type} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold leading-snug text-white">
                                    {n.title}
                                  </p>
                                  <p className="text-xs mt-0.5 leading-relaxed line-clamp-2" style={{ color: '#aaa' }}>
                                    {n.message}
                                  </p>
                                  <p className="text-[11px] mt-1.5 font-medium" style={{ color: !n.isRead ? '#00d4ff99' : '#666' }}>
                                    {timeAgo(n.createdAt)}
                                  </p>
                                </div>

                                {/* Unread indicator */}
                                {!n.isRead && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-neon-blue shrink-0 mt-2 shadow-neon-blue" />
                                )}
                              </button>
                            ))
                          )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                          <div className="shrink-0 p-3" style={{ background: '#1a1a1a', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                            <Link
                              to={notifPath}
                              onClick={() => setNotifOpen(false)}
                              className="block w-full text-center text-xs font-semibold text-neon-blue hover:text-white py-2 rounded-lg transition-colors hover:bg-neon-blue/10"
                            >
                              Ver todas as notificações →
                            </Link>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Cart */}
                <button onClick={openCart} className="btn-ghost !p-2 relative">
                  <ShoppingCart size={20} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-neon-blue text-[#0a0a0a] text-[10px] font-bold flex items-center justify-center leading-none">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                    className="flex items-center gap-2 btn-ghost !px-2"
                  >
                    <Avatar name={user?.name} src={user?.avatar} size="sm" />
                    <span className="hidden md:block text-sm font-medium text-white max-w-[100px] truncate">
                      {user?.name}
                    </span>
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="absolute right-0 mt-2 w-60 z-20 animate-fade-in rounded-xl overflow-hidden shadow-2xl"
                        style={{ background: '#131313', border: '1px solid rgba(255,255,255,0.15)' }}
                      >
                        {/* User info */}
                        <div className="px-4 py-3.5 flex items-center gap-3"
                          style={{ background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.12)' }}
                        >
                          <Avatar name={user?.name} src={user?.avatar} size="md" />
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate">{user?.name}</p>
                            <p className="text-xs truncate" style={{ color: '#888' }}>{user?.email}</p>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-1">
                          {[
                            { to: dashboardPath, icon: <Package size={16} />, label: 'Dashboard' },
                            { to: '/profile',    icon: <User    size={16} />, label: 'Perfil'        },
                            { to: '/settings',   icon: <Settings size={16}/>, label: 'Configurações' },
                          ].map(({ to, icon, label }) => (
                            <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                              style={{ color: '#ccc' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ccc'; }}
                            >
                              <span style={{ color: '#666' }}>{icon}</span>
                              {label}
                            </Link>
                          ))}
                        </div>

                        {/* Logout */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.10)' }}>
                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                            style={{ color: '#f87171' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <LogOut size={16} /> Sair
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate('/login')}>Entrar</Button>
                <Button onClick={() => navigate('/register')}>Cadastrar</Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden btn-ghost !p-2">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 py-4 space-y-1 animate-fade-in">
            <Link to="/quote/request" className="block px-4 py-2 text-gray-400 hover:text-white">Orçamento</Link>
            <Link to="/marketplace"   className="block px-4 py-2 text-gray-400 hover:text-white">Marketplace</Link>
            <Link to="/makers"        className="block px-4 py-2 text-gray-400 hover:text-white">Makers</Link>
            {!isAuthenticated && (
              <div className="flex gap-2 px-4 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => navigate('/login')}>Entrar</Button>
                <Button className="flex-1" onClick={() => navigate('/register')}>Cadastrar</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>

    {/* ── Logout confirmation modal ── */}
    {showLogoutConfirm && (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowLogoutConfirm(false)} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4 animate-fade-in"
            style={{ background: '#131313', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.12)' }}>
                <LogOut size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Sair da conta?</h3>
                <p className="text-xs text-gray-500 mt-0.5">Você será desconectado do sistema.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
              >
                <LogOut size={15} /> Sair
              </button>
            </div>
          </div>
        </div>
      </>
    )}
    </>
  );
}
