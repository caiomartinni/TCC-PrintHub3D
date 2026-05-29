import { Users, Package, ShoppingBag, DollarSign, Shield, AlertTriangle, TrendingUp, Eye } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { formatCurrency, formatDate } from '@/utils/format';

const stats = {
  totalUsers: 1284, newUsersMonth: 87,
  totalMakers: 847, pendingMakers: 12,
  totalOrders: 38291, ordersMonth: 1240,
  totalRevenue: 284500, revenueMonth: 18320,
};

const pendingMakers = [
  { id: 'm5', name: 'Roberto F.', company: 'RoboFab 3D', city: 'Curitiba', state: 'PR', date: '2024-01-20' },
  { id: 'm6', name: 'Camila S.', company: 'CamPrint', city: 'Belo Horizonte', state: 'MG', date: '2024-01-19' },
  { id: 'm7', name: 'Tiago M.', company: 'MeloTech', city: 'Florianópolis', state: 'SC', date: '2024-01-18' },
];

const recentOrders = [
  { id: 'o001', client: 'João Silva', maker: 'AlmeidaTech 3D', product: 'Engrenagem 42mm', total: 60.90, status: 'PRINTING', date: new Date().toISOString() },
  { id: 'o002', client: 'Ana Costa', maker: 'FernaPrint', product: 'Vaso Geométrico', total: 89.90, status: 'DELIVERED', date: new Date().toISOString() },
  { id: 'o003', client: 'Pedro L.', maker: 'AlmeidaTech 3D', product: 'Miniatura Dragon', total: 129.90, status: 'SHIPPED', date: new Date().toISOString() },
];

const statusColor: Record<string, string> = {
  PRINTING: 'text-neon-purple',
  DELIVERED: 'text-emerald-400',
  SHIPPED: 'text-neon-blue',
  PENDING: 'text-yellow-400',
};

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Painel Administrativo</h1>
        <p className="text-gray-400 mt-1">Visão geral da plataforma PrintHub3D</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: 'Usuários', value: stats.totalUsers.toLocaleString(), sub: `+${stats.newUsersMonth} este mês`, color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
          { icon: Shield, label: 'Makers Ativos', value: stats.totalMakers.toLocaleString(), sub: `${stats.pendingMakers} aguardando`, color: 'text-neon-purple', bg: 'bg-neon-purple/10' },
          { icon: ShoppingBag, label: 'Total de Pedidos', value: stats.totalOrders.toLocaleString(), sub: `+${stats.ordersMonth} este mês`, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { icon: DollarSign, label: 'Receita Total', value: formatCurrency(stats.totalRevenue), sub: `+${formatCurrency(stats.revenueMonth)} este mês`, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
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
              <Shield size={18} className="text-neon-purple" />
              Makers Aguardando Aprovação
            </h2>
            <Badge variant="yellow">{stats.pendingMakers}</Badge>
          </div>
          <div className="space-y-3">
            {pendingMakers.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <Avatar name={m.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{m.company}</p>
                  <p className="text-xs text-gray-400">{m.name} · {m.city}, {m.state}</p>
                  <p className="text-xs text-gray-600">{formatDate(m.date)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" className="!px-2 text-xs">
                    <Eye size={12} />
                  </Button>
                  <Button size="sm" className="!px-3 text-xs">Aprovar</Button>
                  <Button size="sm" variant="danger" className="!px-3 text-xs">Rejeitar</Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="w-full mt-4 text-sm">Ver todos os makers</Button>
        </div>

        {/* Recent Orders */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingBag size={18} className="text-neon-blue" />
              Pedidos Recentes
            </h2>
          </div>
          <div className="space-y-3">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{o.product}</p>
                  <p className="text-xs text-gray-400">{o.client} → {o.maker}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-white text-sm">{formatCurrency(o.total)}</div>
                  <span className={`text-xs font-medium ${statusColor[o.status] || 'text-gray-400'}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="w-full mt-4 text-sm">Ver todos os pedidos</Button>
        </div>
      </div>

      {/* Reports Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: AlertTriangle, label: 'Denúncias Abertas', value: 3, color: 'text-red-400', bg: 'bg-red-400/10' },
          { icon: TrendingUp, label: 'Taxa de Conversão', value: '12.4%', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { icon: Package, label: 'Produtos Ativos', value: '12.430', color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="glass rounded-2xl p-5 border border-white/5 flex items-center gap-4">
            <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <div className="text-xl font-black text-white">{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
