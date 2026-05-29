import { Link } from 'react-router-dom';
import { ShoppingBag, Package, FileText, DollarSign, Star, ArrowRight, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import OrderStatusBadge from '@/components/shared/OrderStatusBadge';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import Avatar from '@/components/ui/Avatar';
import { formatCurrency, formatDate } from '@/utils/format';

const mockStats = {
  totalOrders: 152, pendingOrders: 3, monthRevenue: 3280.50,
  totalProducts: 12, openQuotes: 7, rating: 4.8, totalReviews: 47,
  balance: 1250.00,
};

const mockPendingOrders = [
  { id: 'o1', clientName: 'João Silva', product: 'Engrenagem 42mm', total: 60.90, status: 'PENDING' as const, createdAt: new Date().toISOString() },
  { id: 'o2', clientName: 'Ana Costa', product: 'Suporte Smartphone', total: 45.00, status: 'CONFIRMED' as const, createdAt: new Date().toISOString() },
  { id: 'o3', clientName: 'Pedro L.', product: 'Miniatura Colecionável', total: 140.00, status: 'PRINTING' as const, createdAt: new Date().toISOString() },
];

const mockRecentReviews = [
  { name: 'João S.', rating: 5, comment: 'Peça perfeita! Qualidade incrível.', date: '2024-01-20' },
  { name: 'Maria L.', rating: 4, comment: 'Muito bom, prazo atendido.', date: '2024-01-18' },
];

export default function MakerDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Dashboard Maker</h1>
        <p className="text-gray-400 mt-1">Bem-vindo de volta, {user?.name?.split(' ')[0]}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: ShoppingBag, label: 'Pedidos Ativos', value: mockStats.pendingOrders, color: 'text-neon-blue', bg: 'bg-neon-blue/10', suffix: '' },
          { icon: DollarSign, label: 'Receita do Mês', value: formatCurrency(mockStats.monthRevenue), color: 'text-emerald-400', bg: 'bg-emerald-400/10', suffix: '' },
          { icon: Star, label: 'Avaliação Média', value: mockStats.rating.toFixed(1), color: 'text-yellow-400', bg: 'bg-yellow-400/10', suffix: '★' },
          { icon: FileText, label: 'Orçamentos Abertos', value: mockStats.openQuotes, color: 'text-neon-purple', bg: 'bg-neon-purple/10', suffix: '' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="glass rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pedidos Pendentes */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Pedidos Recentes</h2>
              <Link to="/dashboard/maker/orders" className="btn-ghost text-sm">Ver todos <ArrowRight size={14} /></Link>
            </div>
            <div className="space-y-3">
              {mockPendingOrders.map((order) => (
                <div key={order.id} className="glass rounded-xl p-4 border border-white/5 hover:border-neon-blue/20 transition-all flex items-center gap-4">
                  <div className="w-10 h-10 bg-neon-blue/10 rounded-xl flex items-center justify-center shrink-0">
                    <Package size={16} className="text-neon-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{order.product}</p>
                    <p className="text-xs text-gray-400">{order.clientName} · {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-white text-sm">{formatCurrency(order.total)}</div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => {}}>Ver</Button>
                </div>
              ))}
            </div>
          </div>

          {/* Orçamentos Disponíveis */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Orçamentos Disponíveis</h2>
              <Link to="/dashboard/maker/quotes" className="btn-ghost text-sm">Ver todos <ArrowRight size={14} /></Link>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Braço para drone DJI', material: 'ABS', budget: 80, deadline: 'Urgente', distance: '12km' },
                { title: 'Vaso personalizado', material: 'PLA', budget: 120, deadline: '15 dias', distance: '5km' },
                { title: 'Peça automotiva', material: 'Nylon', budget: 200, deadline: '7 dias', distance: '28km' },
              ].map((q, i) => (
                <div key={i} className="glass rounded-xl p-4 border border-white/5 hover:border-neon-purple/20 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{q.title}</p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <Badge variant="purple" className="text-xs">{q.material}</Badge>
                        <span className="text-xs text-gray-400">Orçamento: {formatCurrency(q.budget)}</span>
                        <span className="text-xs text-gray-500">{q.distance} de você</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant={q.deadline === 'Urgente' ? 'red' : 'gray'} className="text-xs">{q.deadline}</Badge>
                      <div className="mt-2">
                        <Button size="sm">Responder</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Financial */}
          <div className="glass rounded-2xl p-5 border border-emerald-500/10 bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-emerald-400" />
              <span className="font-bold text-white">Saldo Disponível</span>
            </div>
            <div className="text-3xl font-black text-white mb-1">{formatCurrency(mockStats.balance)}</div>
            <p className="text-xs text-gray-400">+ {formatCurrency(380)} pendente</p>
            <Button variant="outline" size="sm" className="mt-4 w-full border-emerald-500/30 text-emerald-400">
              Solicitar Saque
            </Button>
          </div>

          {/* Rating */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-yellow-400" />
              <span className="font-bold text-white">Avaliações Recentes</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl font-black text-white">{mockStats.rating}</span>
              <div>
                <StarRating rating={mockStats.rating} size={16} />
                <span className="text-xs text-gray-400 mt-1 block">{mockStats.totalReviews} avaliações</span>
              </div>
            </div>
            <div className="space-y-3">
              {mockRecentReviews.map((r, i) => (
                <div key={i} className="border-t border-white/5 pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Avatar name={r.name} size="sm" />
                      <span className="text-xs font-medium text-white">{r.name}</span>
                    </div>
                    <StarRating rating={r.rating} size={10} />
                  </div>
                  <p className="text-xs text-gray-400">{r.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} />Performance</h3>
            {[
              { icon: CheckCircle, label: 'Taxa de conclusão', value: '98%', color: 'text-emerald-400' },
              { icon: Clock, label: 'Tempo médio de resposta', value: '2h', color: 'text-neon-blue' },
              { icon: AlertCircle, label: 'Disputas', value: '0', color: 'text-gray-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Icon size={12} className={color} />{label}
                </div>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
