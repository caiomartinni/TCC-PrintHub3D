import { useSearchParams, Link } from 'react-router-dom';
import { initMercadoPago, StatusScreen } from '@mercadopago/sdk-react';
import { CheckCircle, XCircle, Clock, ShoppingBag, ChevronRight, FlaskConical } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

// Initialize MP with the same public key (idempotent call)
const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined;
if (publicKey) initMercadoPago(publicKey, { locale: 'pt-BR' });

function StatusIcon({ status }: { status: string }) {
  if (status === 'approved') return (
    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
      <CheckCircle size={36} className="text-emerald-400" />
    </div>
  );
  if (status === 'rejected' || status === 'cancelled') return (
    <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
      <XCircle size={36} className="text-red-400" />
    </div>
  );
  return (
    <div className="w-16 h-16 bg-yellow-400/20 rounded-2xl flex items-center justify-center mx-auto">
      <Clock size={36} className="text-yellow-400" />
    </div>
  );
}

const STATUS_INFO: Record<string, { title: string; msg: string; color: string }> = {
  approved:  { title: 'Pagamento aprovado!',     msg: 'Seu pagamento foi confirmado. O maker foi notificado e iniciará a produção em breve.', color: 'text-emerald-400' },
  pending:   { title: 'Pagamento em análise',    msg: 'Seu pagamento está sendo processado. Você receberá uma notificação assim que for confirmado.', color: 'text-yellow-400' },
  in_process:{ title: 'Processando pagamento…',  msg: 'Aguarde enquanto seu pagamento é processado.', color: 'text-yellow-400' },
  rejected:  { title: 'Pagamento recusado',      msg: 'Não foi possível processar o pagamento. Verifique os dados e tente novamente.', color: 'text-red-400' },
  cancelled: { title: 'Pagamento cancelado',     msg: 'O pagamento foi cancelado.', color: 'text-gray-400' },
};

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') ?? '';
  const orderId   = searchParams.get('orderId')   ?? '';
  const status    = searchParams.get('status')    ?? 'pending';

  const info = STATUS_INFO[status] ?? STATUS_INFO['pending']!;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16 max-w-lg mx-auto px-4 py-12">

        <div className="rounded-2xl overflow-hidden text-center" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="p-8 space-y-4">
            <StatusIcon status={status} />
            <h1 className={`text-2xl font-black ${info.color}`}>{info.title}</h1>
            <p className="text-gray-400 text-sm leading-relaxed">{info.msg}</p>

            {paymentId && (
              <p className="text-xs text-gray-600">
                ID do pagamento: <span className="text-gray-400 font-mono">{paymentId}</span>
              </p>
            )}
          </div>

          {/* Status Screen Brick — real MP payments only */}
          {paymentId && publicKey && !String(paymentId).startsWith('SANDBOX_') && (
            <div className="border-t border-white/8 px-4 pb-6">
              <p className="text-xs text-gray-600 pt-4 mb-4">Detalhes do pagamento:</p>
              <StatusScreen
                initialization={{ paymentId: String(paymentId) }}
                onReady={() => {}}
                onError={(err) => console.error('[MP Status Brick]', err)}
              />
            </div>
          )}

          {/* Sandbox simulation note */}
          {String(paymentId).startsWith('SANDBOX_') && (
            <div className="px-6 pb-4">
              <div className="rounded-xl p-3 text-center" style={{ background: '#1a150a', border: '1px solid rgba(251,191,36,0.2)' }}>
                <p className="text-yellow-400 text-xs flex items-center justify-center gap-1.5"><FlaskConical size={13} className="shrink-0" />Modo sandbox — em produção os detalhes reais do pagamento MP aparecem aqui</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-6 space-y-3 border-t border-white/8">
            {orderId && (
              <Link to={`/order/${orderId}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all text-white"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #9333ea)' }}
              >
                <ShoppingBag size={16} /> Ver meu pedido <ChevronRight size={14} />
              </Link>
            )}
            {status !== 'approved' && orderId && (
              <Link to={`/checkout?orderId=${orderId}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/15 text-sm text-gray-300 hover:bg-white/5 transition-colors"
              >
                Tentar novamente
              </Link>
            )}
            <Link to="/dashboard/client/orders"
              className="block text-center text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
            >
              Ir para Meus Pedidos
            </Link>
          </div>
        </div>

        {/* No public key warning */}
        {!publicKey && paymentId && (
          <div className="mt-4 rounded-xl p-4 text-center" style={{ background: '#1a1a0a', border: '1px solid rgba(251,191,36,0.3)' }}>
            <p className="text-yellow-400 text-xs">
              Para exibir os detalhes do pagamento, adicione <code>VITE_MP_PUBLIC_KEY</code> no arquivo <code>frontend/.env</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
