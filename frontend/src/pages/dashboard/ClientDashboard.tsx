import { Link } from 'react-router-dom';
import { ShoppingBag, FileText, Heart, Bell, ArrowRight, Clock, Package, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import OrderStatusBadge from '@/components/shared/OrderStatusBadge';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Order } from '@/types';

const mockOrders: Order[] = [
  {
    id: 'seed-order-001', clientId: 'u3', makerId: 'm1',
    status: 'PRINTING', subtotal: 45.90, shipping: 15.00, discount: 0, total: 60.90,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    estimatedAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    items: [{ id: 'i1', productId: 'p1', quantity: 1, price: 45.90, product: { name: 'Engrenagem Industrial 42mm', images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=100'] } }],
    maker: { id: 'm1', userId: 'u1', companyName: 'AlmeidaTech 3D', rating: 4.8, totalReviews: 47, totalOrders: 152, responseTime: 2, printers: [], materials: [], status: 'ACTIVE', kycStatus: 'APPROVED', commissionRate: 0.1, balanceAvail: 0, balancePending: 0, user: { name: 'Carlos Almeida' } },
  },
];

export default function ClientDashboard() {
  const { user } = useAuth();

  const stats = [
    { icon: ShoppingBag, label: 'Pedidos Ativos', value: '1', color: 'text-neon-blue', bg: 'bg-neon-blue/10' },
    { icon: FileText, label: 'Orçamentos', value: '2', color: 'text-neon-purple', bg: 'bg-neon-purple/10' },
    { icon: Heart, label: 'Favoritos', value: '8', color: 'text-red-400', bg: 'bg-red-400/10' },
    { icon: Bell, label: 'Notificações', value: '3', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Olá, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-400 mt-1">Acompanhe seus pedidos e orçamentos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ icon: Icon, label, value, color, bg }) => (
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
        {/* Active Orders */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Pedidos Ativos</h2>
            <Link to="/dashboard/client/orders" className="btn-ghost text-sm">Ver todos <ArrowRight size={14} /></Link>
          </div>

          <div className="space-y-4">
            {mockOrders.map((order) => (
              <Link key={order.id} to={`/order/${order.id}`} className="block glass rounded-2xl p-5 border border-white/5 hover:border-neon-blue/20 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-gray-500">#{order.id.slice(-8).toUpperCase()}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="font-semibold text-white text-sm">{order.items[0]?.product?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Por {order.maker?.companyName}</p>
                  </div>
                  <span className="font-bold text-white">{formatCurrency(order.total)}</span>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Progresso do pedido</span>
                    <span>Estimado: {order.estimatedAt && formatDate(order.estimatedAt)}</span>
                  </div>
                  {['PENDING', 'CONFIRMED', 'PRINTING', 'QUALITY_CHECK', 'SHIPPED', 'DELIVERED'].map((s, i, arr) => {
                    const currentIdx = arr.indexOf(order.status);
                    const isActive = i <= currentIdx;
                    return null;
                    void isActive;
                  })}
                  <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full transition-all duration-500"
                      style={{
                        width: `${(['PENDING', 'CONFIRMED', 'PRINTING', 'QUALITY_CHECK', 'SHIPPED', 'DELIVERED'].indexOf(order.status) + 1) / 6 * 100}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    {['Criado', 'Confirmado', 'Imprimindo', 'QA', 'Enviado', 'Entregue'].map((s, i) => (
                      <span key={s} className={['PENDING', 'CONFIRMED', 'PRINTING', 'QUALITY_CHECK', 'SHIPPED', 'DELIVERED'].indexOf(order.status) >= i ? 'text-neon-blue' : ''}>{s}</span>
                    ))}
                  </div>
                </div>

                <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors ml-auto mt-3" />
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <h3 className="font-bold text-white mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <Link to="/marketplace" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="w-8 h-8 bg-neon-blue/10 rounded-lg flex items-center justify-center"><Package size={14} className="text-neon-blue" /></div>
                <span className="text-sm text-gray-300 group-hover:text-white">Explorar Marketplace</span>
                <ArrowRight size={12} className="text-gray-600 group-hover:text-white ml-auto" />
              </Link>
              <Link to="/quote/request" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="w-8 h-8 bg-neon-purple/10 rounded-lg flex items-center justify-center"><FileText size={14} className="text-neon-purple" /></div>
                <span className="text-sm text-gray-300 group-hover:text-white">Solicitar Orçamento</span>
                <ArrowRight size={12} className="text-gray-600 group-hover:text-white ml-auto" />
              </Link>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Notificações</h3>
              <Badge variant="blue">3</Badge>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Pedido em impressão', msg: 'AlmeidaTech iniciou sua impressão', time: '2h atrás', unread: true },
                { title: 'Proposta recebida', msg: 'Nova proposta para sua solicitação de drone', time: '5h atrás', unread: true },
                { title: 'Pedido confirmado', msg: 'Seu pedido foi confirmado pelo maker', time: '1d atrás', unread: false },
              ].map((n, i) => (
                <div key={i} className={`p-3 rounded-xl transition-all ${n.unread ? 'bg-white/5 border border-neon-blue/10' : 'hover:bg-white/2'}`}>
                  <div className="flex items-start gap-2">
                    {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-neon-blue mt-1.5 shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.msg}</p>
                    </div>
                    <span className="text-xs text-gray-600 whitespace-nowrap">{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery estimate */}
          <div className="glass rounded-2xl p-5 border border-neon-blue/10 bg-neon-blue/5">
            <div className="flex items-center gap-3 mb-3">
              <Clock size={18} className="text-neon-blue" />
              <span className="font-semibold text-white text-sm">Próxima Entrega</span>
            </div>
            <p className="text-2xl font-black text-white">7 dias</p>
            <p className="text-xs text-gray-400 mt-1">Engrenagem Industrial 42mm</p>
            <Button variant="outline" size="sm" className="mt-3 w-full text-xs">Rastrear Pedido</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
