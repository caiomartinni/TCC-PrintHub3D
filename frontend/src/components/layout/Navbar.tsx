import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Printer, Bell, ShoppingCart, Menu, X, ChevronDown, User, LogOut, Settings, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, openCart } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardPath =
    user?.role === 'ADMIN' ? '/admin' :
    user?.role === 'MAKER' ? '/dashboard/maker' :
    '/dashboard/client';

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 glass-dark border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center group-hover:shadow-neon-blue transition-shadow duration-300">
              <Printer size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-xl">
              Print<span className="gradient-text">Hub3D</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/marketplace" className="btn-ghost">Marketplace</Link>
            <Link to="/makers" className="btn-ghost">Makers</Link>
            <Link to="/quote/request" className="btn-ghost">Orçamento</Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button className="btn-ghost !p-2 relative">
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-neon-blue" />
                </button>
                <button onClick={openCart} className="btn-ghost !p-2 relative">
                  <ShoppingCart size={20} />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-neon-blue text-[#0a0a0a] text-[10px] font-bold flex items-center justify-center leading-none">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
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
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 glass rounded-xl border border-white/10 shadow-glass z-20 py-1 animate-fade-in">
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="font-semibold text-white text-sm">{user?.name}</p>
                          <p className="text-xs text-gray-400">{user?.email}</p>
                        </div>
                        <Link to={dashboardPath} onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">
                          <Package size={16} />Dashboard
                        </Link>
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">
                          <User size={16} />Perfil
                        </Link>
                        <Link to="/settings" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">
                          <Settings size={16} />Configurações
                        </Link>
                        <div className="border-t border-white/10 mt-1">
                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors text-sm">
                            <LogOut size={16} />Sair
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
            <Link to="/marketplace" className="block px-4 py-2 text-gray-400 hover:text-white">Marketplace</Link>
            <Link to="/makers" className="block px-4 py-2 text-gray-400 hover:text-white">Makers</Link>
            <Link to="/quote/request" className="block px-4 py-2 text-gray-400 hover:text-white">Orçamento</Link>
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
  );
}
