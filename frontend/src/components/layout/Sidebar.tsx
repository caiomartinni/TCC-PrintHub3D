import { NavLink } from 'react-router-dom';
import { Printer, LayoutDashboard, Package, ShoppingBag, FileText, Star, DollarSign, Bell, Settings, Users, BarChart3, Shield, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/ui/Avatar';
import { cn } from '@/utils/cn';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ to, icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(isActive ? 'sidebar-item-active' : 'sidebar-item')}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}

const clientNav = [
  { to: '/dashboard/client', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/dashboard/client/orders', icon: <ShoppingBag size={18} />, label: 'Meus Pedidos' },
  { to: '/dashboard/client/quotes', icon: <FileText size={18} />, label: 'Orçamentos' },
  { to: '/dashboard/client/favorites', icon: <Star size={18} />, label: 'Favoritos' },
  { to: '/dashboard/client/notifications', icon: <Bell size={18} />, label: 'Notificações' },
];

const makerNav = [
  { to: '/dashboard/maker', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/dashboard/maker/products', icon: <Package size={18} />, label: 'Produtos' },
  { to: '/dashboard/maker/orders', icon: <ShoppingBag size={18} />, label: 'Pedidos' },
  { to: '/dashboard/maker/quotes', icon: <FileText size={18} />, label: 'Orçamentos' },
  { to: '/dashboard/maker/reviews', icon: <Star size={18} />, label: 'Avaliações' },
  { to: '/dashboard/maker/financeiro', icon: <DollarSign size={18} />, label: 'Financeiro' },
  { to: '/dashboard/maker/notifications', icon: <Bell size={18} />, label: 'Notificações' },
];

const adminNav = [
  { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/admin/users', icon: <Users size={18} />, label: 'Usuários' },
  { to: '/admin/makers', icon: <Shield size={18} />, label: 'Makers' },
  { to: '/admin/orders', icon: <ShoppingBag size={18} />, label: 'Pedidos' },
  { to: '/admin/reports', icon: <BarChart3 size={18} />, label: 'Relatórios' },
  { to: '/admin/complaints', icon: <MessageSquare size={18} />, label: 'Denúncias' },
];

export default function Sidebar() {
  const { user } = useAuth();

  const navItems =
    user?.role === 'ADMIN' ? adminNav :
    user?.role === 'MAKER' ? makerNav :
    clientNav;

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col glass-dark border-r border-white/5 min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
          <Printer size={16} className="text-white" />
        </div>
        <span className="font-bold text-white text-xl">
          Print<span className="gradient-text">Hub3D</span>
        </span>
      </div>

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
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Settings */}
      <div className="px-3 py-4 border-t border-white/5">
        <NavItem to="/settings" icon={<Settings size={18} />} label="Configurações" />
      </div>
    </aside>
  );
}
