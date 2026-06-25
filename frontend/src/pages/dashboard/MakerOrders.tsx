import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag, RefreshCw, ChevronRight,
  MessageSquare, CheckCircle, Package, Truck, XCircle, AlertTriangle, CreditCard, X,
  Undo2, HelpCircle, Clock,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ordersService } from '@/services/orders.service';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Order, OrderStatus } from '@/types';

export const CARRIERS = [
  { name: 'Correios',        url: (c: string) => `https://rastreamento.correios.com.br/app/index.php?objetos=${c}` },
  { name: 'Jadlog',          url: (c: string) => `https://www.jadlog.com.br/site/tracking.jad?cte=${c}` },
  { name: 'Total Express',   url: (c: string) => `https://tracking.totalexpress.com.br/pagesrc/track.php?rastreamento=${c}` },
  { name: 'Azul Cargo',      url: (c: string) => `https://www2.azulcargos.com.br/azulcargo/buscaRastreamento.json?chave=${c}` },
  { name: 'J&T Express',     url: (c: string) => `https://www.jtexpress.com.br/trajectories?flag=1&billCode=${c}` },
  { name: 'Sequoia',         url: (c: string) => `https://www.sequoialog.com.br/tracking/${c}` },
  { name: 'Motoboy / Mão própria', url: () => '' },
  { name: 'Outro',           url: () => '' },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'yellow'|'blue'|'purple'|'green'|'gray'|'red' }> = {
  PENDING:       { label: 'Aguardando confirmação', variant: 'yellow' },
  CONFIRMED:     { label: 'Confirmado',              variant: 'blue'   },
  PRINTING:      { label: 'Em impressão',            variant: 'blue'   },
  QUALITY_CHECK: { label: 'Controle de qualidade',  variant: 'purple' },
  SHIPPED:       { label: 'Enviado',                 variant: 'green'  },
  DELIVERED:     { label: 'Entregue',                variant: 'green'  },
  CANCELLED:     { label: 'Cancelado',               variant: 'red'    },
  REFUNDED:      { label: 'Reembolsado',             variant: 'gray'   },
};

const NEXT_ACTIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus; desc: string }>> = {
  PENDING:       { label: 'Confirmar pedido',    next: 'CONFIRMED',     desc: 'Pedido confirmado pelo maker' },
  CONFIRMED:     { label: 'Iniciar impressão',   next: 'PRINTING',      desc: 'Impressão iniciada' },
  PRINTING:      { label: 'Marcar como impresso',next: 'QUALITY_CHECK', desc: 'Impressão concluída — controle de qualidade' },
  QUALITY_CHECK: { label: 'Marcar como enviado', next: 'SHIPPED',       desc: 'Peça enviada ao cliente' },
};

// estados finais (DELIVERED, CANCELLED, REFUNDED) excluídos — têm efeitos colaterais no saldo e estoque
const PREV_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  CONFIRMED:     'PENDING',
  PRINTING:      'CONFIRMED',
  QUALITY_CHECK: 'PRINTING',
  SHIPPED:       'QUALITY_CHECK',
};

