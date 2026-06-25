import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, RefreshCw, Clock, Package, Truck,
  CheckCircle, XCircle, MessageSquare, ChevronRight, CreditCard,
  Star, X, MapPin,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ordersService } from '@/services/orders.service';
import { reviewsService } from '@/services/reviews.service';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Order, OrderStatus } from '@/types';

function ReviewModal({
  order, onClose, onSaved,
}: {
  order: Order;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { success, error } = useToast();
  const [rating,   setRating]   = useState(0);
  const [hovered,  setHovered]  = useState(0);
  const [title,    setTitle]    = useState('');
  const [comment,  setComment]  = useState('');
  const [saving,   setSaving]   = useState(false);

  const makerName  = order.maker?.user?.name ?? order.maker?.companyName ?? 'Maker';
  const orderTitle = order.notes ?? order.items?.[0]?.product?.name ?? `Pedido #${order.id.slice(-8).toUpperCase()}`;

  const handleSubmit = async () => {
    if (rating === 0) { error('Atenção', 'Selecione uma nota de 1 a 5 estrelas.'); return; }
    setSaving(true);
    try {
      await reviewsService.create({ orderId: order.id, rating, title: title||undefined, comment: comment||undefined });
      success('Avaliação enviada!', `Obrigado por avaliar ${makerName}.`);
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Não foi possível enviar a avaliação.';
      error('Erro', msg);
    } finally { setSaving(false); }
  };

  const LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Excelente'];

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: '#131313', border: '1px solid rgba(255,255,255,0.15)' }}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-white text-lg">Avaliar Maker</h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[260px]">{orderTitle}</p>
            </div>
            <button onClick={onClose} className="btn-ghost !p-1.5 text-gray-400"><X size={16} /></button>
          </div>

          {/* Maker */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#0d0d0d' }}>
            <Avatar name={makerName} src={order.maker?.user?.avatar} size="md" />
            <div>
              <p className="font-semibold text-white text-sm">{makerName}</p>
              <p className="text-xs text-gray-500">Como foi sua experiência?</p>
            </div>
          </div>

          {/* Stars */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star size={32}
                    className={`transition-colors ${(hovered||rating) >= n ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`}
                  />
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p className="text-sm font-semibold text-yellow-400">
                {LABELS[hovered || rating]}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="label">Título (opcional)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Excelente qualidade!" maxLength={80}
              className="input text-sm" />
          </div>

          {/* Comment */}
          <div>
            <label className="label flex items-center justify-between">
              <span>Comentário (opcional)</span>
              <span className="text-xs text-gray-600 font-normal">{comment.length}/300</span>
            </label>
            <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Conte como foi sua experiência com este maker..."
              maxLength={300} className="input resize-none text-sm" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" loading={saving} onClick={handleSubmit}
              disabled={rating === 0}>
              <Star size={15} fill={rating > 0 ? 'currentColor' : 'none'} />
              Enviar avaliação
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

const STATUS: Record<OrderStatus, { label: string; variant: 'yellow'|'blue'|'purple'|'green'|'gray'|'red'; icon: React.ReactNode }> = {
  PENDING:       { label: 'Aguardando confirmação', variant: 'yellow', icon: <Clock      size={12} /> },
  CONFIRMED:     { label: 'Confirmado',              variant: 'blue',   icon: <Package    size={12} /> },
  PRINTING:      { label: 'Em impressão',            variant: 'blue',   icon: <Package    size={12} /> },
  QUALITY_CHECK: { label: 'Controle de qualidade',  variant: 'purple', icon: <Package    size={12} /> },
  SHIPPED:       { label: 'Enviado',                 variant: 'green',  icon: <Truck      size={12} /> },
  DELIVERED:     { label: 'Entregue',                variant: 'green',  icon: <CheckCircle size={12}/> },
  CANCELLED:     { label: 'Cancelado',               variant: 'red',    icon: <XCircle    size={12} /> },
  REFUNDED:      { label: 'Reembolsado',             variant: 'gray',   icon: <XCircle    size={12} /> },
};

const STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PRINTING', 'QUALITY_CHECK', 'SHIPPED', 'DELIVERED'];
const STEP_LABELS = ['Criado', 'Confirmado', 'Imprimindo', 'Controle QA', 'Enviado', 'Entregue'];

function OrderCard({ order, onReview, onConfirmDelivery }: { order: Order; onReview: (o: Order) => void; onConfirmDelivery: (o: Order) => void }) {
  const cfg = STATUS[order.status] ?? STATUS.PENDING;
  const makerName = order.maker?.user?.name ?? order.maker?.companyName ?? 'Maker';
  const isDelivered  = order.status === 'DELIVERED';
  const alreadyRated = !!order.review;

  const stepIdx = STEPS.indexOf(order.status);
  const progress = stepIdx >= 0 ? Math.round(((stepIdx + 1) / STEPS.length) * 100) : 100;

  // nome do produto tem prioridade sobre a nota genérica "Compra via Marketplace"
  const productName = order.items?.[0]?.product?.name;
  const isGenericNote = order.notes === 'Compra via Marketplace' || order.notes?.startsWith('Compra via');
  const title = productName
    ?? (isGenericNote ? undefined : order.notes)
    ?? order.notes
    ?? `Pedido #${order.id.slice(-8).toUpperCase()}`;

  const extraItems = (order.items?.length ?? 0) - 1;
  const thumbImages = (order.items?.[0]?.product?.images as unknown as string[]) ?? [];
  const thumb = thumbImages[0];

  return (
    <div className="glass rounded-2xl border border-white/5 hover:border-white/10 transition-all overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-dark-700 shrink-0 border border-white/5">
            {thumb ? (
              <img src={thumb} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={20} className={order.quoteId ? 'text-neon-blue/40' : 'text-gray-700'} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-mono text-xs text-gray-600">#{order.id.slice(-8).toUpperCase()}</span>
                  {order.quoteId && (
                    <span className="text-[10px] text-neon-blue/70 bg-neon-blue/10 px-1.5 py-0.5 rounded">
                      via orçamento
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-white text-sm leading-snug line-clamp-1">{title}</h3>
                {extraItems > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">+ {extraItems} outro{extraItems > 1 ? 's' : ''} item{extraItems > 1 ? 's' : ''}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Avatar name={makerName} src={order.maker?.user?.avatar} size="sm" />
                    <span>{makerName}</span>
                  </div>
                  <span className="text-gray-600">·</span>
                  <span>{formatDate(order.createdAt)}</span>
                  {order.estimatedAt && order.status !== 'DELIVERED' && (
                    <><span className="text-gray-600">·</span>
                    <span className="text-gray-500 flex items-center gap-0.5">
                      <Clock size={10} />Entrega: {formatDate(order.estimatedAt)}
                    </span></>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <Badge variant={cfg.variant} className="flex items-center gap-1 whitespace-nowrap">
                  {cfg.icon} {cfg.label}
                </Badge>
                <p className="text-base font-bold text-white mt-1">{formatCurrency(order.total)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar — only for active orders */}
        {stepIdx >= 0 && order.status !== 'DELIVERED' && (
          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neon-blue to-neon-purple rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-600">
              {STEPS.map((s, i) => (
                <span key={s} className={i <= stepIdx ? 'text-neon-blue' : ''}>{STEP_LABELS[i]}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to={`/order/${order.id}/chat`}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-neon-blue transition-colors">
            <MessageSquare size={13} /> Chat
          </Link>
          {/* Pay button — visible when order has no payment yet */}
          {!order.payment && order.status !== 'CANCELLED' && (
            <Link to={`/checkout?orderId=${order.id}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-neon-blue hover:text-white transition-colors bg-neon-blue/10 hover:bg-neon-blue/20 px-2.5 py-1.5 rounded-lg">
              <CreditCard size={13} /> Pagar
            </Link>
          )}
          {order.payment?.status === 'PAID' && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle size={11} /> Pago
            </span>
          )}

          {/* Confirm delivery — only when SHIPPED */}
          {order.status === 'SHIPPED' && (
            <button onClick={() => onConfirmDelivery(order)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-400/20 px-2.5 py-1.5 rounded-lg transition-colors">
              <CheckCircle size={12} /> Confirmar recebimento
            </button>
          )}

          {/* Review button — only for DELIVERED orders */}
          {isDelivered && !alreadyRated && (
            <button onClick={() => onReview(order)}
              className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400 border border-yellow-400/30 bg-yellow-400/10 hover:bg-yellow-400/20 px-2.5 py-1.5 rounded-lg transition-colors">
              <Star size={12} /> Avaliar
            </button>
          )}
          {isDelivered && alreadyRated && (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <Star size={11} fill="currentColor" /> {order.review?.rating} Avaliado
            </span>
          )}
        </div>
        <Link to={`/order/${order.id}/tracking`}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-neon-blue transition-colors">
          <Truck size={12}/> Rastrear pedido <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}

function ConfirmDeliveryModal({
  order, onClose, onConfirmed,
}: {
  order: Order;
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const { success, error } = useToast();
  const [saving, setSaving] = useState(false);

  const title = order.items?.[0]?.product?.name ?? `Pedido #${order.id.slice(-8).toUpperCase()}`;

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await ordersService.updateStatus(order.id, { status: 'DELIVERED', description: 'Cliente confirmou o recebimento do pedido' });
      success('Entrega confirmada!', 'Obrigado por confirmar o recebimento.');
      onConfirmed();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Não foi possível confirmar a entrega.';
      error('Erro', msg);
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl p-6 space-y-5" style={{ background: '#131313', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-white text-lg">Confirmar recebimento</h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[240px]">{title}</p>
            </div>
            <button onClick={onClose} className="btn-ghost !p-1.5 text-gray-400"><X size={16} /></button>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: '#0d0d0d' }}>
            <div className="w-10 h-10 rounded-full bg-emerald-400/10 flex items-center justify-center shrink-0">
              <Package size={20} className="text-emerald-400" />
            </div>
            <p className="text-sm text-gray-300 leading-snug">
              Você confirma que recebeu este pedido em boas condições?
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Ao confirmar, o maker será notificado e o pagamento será liberado para ele.
          </p>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1 !bg-emerald-500 hover:!bg-emerald-400" loading={saving} onClick={handleConfirm}>
              <CheckCircle size={15} /> Confirmar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ClientOrders() {
  const { error } = useToast();
  const [orders,                setOrders]                = useState<Order[]>([]);
  const [loading,               setLoading]               = useState(true);
  const [filter,                setFilter]                = useState<'all' | 'active' | 'done'>('all');
  const [reviewTarget,          setReviewTarget]          = useState<Order | null>(null);
  const [confirmDeliveryTarget, setConfirmDeliveryTarget] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersService.getAll();
      setOrders(res.data);
    } catch {
      error('Erro', 'Não foi possível carregar os pedidos.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o => {
    if (filter === 'active') return !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status);
    if (filter === 'done')   return ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status);
    return true;
  });

  const activeCount    = orders.filter(o => !['DELIVERED','CANCELLED','REFUNDED'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Meus Pedidos</h1>
          <p className="text-gray-400 mt-1">{orders.length} pedido{orders.length !== 1 ? 's' : ''} no total</p>
        </div>
        <button onClick={load} className="btn-ghost !p-2" title="Atualizar">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total',      value: orders.length,  color: 'text-white',         bg: 'bg-white/5'        },
          { label: 'Em andamento', value: activeCount,  color: 'text-neon-blue',      bg: 'bg-neon-blue/10'   },
          { label: 'Entregues',  value: deliveredCount, color: 'text-emerald-400',    bg: 'bg-emerald-400/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`glass rounded-xl p-4 border border-white/5 ${bg}`}>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
        {([['all','Todos'],['active','Em andamento'],['done','Concluídos']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === k ? 'bg-white/10 text-white border border-white/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {filter === 'all' ? 'Nenhum pedido ainda' : 'Nenhum pedido nesta categoria'}
          </h3>
          {filter === 'all' && (
            <p className="text-gray-400 text-sm">
              Seus pedidos aparecerão aqui após aceitar uma proposta de orçamento.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(o => (
            <OrderCard key={o.id} order={o} onReview={setReviewTarget} onConfirmDelivery={setConfirmDeliveryTarget} />
          ))}
        </div>
      )}

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          order={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSaved={load}
        />
      )}

      {/* Confirm delivery modal */}
      {confirmDeliveryTarget && (
        <ConfirmDeliveryModal
          order={confirmDeliveryTarget}
          onClose={() => setConfirmDeliveryTarget(null)}
          onConfirmed={load}
        />
      )}
    </DashboardLayout>
  );
}
