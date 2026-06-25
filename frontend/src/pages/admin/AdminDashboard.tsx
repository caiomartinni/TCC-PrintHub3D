import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Package, ShoppingBag, DollarSign, Shield,
  TrendingUp, Eye, Check, X, RefreshCw,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import OrderStatusBadge from '@/components/shared/OrderStatusBadge';
import { useToast } from '@/components/ui/Toast';
import { adminService, type AdminDashboard as DashData } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/utils/format';
import type { OrderStatus } from '@/types';

export default function AdminDashboard() {
  const { error, success } = useToast();
  const [data,     setData]     = useState<DashData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [approving,setApproving]= useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await adminService.getDashboard());
    } catch { error('Erro', 'Não foi possível carregar o dashboard.'); }
    finally { setLoading(false); }
  }, [error]);

  useEffect(() => { load(); }, [load]);

  const handleMaker = async (id: string, action: 'approve'|'reject', name: string) => {
    setApproving(id);
    try {
      await adminService.updateMakerStatus(id, action);
      success(action === 'approve' ? 'Maker aprovado!' : 'Maker rejeitado', name);
      load();
    } catch { error('Erro', 'Não foi possível atualizar.'); }
    finally { setApproving(null); }
  };

  if (loading || !data) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={28} className="animate-spin text-neon-blue" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Painel Administrativo</h1>
          <p className="text-gray-400 mt-1">Visão geral da plataforma PrintHub3D</p>
        </div>
        <button onClick={load} className="btn-ghost !p-2"><RefreshCw size={18} /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users,       label: 'Usuários',       value: data.totalUsers.toLocaleString(),   sub: `+${data.newUsersMonth} este mês`,          color: 'text-neon-blue',   bg: 'bg-neon-blue/10'   },
          { icon: Shield,      label: 'Makers Ativos',  value: data.totalMakers.toLocaleString(),  sub: `${data.pendingMakers} aguardando`,          color: 'text-neon-purple', bg: 'bg-neon-purple/10' },
          { icon: ShoppingBag, label: 'Pedidos',         value: data.totalOrders.toLocaleString(), sub: `+${data.ordersMonth} este mês`,             color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { icon: DollarSign,  label: 'Receita (pago)',  value: formatCurrency(data.totalRevenue), sub: `+${formatCurrency(data.revenueMonth)} mês`, color: 'text-yellow-400',  bg: 'bg-yellow-400/10'  },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="glass rounded-2xl p-5 border border-white/5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp size={10} />{sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pending Makers */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield size={18} className="text-neon-purple" /> Makers Aguardando Aprovação
            </h2>
            <Badge variant="yellow">{data.pendingMakers}</Badge>
          </div>
          {data.pendingMakersList.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Nenhum maker pendente</p>
          ) : (
            <div className="space-y-3">
              {data.pendingMakersList.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                  <Avatar name={m.user.name} src={m.user.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{m.companyName || m.user.name}</p>
                    <p className="text-xs text-gray-400">{m.user.email}</p>
                    <p className="text-xs text-gray-600">{formatDate(m.createdAt)}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleMaker(m.id, 'approve', m.user.name)} disabled={approving === m.id}
                      className="flex items-center gap-1 text-xs text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg hover:bg-emerald-500/10 disabled:opacity-40">
                      <Check size={11} /> Aprovar
                    </button>
                    <button onClick={() => handleMaker(m.id, 'reject', m.user.name)} disabled={approving === m.id}
                      className="flex items-center gap-1 text-xs text-red-400 border border-red-500/30 px-2 py-1 rounded-lg hover:bg-red-500/10 disabled:opacity-40">
                      <X size={11} /> Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/admin/makers"><Button variant="secondary" className="w-full mt-4 text-sm">Ver todos os makers</Button></Link>
        </div>

        {/* Recent Orders */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
            <ShoppingBag size={18} className="text-neon-blue" /> Pedidos Recentes
          </h2>
          {data.recentOrders.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Nenhum pedido ainda</p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((o) => {
                const title   = (o as { items?: { product?: { name: string } }[] }).items?.[0]?.product?.name ?? o.notes ?? `#${o.id.slice(-8).toUpperCase()}`;
                const client  = (o as { client?: { name: string } }).client?.name ?? 'Cliente';
                const maker   = (o as { maker?: { user?: { name: string } } }).maker?.user?.name ?? 'Maker';
                return (
                  <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{title}</p>
                      <p className="text-xs text-gray-400">{client} → {maker}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <div className="font-bold text-white text-sm">{formatCurrency(o.total)}</div>
                      <OrderStatusBadge status={o.status as OrderStatus} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link to="/admin/orders"><Button variant="secondary" className="w-full mt-4 text-sm">Ver todos os pedidos</Button></Link>
        </div>
      </div>

      {/* Bottom metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { to: '/admin/makers',     icon: Eye,           label: 'Makers Pendentes',   value: data.pendingMakers,           color: 'text-yellow-400',  bg: 'bg-yellow-400/10',  sub: data.pendingMakers > 0 ? 'Aguardando revisão' : 'Tudo ok' },
          { to: '/admin/users',      icon: Package,       label: 'Produtos Ativos',    value: data.totalProducts,           color: 'text-neon-purple', bg: 'bg-neon-purple/10', sub: 'No marketplace' },
        ].map(({ to, icon: Icon, label, value, color, bg, sub }) => (
          <Link key={to} to={to} className="glass rounded-2xl p-5 border border-white/5 flex items-center gap-4 hover:border-white/15 transition-colors">
            <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <div className="text-xl font-black text-white">{value.toLocaleString()}</div>
              <div className="text-xs text-gray-400">{label}</div>
              <div className="text-xs text-gray-600 mt-0.5">{sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}
