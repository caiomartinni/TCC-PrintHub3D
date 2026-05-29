import { Link } from 'react-router-dom';
import { ChevronLeft, Package, Truck, CheckCircle, Clock, MapPin, Copy, Star } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import OrderStatusBadge from '@/components/shared/OrderStatusBadge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { useToast } from '@/components/ui/Toast';

const mockOrder = {
  id: 'seed-order-001',
  status: 'PRINTING' as const,
  total: 60.90, subtotal: 45.90, shipping: 15.00,
  createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  estimatedAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  maker: { companyName: 'AlmeidaTech 3D', user: { name: 'Carlos Almeida' }, city: 'São Paulo', state: 'SP', rating: 4.8 },
  items: [{ name: 'Engrenagem Industrial 42mm', price: 45.90, quantity: 1, material: 'PLA', color: 'Preto', images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=100'] }],
  tracking: [
    { status: 'PENDING', description: 'Pedido criado e aguardando confirmação', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), location: 'Sistema' },
    { status: 'CONFIRMED', description: 'Pedido confirmado pelo maker', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), location: 'São Paulo, SP' },
    { status: 'PRINTING', description: 'Impressão iniciada - Estimativa 18h', createdAt: new Date(Date.now() - 86400000).toISOString(), location: 'Oficina AlmeidaTech' },
  ],
};

const orderSteps = ['PENDING', 'CONFIRMED', 'PRINTING', 'QUALITY_CHECK', 'SHIPPED', 'DELIVERED'];
const stepLabels = ['Criado', 'Confirmado', 'Imprimindo', 'Controle QA', 'Enviado', 'Entregue'];
const stepIcons = [Clock, Clock, Package, Package, Truck, CheckCircle];

export default function OrderTracking() {
  const { success } = useToast();
  const currentStep = orderSteps.indexOf(mockOrder.status);
  const progress = ((currentStep + 1) / orderSteps.length) * 100;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <Link to="/dashboard/client/orders" className="btn-ghost mb-6 inline-flex">
          <ChevronLeft size={16} />Voltar
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-white">Pedido #{mockOrder.id.slice(-8).toUpperCase()}</h1>
            <p className="text-gray-400 text-sm mt-1">Realizado em {formatDate(mockOrder.createdAt)}</p>
          </div>
          <OrderStatusBadge status={mockOrder.status} />
        </div>

        {/* Progress */}
        <div className="glass rounded-2xl p-6 border border-white/10 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-400">Progresso do Pedido</span>
              <span className="text-sm font-bold text-neon-blue">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-6 gap-1">
            {orderSteps.map((step, i) => {
              const Icon = stepIcons[i]!;
              const isComplete = i < currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step} className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isComplete ? 'bg-emerald-500 text-white' :
                    isCurrent ? 'bg-gradient-to-br from-neon-blue to-neon-purple text-white shadow-neon-blue' :
                    'bg-white/5 text-gray-600'
                  }`}>
                    {isComplete ? <CheckCircle size={14} /> : <Icon size={14} />}
                  </div>
                  <span className={`text-xs text-center leading-tight ${isCurrent ? 'text-neon-blue font-semibold' : isComplete ? 'text-emerald-400' : 'text-gray-600'}`}>
                    {stepLabels[i]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-center text-sm text-gray-400">
            Entrega estimada: <span className="text-white font-semibold">{formatDate(mockOrder.estimatedAt)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Items */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <h3 className="font-bold text-white mb-4">Itens do Pedido</h3>
            {mockOrder.items.map((item, i) => (
              <div key={i} className="flex gap-3">
                <img src={item.images[0]} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Qt: {item.quantity} · {item.material} · {item.color}</p>
                  <p className="text-sm font-bold text-white mt-1">{formatCurrency(item.price)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Maker */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <h3 className="font-bold text-white mb-4">Maker</h3>
            <div className="flex items-center gap-3 mb-4">
              <Avatar name={mockOrder.maker.user.name} size="md" />
              <div>
                <p className="font-semibold text-white">{mockOrder.maker.companyName}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={10} />{mockOrder.maker.city}, {mockOrder.maker.state}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">{formatCurrency(mockOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Frete</span>
                <span className="text-white">{formatCurrency(mockOrder.shipping)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-white/10 pt-2 mt-2">
                <span className="text-white">Total</span>
                <span className="text-neon-blue">{formatCurrency(mockOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="glass rounded-2xl p-6 border border-white/5 mb-6">
          <h3 className="font-bold text-white mb-5 flex items-center gap-2"><Truck size={16} />Histórico de Rastreamento</h3>
          <div className="space-y-4">
            {[...mockOrder.tracking].reverse().map((t, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-neon-blue shadow-neon-blue' : 'bg-white/20'}`} />
                  {i < mockOrder.tracking.length - 1 && <div className="w-0.5 flex-1 bg-white/10 mt-1" />}
                </div>
                <div className="pb-4 flex-1">
                  <p className="text-sm font-semibold text-white">{t.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{formatDateTime(t.createdAt)}</span>
                    {t.location && <><MapPin size={10} /><span>{t.location}</span></>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {mockOrder.status !== 'DELIVERED' && (
            <button
              onClick={() => { success('Código copiado!'); }}
              className="btn-secondary gap-2"
            >
              <Copy size={14} />Copiar Código de Rastreio
            </button>
          )}
          {mockOrder.status === 'DELIVERED' && (
            <Button>
              <Star size={14} />Avaliar Pedido
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
