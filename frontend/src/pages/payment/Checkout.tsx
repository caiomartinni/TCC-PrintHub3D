import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { ChevronLeft, ShoppingBag, Shield, Lock, AlertTriangle, Settings } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { paymentService, type PreferenceData } from '@/services/payment.service';
import { formatCurrency } from '@/utils/format';

export default function Checkout() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const orderId         = searchParams.get('orderId') ?? '';

  const [prefData,  setPrefData]  = useState<PreferenceData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [mpReady,   setMpReady]   = useState(false);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) { setErrorMsg('ID do pedido não informado.'); setLoading(false); return; }
    const envKey = import.meta.env.VITE_MP_PUBLIC_KEY as string;
    paymentService.createPreference(orderId)
      .then(data => {
        setPrefData(data);
        const key = envKey || data.publicKey;
        if (!key || key.includes('placeholder') || key.includes('coloque')) {
          setErrorMsg('Configure VITE_MP_PUBLIC_KEY no arquivo frontend/.env com sua chave de teste do Mercado Pago.');
          return;
        }
        initMercadoPago(key, { locale: 'pt-BR' });
        setMpReady(true);
      })
      .catch(err => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Não foi possível iniciar o pagamento.';
        setErrorMsg(msg);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const onSubmit = async ({ formData }: { selectedPaymentMethod: string; formData: Record<string, unknown> }) => {
    return new Promise<void>((resolve, reject) => {
      paymentService.processPayment(orderId, formData)
        .then(result => {
          resolve();
          navigate(`/payment/status?paymentId=${result.paymentId}&orderId=${orderId}&status=${result.status}`);
        })
        .catch((err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
            ?? 'Erro ao processar pagamento. Tente novamente.';
          setErrorMsg(msg);
          reject();
        });
    });
  };

  const customization = {
    paymentMethods: {
      creditCard:   'all' as const,
      debitCard:    'all' as const,
      ticket:       'all' as const,
      bankTransfer: 'all' as const,
      mercadoPago:  'all' as const,
    },
    visual: { style: { theme: 'dark' as const } },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16 max-w-2xl mx-auto px-4 py-10">

        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard/client/orders" className="btn-ghost !p-2">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <ShoppingBag size={22} className="text-neon-blue" /> Finalizar Pagamento
            </h1>
            {prefData && (
              <p className="text-gray-400 text-sm mt-0.5">
                {prefData.title} — <span className="text-white font-bold">{formatCurrency(prefData.amount)}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><Lock size={12} className="text-emerald-400" /> Pagamento seguro</span>
          <span className="flex items-center gap-1.5"><Shield size={12} className="text-neon-blue" /> Dados criptografados</span>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="px-6 py-4" style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="font-bold text-white">Escolha a forma de pagamento</h2>
            <p className="text-xs text-gray-500 mt-0.5">Crédito, Débito, Pix, Boleto ou conta Mercado Pago</p>
          </div>

          <div className="p-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <span className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Carregando formas de pagamento...</p>
              </div>
            )}

            {errorMsg && (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Erro ao carregar pagamento</p>
                  <p className="text-gray-400 text-sm mt-1">{errorMsg}</p>
                  {errorMsg.includes('placeholder') || errorMsg.includes('credencial') ? (
                    <div className="mt-4 p-4 rounded-xl text-left" style={{ background: '#1a1a0a', border: '1px solid rgba(251,191,36,0.3)' }}>
                      <p className="text-yellow-400 text-xs font-bold mb-1 flex items-center gap-1.5"><Settings size={13} />Configure suas credenciais</p>
                      <p className="text-gray-400 text-xs">
                        Adicione no arquivo <code className="text-yellow-400">backend/.env</code>:<br/>
                        <code className="text-white">MERCADO_PAGO_PUBLIC_KEY=TEST-sua-chave</code><br/>
                        <code className="text-white">MERCADO_PAGO_ACCESS_TOKEN=TEST-seu-token</code>
                      </p>
                      <a href="https://www.mercadopago.com.br/developers/panel/credentials"
                        target="_blank" rel="noreferrer"
                        className="inline-block mt-2 text-xs text-neon-blue hover:underline">
                        → Obter credenciais de teste no Mercado Pago
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {mpReady && prefData && !errorMsg && (
              <Payment
                initialization={{
                  amount:       prefData.amount,
                  preferenceId: prefData.preferenceId,
                }}
                customization={customization}
                onSubmit={onSubmit}
                onReady={() => {}}
                onError={(err) => console.error('[MP Brick] error:', err)}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
