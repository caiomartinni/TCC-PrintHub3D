import { orderStatusLabel } from '@/utils/format';
import type { OrderStatus } from '@/types';

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  PENDING:       { label: 'Aguardando',    className: 'badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  CONFIRMED:     { label: 'Confirmado',    className: 'badge bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  PRINTING:      { label: 'Imprimindo',    className: 'badge bg-neon-purple/20 text-neon-purple border border-neon-purple/30' },
  QUALITY_CHECK: { label: 'Controle QA',  className: 'badge bg-orange-500/20 text-orange-400 border border-orange-500/30' },
  SHIPPED:       { label: 'Enviado',       className: 'badge bg-neon-blue/20 text-neon-blue border border-neon-blue/30' },
  DELIVERED:     { label: 'Entregue',      className: 'badge bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  CANCELLED:     { label: 'Cancelado',     className: 'badge bg-red-500/20 text-red-400 border border-red-500/30' },
  REFUNDED:      { label: 'Reembolsado',   className: 'badge bg-gray-500/20 text-gray-400 border border-gray-500/30' },
};

void orderStatusLabel;

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = statusConfig[status];
  return <span className={config.className}>{config.label}</span>;
}
