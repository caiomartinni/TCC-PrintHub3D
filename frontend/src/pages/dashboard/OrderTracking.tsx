import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, Package, CheckCircle, Truck, Star,
  Clock, ExternalLink, MapPin, MessageSquare, XCircle, Undo2,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import { ordersService } from '@/services/orders.service';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Order, OrderStatus, TrackingEntry } from '@/types';
import { CARRIERS } from './MakerOrders';

// ── Status timeline config ────────────────────────────────────────────────────
const STEPS: { status: OrderStatus; label: string; icon: React.ReactNode; desc: string }[] = [
  { status: 'PENDING',       icon: <Clock size={16}/>,       label: 'Pedido recebido',       desc: 'Aguardando confirmação do maker'        },
  { status: 'CONFIRMED',     icon: <CheckCircle size={16}/>, label: 'Confirmado',             desc: 'Maker confirmou e irá produzir a peça'  },
  { status: 'PRINTING',      icon: <Package size={16}/>,     label: 'Em produção',            desc: 'Sua peça está sendo impressa'           },
  { status: 'QUALITY_CHECK', icon: <Star size={16}/>,        label: 'Controle de qualidade', desc: 'Peça impressa — verificando acabamento' },
  { status: 'SHIPPED',       icon: <Truck size={16}/>,       label: 'Enviado',                desc: 'Peça enviada — a caminho!'              },
  { status: 'DELIVERED',     icon: <CheckCircle size={16}/>, label: 'Entregue',               desc: 'Peça entregue com sucesso!'             },
];

const STATUS_ORDER: OrderStatus[] = [
  'PENDING','CONFIRMED','PRINTING','QUALITY_CHECK','SHIPPED','DELIVERED'
];

function getStepIndex(status: OrderStatus) {
  return STATUS_ORDER.indexOf(status);
}

