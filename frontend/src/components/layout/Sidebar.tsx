import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, FileText, Heart, Star, DollarSign, Users, User, BarChart3, Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/utils/cn';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
  onClose?: () => void;
}

function NavItem({ to, icon, label, end = false, onClose }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      className={({ isActive }) => cn(isActive ? 'sidebar-item-active' : 'sidebar-item')}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}

const clientNav = [
  { to: '/dashboard/client',          icon: <LayoutDashboard size={18} />, label: 'Dashboard',    end: true },
  { to: '/settings',                  icon: <User            size={18} />, label: 'Meu Perfil'              },
  { to: '/dashboard/client/orders',   icon: <ShoppingBag     size={18} />, label: 'Meus Pedidos'            },
  { to: '/dashboard/client/quotes',   icon: <FileText        size={18} />, label: 'Orçamentos'              },
  { to: '/dashboard/client/favorites',icon: <Heart           size={18} />, label: 'Favoritos'               },
];

const makerNav = [
  { to: '/dashboard/maker',            icon: <LayoutDashboard size={18} />, label: 'Dashboard',  end: true },
  { to: '/settings',                   icon: <User            size={18} />, label: 'Meu Perfil'            },
  { to: '/dashboard/maker/products',   icon: <Package         size={18} />, label: 'Produtos'              },
  { to: '/dashboard/maker/orders',     icon: <ShoppingBag     size={18} />, label: 'Pedidos'               },
  { to: '/dashboard/maker/quotes',     icon: <FileText        size={18} />, label: 'Orçamentos'            },
  { to: '/dashboard/maker/reviews',    icon: <Star            size={18} />, label: 'Avaliações'            },
  { to: '/dashboard/maker/financeiro', icon: <DollarSign      size={18} />, label: 'Financeiro'            },
];

const adminNav = [
  { to: '/admin',              icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/admin/users',        icon: <Users           size={18} />, label: 'Usuários'             },
  { to: '/admin/makers',       icon: <Shield          size={18} />, label: 'Makers'               },
  { to: '/admin/orders',       icon: <ShoppingBag     size={18} />, label: 'Pedidos'              },
  { to: '/admin/reports',      icon: <BarChart3       size={18} />, label: 'Relatórios'           },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const navItems =
    user?.role === 'ADMIN' ? adminNav :
    user?.role === 'MAKER' ? makerNav :
    clientNav;

  return (
    <>
      {/* Overlay mobile — fecha o drawer ao clicar fora */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
          onClick={onClose}
        />
      )}

      {/*
        Desktop (lg+): position static, sempre visível (comportamento original).
        Mobile (<lg):  position fixed, drawer que desliza da esquerda.
      */}
      <aside className={cn(
        'w-64 shrink-0 flex flex-col glass-dark border-r border-white/5 min-h-screen',
        // Mobile: drawer fixo com transição
        'fixed inset-y-0 left-0 z-[100] transition-transform duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: volta ao fluxo normal, sempre visível
        'lg:static lg:translate-x-0',
      )}>
        {/* Logo */}
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-2 px-6 py-5 border-b border-white/5 hover:opacity-80 transition-opacity"
        >
          <img src="/logo.jpg" alt="PrintHub3D" className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
          <span className="font-bold text-white text-xl">
            Print<span className="gradient-text">Hub3D</span>
          </span>
        </Link>

        {/* User Info */}
        <div className="flex items-center gap-3 px-4 py-4 mx-3 mt-4 glass rounded-xl border border-white/5">
          <Avatar name={user?.name} src={user?.avatar} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} onClose={onClose} />
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/5">
          <button
            onClick={() => setLogoutConfirm(true)}
            className="sidebar-item w-full text-left text-red-400/80 hover:text-red-400 hover:bg-red-500/8"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Modal de confirmação de logout — fora do <aside> para não sofrer com transforms do pai */}
      {logoutConfirm && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" onClick={() => setLogoutConfirm(false)} />
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-sm rounded-2xl p-6 space-y-4 pointer-events-auto"
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
              <div className="flex gap-3">
                <button onClick={() => setLogoutConfirm(false)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button
                  onClick={() => { setLogoutConfirm(false); logout(); navigate('/'); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}
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
