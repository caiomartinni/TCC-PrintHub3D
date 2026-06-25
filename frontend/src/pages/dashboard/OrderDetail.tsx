import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, Package, MessageSquare, Truck,
  CheckCircle, CreditCard, User, MapPin, Calendar,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import OrderStatusBadge from '@/components/shared/OrderStatusBadge';
import { ordersService } from '@/services/orders.service';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Order } from '@/types';

const PAYMENT_LABEL: Record<string, { label: string; color: string }> = {
  PAID:       { label: 'Pago',           color: 'text-emerald-400' },
  PENDING:    { label: 'Pendente',       color: 'text-yellow-400'  },
  PROCESSING: { label: 'Processando',   color: 'text-blue-400'    },
  FAILED:     { label: 'Falhou',         color: 'text-red-400'     },
  REFUNDED:   { label: 'Reembolsado',   color: 'text-gray-400'    },
  CANCELLED:  { label: 'Cancelado',     color: 'text-red-400'     },
};

export default function OrderDetail() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    ordersService.getById(id)
      .then(setOrder)
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (!order) return null;

  const makerName  = order.maker?.user?.name ?? order.maker?.companyName ?? 'Maker';
  const clientName = order.client?.name ?? 'Cliente';
  const title      = order.notes ?? order.items?.[0]?.product?.name ?? `Pedido #${order.id.slice(-8).toUpperCase()}`;
  const payInfo    = order.payment ? PAYMENT_LABEL[order.payment.status] ?? { label: order.payment.status, color: 'text-gray-400' } : null;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="btn-ghost !p-2">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white truncate">{title}</h1>
            <p className="text-xs text-gray-500 font-mono mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Produtos */}
        <div className="glass rounded-2xl border border-white/5 overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <Package size={15} className="text-neon-blue" />
            <h2 className="font-bold text-white text-sm">
              {(() => {
                const count = order.items?.length ?? 0;
                const effective = count === 0 ? 1 : count;
                return `${effective} ${effective === 1 ? 'Produto' : 'Produtos'}`;
              })()}
            </h2>
          </div>

          {(!order.items || order.items.length === 0) ? (
            /* Pedido de orçamento — sem itens de produto */
            <div className="flex items-center gap-4 p-4">
              <div className="w-16 h-16 rounded-xl shrink-0 bg-white/5 flex items-center justify-center">
                <Package size={22} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">
                  {order.quoteRequest?.title ?? 'Produto Personalizado'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Pedido via orçamento</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-white">{formatCurrency(order.subtotal)}</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {order.items.map((item) => {
                const images = item.product?.images as string[] | undefined;
                const img    = images?.[0];
                return (
                  <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-white/2 transition-colors">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/5 flex items-center justify-center">
                      {img ? (
                        <img src={img} alt={item.product?.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={22} className="text-gray-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm leading-snug truncate">
                        {item.product?.name ?? 'Produto'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {item.material && <Badge variant="purple" className="text-xs">{item.material}</Badge>}
                        {item.color    && <span className="text-xs text-gray-500">{item.color}</span>}
                      </div>
                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{item.notes}"</p>
                      )}
                    </div>

                    {/* Qty + Price */}
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                      <p className="font-bold text-white mt-0.5">{formatCurrency(item.price * item.quantity)}</p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-600">{formatCurrency(item.price)} cada</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Total */}
          <div className="px-5 py-4 border-t border-white/5 space-y-1.5">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.shipping > 0 && (
              <div className="flex justify-between text-sm text-gray-400">
                <span>Frete</span>
                <span>{formatCurrency(order.shipping)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Desconto</span>
                <span>- {formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white pt-1 border-t border-white/10">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Pagamento + Datas */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Pagamento */}
          <div className="glass rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={14} className="text-neon-blue" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Pagamento</span>
            </div>
            {payInfo ? (
              <>
                <p className={`font-bold text-sm ${payInfo.color}`}>{payInfo.label}</p>
                {order.payment?.amount && (
                  <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(order.payment.amount)}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-yellow-400 font-semibold">Aguardando</p>
            )}
            {order.payment?.status === 'PAID' && (
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle size={11} className="text-emerald-400" />
                <span className="text-xs text-emerald-400">Confirmado</span>
              </div>
            )}
          </div>

          {/* Datas */}
          <div className="glass rounded-2xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-neon-purple" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Datas</span>
            </div>
            <div className="space-y-1.5">
              <div>
                <p className="text-xs text-gray-500">Criado em</p>
                <p className="text-sm text-white font-medium">{formatDate(order.createdAt)}</p>
              </div>
              {order.estimatedAt && (
                <div>
                  <p className="text-xs text-gray-500">Prazo estimado</p>
                  <p className="text-sm text-white font-medium">{formatDate(order.estimatedAt)}</p>
                </div>
              )}
              {order.deliveredAt && (
                <div>
                  <p className="text-xs text-gray-500">Entregue em</p>
                  <p className="text-sm text-emerald-400 font-medium">{formatDate(order.deliveredAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Partes envolvidas */}
        <div className="glass rounded-2xl p-5 border border-white/5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={14} className="text-gray-400" />
            <h2 className="font-bold text-white text-sm">Partes Envolvidas</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={clientName} src={order.client?.avatar} size="md" />
              <div>
                <p className="text-xs text-gray-500">Cliente</p>
                <p className="font-semibold text-white text-sm">{clientName}</p>
                {order.client?.email && <p className="text-xs text-gray-500">{order.client.email}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Avatar name={makerName} src={order.maker?.user?.avatar} size="md" />
              <div>
                <p className="text-xs text-gray-500">Maker</p>
                <p className="font-semibold text-white text-sm">{makerName}</p>
              </div>
            </div>
          </div>

          {order.address && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                <MapPin size={11} /> Endereço de entrega
              </div>
              <p className="text-sm text-white">
                {order.address.street}, {order.address.number}
                {order.address.complement ? `, ${order.address.complement}` : ''} —{' '}
                {order.address.district}, {order.address.city}/{order.address.state}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">CEP: {order.address.zipCode}</p>
            </div>
          )}
        </div>

        {/* Observações */}
        {order.notes && (
          <div className="glass rounded-2xl p-5 border border-white/5 mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Observações</p>
            <p className="text-sm text-gray-300 leading-relaxed">{order.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link to={`/order/${order.id}/chat`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-gray-400 border border-white/10 hover:border-neon-blue/30 hover:text-neon-blue transition-all">
            <MessageSquare size={15} /> Chat
          </Link>
          <Link to={`/order/${order.id}/tracking`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-gray-400 border border-white/10 hover:border-neon-blue/30 hover:text-neon-blue transition-all">
            <Truck size={15} /> Rastreio
          </Link>
        </div>

      </div>
    </DashboardLayout>
  );
}
