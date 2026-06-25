import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { ChevronLeft, ShoppingBag, Shield, Lock, AlertTriangle, Settings, FlaskConical, CreditCard, RefreshCw, Smartphone, Receipt, Wallet, BarChart3 } from 'lucide-react';
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

  const isSandbox = import.meta.env.VITE_MP_PUBLIC_KEY?.startsWith('TEST-') ?? true;

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

        {isSandbox && (
          <div className="mt-6 space-y-3">
            <div className="rounded-xl p-4" style={{ background: '#1a150a', border: '1px solid rgba(251,191,36,0.3)' }}>
              <p className="text-yellow-400 text-xs font-bold mb-1 flex items-center gap-1.5"><FlaskConical size={13} />Ambiente de teste — todas as formas de pagamento disponíveis</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                Pix, Boleto, Crédito, Débito e conta MP funcionam. O pagamento é simulado — nenhum valor real é cobrado.
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-bold text-gray-300 mb-3 flex items-center gap-1.5"><CreditCard size={14} />Cartão de crédito/débito</p>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2 rounded-lg" style={{ background: '#0d0d0d' }}>
                  <span className="text-gray-500">Mastercard:</span>
                  <span className="text-white ml-2">5031 4332 1540 6351</span>
                  <span className="text-gray-600 ml-2">CVV 123 · 11/30</span>
                </div>
                <div className="p-2 rounded-lg" style={{ background: '#0d0d0d' }}>
                  <span className="text-gray-500">Visa:</span>
                  <span className="text-white ml-2">4235 6477 2802 5682</span>
                  <span className="text-gray-600 ml-2">CVV 123 · 11/30</span>
                </div>
                <div className="p-2 rounded-lg" style={{ background: '#0d0d0d' }}>
                  <span className="text-gray-500">Amex:</span>
                  <span className="text-white ml-2">3753 651535 56885</span>
                  <span className="text-gray-600 ml-2">CVV 1234 · 11/30</span>
                </div>
                <div className="flex flex-wrap gap-4 pt-2 pb-1">
                  <span><span className="text-gray-500">Nome titular:</span> <span className="text-emerald-400 font-bold">APRO</span> <span className="text-gray-600">= aprovado</span></span>
                  <span><span className="text-gray-500">CPF:</span> <span className="text-white">12345678909</span></span>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-bold text-gray-300 mb-3 flex items-center gap-1.5"><RefreshCw size={13} />Outros métodos (simulados)</p>
              <div className="space-y-1.5 text-xs text-gray-400">
                <p className="flex items-center gap-1.5"><Smartphone size={13} className="shrink-0" /><span className="text-white">Pix</span> — informe qualquer email e confirme</p>
                <p className="flex items-center gap-1.5"><Receipt size={13} className="shrink-0" /><span className="text-white">Boleto</span> — gera boleto de teste, pagamento simulado</p>
                <p className="flex items-center gap-1.5"><Wallet size={13} className="shrink-0" /><span className="text-white">Conta Mercado Pago</span> — qualquer email de teste</p>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs font-bold text-gray-300 mb-3 flex items-center gap-1.5"><BarChart3 size={14} />Resultados por nome no cartão</p>
              <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                {[
                  { name: 'APRO',  desc: 'Aprovado',            color: 'text-emerald-400' },
                  { name: 'CONT',  desc: 'Pendente',            color: 'text-yellow-400'  },
                  { name: 'CALL',  desc: 'Ligue para validar',  color: 'text-yellow-400'  },
                  { name: 'FUND',  desc: 'Sem fundos',          color: 'text-red-400'     },
                  { name: 'SECU',  desc: 'Código inválido',     color: 'text-red-400'     },
                  { name: 'OTHE',  desc: 'Recusado geral',      color: 'text-red-400'     },
                ].map(({ name, desc, color }) => (
                  <div key={name} className="p-1.5 rounded-lg flex items-center gap-2" style={{ background: '#0d0d0d' }}>
                    <span className={`font-bold ${color}`}>{name}</span>
                    <span className="text-gray-600 text-[10px]">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