function TrackingStep({
  step, index, currentIndex, trackingHistory,
}: {
  step: typeof STEPS[0];
  index: number;
  currentIndex: number;
  trackingHistory: TrackingEntry[];
}) {
  const isDone    = index <= currentIndex;
  const isCurrent = index === currentIndex;
  const entry     = trackingHistory.find(t => t.status === step.status);

  return (
    <div className="flex gap-4">
      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
          isCurrent
            ? 'bg-neon-blue text-white shadow-[0_0_16px_rgba(0,212,255,0.5)]'
            : isDone
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            : 'bg-white/5 text-gray-600 border border-white/10'
        }`}>
          {step.icon}
        </div>
        {index < STEPS.length - 1 && (
          <div className={`w-0.5 flex-1 min-h-[28px] mt-1 transition-all ${
            isDone ? 'bg-emerald-500/30' : 'bg-white/10'
          }`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className={`font-semibold text-sm ${
            isCurrent ? 'text-neon-blue' : isDone ? 'text-white' : 'text-gray-600'
          }`}>
            {step.label}
            {isCurrent && (
              <span className="ml-2 text-xs bg-neon-blue/20 text-neon-blue px-2 py-0.5 rounded-full">
                Atual
              </span>
            )}
          </p>
          {entry && (
            <span className="text-xs text-gray-500">{formatDate(entry.createdAt)}</span>
          )}
        </div>
        <p className={`text-xs mt-0.5 ${isDone ? 'text-gray-400' : 'text-gray-600'}`}>
          {entry?.description ?? step.desc}
        </p>
        {entry?.location && (
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <MapPin size={10}/>{entry.location}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OrderTracking() {
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
      <div className="text-center py-20 text-gray-500">Carregando...</div>
    </DashboardLayout>
  );

  if (!order) return null;

  const isCancelled  = order.status === 'CANCELLED' || order.status === 'REFUNDED';
  const currentIndex = getStepIndex(isCancelled ? 'PENDING' : order.status);

  // Shipping entry
  const shipEntry    = order.tracking ? [...order.tracking].reverse().find(t => t.status === 'SHIPPED') : null;
  const carrier      = shipEntry?.carrier;
  const trackCode    = shipEntry?.trackingCode;
  const carrierCfg   = carrier ? CARRIERS.find(c => c.name === carrier) : null;
  const trackLink    = carrierCfg && trackCode ? carrierCfg.url(trackCode) : null;

  const makerName = order.maker?.user?.name ?? order.maker?.companyName ?? 'Maker';
  const title     = order.notes ?? order.items?.[0]?.product?.name ?? `Pedido #${order.id.slice(-8).toUpperCase()}`;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="btn-ghost !p-2">
            <ChevronLeft size={20}/>
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Rastreio do Pedido</h1>
            <p className="text-xs text-gray-500 font-mono mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>

        {/* Order summary */}
        <div className="glass rounded-2xl p-5 border border-white/5 mb-6">
          <div className="flex items-center gap-4">
            <Avatar name={makerName} src={order.maker?.user?.avatar} size="lg"/>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate">{title}</p>
              <p className="text-sm text-gray-400 mt-0.5">Maker: {makerName}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-black text-white">{formatCurrency(order.total)}</p>
              <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="rounded-2xl p-4 mb-6"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-sm text-red-400 font-semibold flex items-center gap-1.5">
              {order.status === 'CANCELLED'
                ? <><XCircle size={15} />Pedido cancelado</>
                : <><Undo2 size={15} />Pedido reembolsado</>}
            </p>
          </div>
        )}

        {/* Shipping info banner */}
        {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && carrier && (
          <div className="rounded-2xl p-5 mb-6 space-y-4"
            style={{ background: 'linear-gradient(135deg,rgba(0,212,255,0.08),rgba(0,212,255,0.03))', border: '1px solid rgba(0,212,255,0.25)' }}>
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-neon-blue"/>
              <span className="font-bold text-white">Informações de Envio</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Transportadora</p>
                <p className="font-semibold text-white">{carrier}</p>
              </div>
              {trackCode && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Código de rastreio</p>
                  <p className="font-mono font-semibold text-white text-sm">{trackCode}</p>
                </div>
              )}
            </div>
            {trackLink && (
              <a href={trackLink} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all w-full justify-center"
                style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}>
                <ExternalLink size={14}/> Rastrear no site da {carrier}
              </a>
            )}
            {!trackLink && trackCode && (
              <p className="text-xs text-gray-500">
                Use o código <strong className="text-white font-mono">{trackCode}</strong> no site da {carrier} para rastrear.
              </p>
            )}
          </div>
        )}

        {/* Timeline */}
        {!isCancelled && (
          <div className="glass rounded-2xl p-6 border border-white/5 mb-6">
            <h2 className="font-bold text-white mb-6">Linha do Tempo</h2>
            <div>
              {STEPS.map((step, i) => (
                <TrackingStep
                  key={step.status}
                  step={step}
                  index={i}
                  currentIndex={currentIndex}
                  trackingHistory={order.tracking ?? []}
                />
              ))}
            </div>
          </div>
        )}

        {/* Full history */}
        {order.tracking && order.tracking.length > 0 && (
          <div className="glass rounded-2xl p-5 border border-white/5 mb-6">
            <h2 className="font-bold text-white mb-4 text-sm">Histórico Completo</h2>
            <div className="space-y-3">
              {[...order.tracking].reverse().map(entry => (
                <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-blue shrink-0 mt-1.5"/>
                  <div className="flex-1">
                    <p className="text-sm text-white">{entry.description}</p>
                    {entry.trackingCode && (
                      <p className="text-xs text-gray-500 font-mono mt-0.5">Código: {entry.trackingCode}</p>
                    )}
                    {entry.carrier && (
                      <p className="text-xs text-gray-500 mt-0.5">{entry.carrier}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">{formatDate(entry.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link to={`/order/${order.id}/chat`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-gray-400 border border-white/10 hover:border-neon-blue/30 hover:text-neon-blue transition-all">
            <MessageSquare size={15}/> Abrir Chat
          </Link>
        </div>

      </div>
    </DashboardLayout>
  );
}