function ShipModal({ orderId, onClose, onShipped }: {
  orderId: string;
  onClose: () => void;
  onShipped: () => void;
}) {
  const { success, error } = useToast();
  const [carrier,      setCarrier]      = useState('Correios');
  const [trackingCode, setTrackingCode] = useState('');
  const [sending,      setSending]      = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await ordersService.updateStatus(orderId, {
        status: 'SHIPPED',
        description: `Pedido enviado via ${carrier}${trackingCode ? ` — código: ${trackingCode}` : ''}`,
        carrier,
        trackingCode: trackingCode || undefined,
      });
      success('Pedido enviado!', 'O cliente foi notificado e pode rastrear o envio.');
      onShipped();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Não foi possível atualizar o status.';
      error('Erro', msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: '#131313', border: '1px solid rgba(0,212,255,0.2)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2"><Truck size={18} className="text-neon-blue"/>Marcar como Enviado</h3>
              <p className="text-xs text-gray-500 mt-0.5">Informe a transportadora e o código de rastreio para o cliente acompanhar</p>
            </div>
            <button onClick={onClose} className="btn-ghost !p-1.5"><X size={16}/></button>
          </div>

          {/* Carrier */}
          <div>
            <label className="label">Transportadora *</label>
            <select className="input" value={carrier} onChange={e => setCarrier(e.target.value)}>
              {CARRIERS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* Tracking code */}
          <Input
            label="Código de rastreio"
            placeholder="Ex: AA123456789BR"
            value={trackingCode}
            onChange={e => setTrackingCode(e.target.value.toUpperCase())}
            icon={<Package size={15}/>}
          />

          {trackingCode && carrier !== 'Motoboy / Mão própria' && carrier !== 'Outro' && (
            <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <p className="text-gray-400 mb-1">Link de rastreio que o cliente verá:</p>
              <p className="text-neon-blue break-all">
                {CARRIERS.find(c => c.name === carrier)?.url(trackingCode)}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 btn-secondary">Cancelar</button>
            <Button loading={sending} onClick={handleSend} className="flex-1">
              <Truck size={14}/> Confirmar Envio
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function ConfirmStepModal({
  title, description, confirmLabel, danger, loading, onConfirm, onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: '#131313', border: '1px solid rgba(0,212,255,0.2)' }}>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              {danger ? <Undo2 size={18} className="text-yellow-400" /> : <HelpCircle size={18} className="text-neon-blue" />}
              {title}
            </h3>
            <button onClick={onClose} className="btn-ghost !p-1.5"><X size={16}/></button>
          </div>
          <p className="text-sm text-gray-400">{description}</p>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 btn-secondary">Cancelar</button>
            <Button loading={loading} onClick={onConfirm} variant={danger ? 'danger' : 'primary'} className="flex-1">
              {danger ? <Undo2 size={14} /> : <CheckCircle size={14} />}
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function MakerOrderCard({
  order, onUpdated,
}: {
  order: Order;
  onUpdated: () => void;
}) {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [updating,   setUpdating]   = useState(false);
  const [showShipModal, setShowShipModal] = useState(false);
  const [confirmStep, setConfirmStep] = useState<{ status: OrderStatus; description: string; isBack: boolean } | null>(null);

  const cfg        = STATUS_CONFIG[order.status];
  const action     = NEXT_ACTIONS[order.status];
  const prevStatus = PREV_STATUS[order.status];
  const clientName = order.client?.name ?? 'Cliente';

  const title = order.notes
    ?? order.items?.[0]?.product?.name
    ?? `Pedido #${order.id.slice(-8).toUpperCase()}`;

  const performStatusChange = async (status: OrderStatus, description: string) => {
    setUpdating(true);
    try {
      await ordersService.updateStatus(order.id, { status, description });
      success('Status atualizado!', `Pedido agora está em: ${STATUS_CONFIG[status].label}`);
      setConfirmStep(null);
      onUpdated();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Não foi possível atualizar o status.';
      error('Erro', msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleAdvance = () => {
    if (!action) return;
    // envio abre modal próprio para capturar transportadora e código de rastreio
    if (action.next === 'SHIPPED') { setShowShipModal(true); return; }
    setConfirmStep({ status: action.next, description: action.desc, isBack: false });
  };

  const handleBack = () => {
    if (!prevStatus) return;
    setConfirmStep({
      status: prevStatus,
      description: `Pedido retornado para "${STATUS_CONFIG[prevStatus].label}" pelo maker`,
      isBack: true,
    });
  };

  return (
    <>
    <div className="glass rounded-2xl border border-white/5 hover:border-white/10 transition-all overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => navigate(`/order/${order.id}/detail`)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/order/${order.id}/detail`); } }}
        className="p-5 flex items-start gap-4 cursor-pointer hover:bg-white/[0.03] transition-colors"
        title="Ver detalhes do pedido"
      >
        {/* Client avatar */}
        <Avatar name={clientName} src={order.client?.avatar} size="md" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-mono text-xs text-gray-500">
                  #{order.id.slice(-8).toUpperCase()}
                </span>
                {order.quoteId && (
                  <span className="text-xs text-neon-blue/70 bg-neon-blue/10 px-1.5 py-0.5 rounded">
                    via orçamento
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white text-sm leading-snug truncate">{title}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span>{clientName}</span>
                {order.client?.email && <span className="text-gray-600">{order.client.email}</span>}
                <span>{formatDate(order.createdAt)}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              {cfg && <Badge variant={cfg.variant}>{cfg.label}</Badge>}
              <p className="text-lg font-bold text-white mt-1">{formatCurrency(order.total)}</p>
              <p className="text-xs text-gray-500">
                {formatCurrency(order.subtotal)} + {formatCurrency(order.shipping)} frete
              </p>
            </div>
          </div>

          {order.estimatedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Prazo estimado: {formatDate(order.estimatedAt)}
            </p>
          )}

          {/* Tracking info — shown when shipped */}
          {order.status === 'SHIPPED' && order.tracking && order.tracking.length > 0 && (() => {
            const shipEntry = [...order.tracking].reverse().find(t => t.status === 'SHIPPED');
            const carrier   = shipEntry?.carrier;
            const code      = shipEntry?.trackingCode;
            const carrierCfg = carrier ? CARRIERS.find(c => c.name === carrier) : null;
            const link = carrierCfg && code ? carrierCfg.url(code) : null;
            if (!carrier && !code) return null;
            return (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                {carrier && <span className="text-gray-400 flex items-center gap-1"><Truck size={10}/>{carrier}</span>}
                {code    && <span className="font-mono text-gray-300">{code}</span>}
                {link    && (
                  <a href={link} target="_blank" rel="noreferrer"
                    className="text-neon-blue hover:underline">
                    Rastrear →
                  </a>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Payment warning — shown when payment not confirmed and order can still progress */}
      {action && order.payment?.status !== 'PAID' && (
        <div className="flex items-center gap-3 px-5 py-2.5 border-t border-white/5"
          style={{ background: 'rgba(251,191,36,0.05)' }}>
          <AlertTriangle size={13} className="text-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-400 flex-1">
            <strong>Pagamento pendente.</strong> Você não pode prosseguir com o pedido enquanto o cliente não efetuar o pagamento.
          </p>
          {!order.payment && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <CreditCard size={11} /> Aguardando pagamento
            </span>
          )}
          {order.payment && order.payment.status !== 'PAID' && (
            <span className="flex items-center gap-1 text-xs text-yellow-500/70">
              <CreditCard size={11} /> Processando…
            </span>
          )}
        </div>
      )}

      {/* Actions footer */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-white/5">
        <div className="flex items-center gap-3">
          {action && (() => {
            const isPaid = order.payment?.status === 'PAID';
            return (
              <Button
                size="sm"
                loading={updating}
                onClick={handleAdvance}
                disabled={!isPaid}
                title={!isPaid ? 'Aguardando pagamento do cliente' : undefined}
              >
                {action.next === 'CONFIRMED'     && <CheckCircle size={13} />}
                {action.next === 'PRINTING'      && <Package     size={13} />}
                {action.next === 'QUALITY_CHECK' && <Package     size={13} />}
                {action.next === 'SHIPPED'       && <Truck       size={13} />}
                {action.next === 'DELIVERED'     && <CheckCircle size={13} />}
                {action.label}
              </Button>
            );
          })()}

          {prevStatus && (
            <Button
              size="sm"
              variant="secondary"
              onClick={handleBack}
              disabled={updating}
              title={`Voltar para "${STATUS_CONFIG[prevStatus].label}"`}
            >
              <Undo2 size={13} /> Voltar etapa
            </Button>
          )}

          {order.status === 'SHIPPED' && (
            <span className="flex items-center gap-1.5 text-xs text-yellow-400">
              <Clock size={13} /> Aguardando confirmação do cliente
            </span>
          )}

          {order.status === 'DELIVERED' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle size={13} /> Pedido concluído
            </span>
          )}

          {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
            <span className="flex items-center gap-1.5 text-xs text-red-400">
              <XCircle size={13} /> Pedido encerrado
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/order/${order.id}/chat`}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-neon-blue transition-colors"
          >
            <MessageSquare size={13} /> Chat
          </Link>
          <Link
            to={`/order/${order.id}/tracking`}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Rastreio
          </Link>
          <Link
            to={`/order/${order.id}/detail`}
            className="flex items-center gap-1 text-xs font-medium text-gray-300 hover:text-white transition-colors"
          >
            Ver detalhes <ChevronRight size={13} />
          </Link>
        </div>
      </div>

    </div>

    {showShipModal && (
      <ShipModal
        orderId={order.id}
        onClose={() => setShowShipModal(false)}
        onShipped={() => { setShowShipModal(false); onUpdated(); }}
      />
    )}

    {confirmStep && (
      <ConfirmStepModal
        title={confirmStep.isBack
          ? `Voltar para "${STATUS_CONFIG[confirmStep.status].label}"?`
          : `Avançar para "${STATUS_CONFIG[confirmStep.status].label}"?`}
        description={confirmStep.isBack
          ? `O pedido voltará para "${STATUS_CONFIG[confirmStep.status].label}". Use isso caso tenha avançado de etapa por engano. O cliente será notificado.`
          : `O pedido mudará para "${STATUS_CONFIG[confirmStep.status].label}" e o cliente será notificado.`}
        confirmLabel={confirmStep.isBack ? 'Voltar etapa' : 'Confirmar'}
        danger={confirmStep.isBack}
        loading={updating}
        onConfirm={() => performStatusChange(confirmStep.status, confirmStep.description)}
        onClose={() => setConfirmStep(null)}
      />
    )}
    </>
  );
}

export default function MakerOrders() {
  const { error } = useToast();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<'all' | 'active' | 'done'>('all');

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
  const pendingCount   = orders.filter(o => o.status === 'PENDING').length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Pedidos Recebidos</h1>
          <p className="text-gray-400 mt-1">{orders.length} pedido{orders.length !== 1 ? 's' : ''} no total</p>
        </div>
        <button onClick={load} className="btn-ghost !p-2" title="Atualizar">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total',          value: orders.length,  color: 'text-white',          bg: 'bg-white/5'         },
          { label: 'Aguardando ação',value: pendingCount,   color: 'text-yellow-400',     bg: 'bg-yellow-400/10'   },
          { label: 'Concluídos',     value: deliveredCount, color: 'text-emerald-400',    bg: 'bg-emerald-400/10'  },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`glass rounded-xl p-4 border border-white/5 ${bg}`}>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="glass rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-4 mb-6 flex items-center gap-3">
          <ShoppingBag size={18} className="text-yellow-400 shrink-0" />
          <p className="text-sm text-white">
            Você tem <strong className="text-yellow-400">{pendingCount} pedido{pendingCount > 1 ? 's' : ''}</strong> aguardando confirmação.
          </p>
        </div>
      )}

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
              Pedidos criados quando clientes aceitarem suas propostas de orçamento aparecerão aqui.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(o => (
            <MakerOrderCard key={o.id} order={o} onUpdated={load} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
