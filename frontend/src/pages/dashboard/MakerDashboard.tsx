import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, FileText, DollarSign, Star, ArrowRight,
  TrendingUp, Package, RefreshCw, Wallet, Clock, CheckCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import OrderStatusBadge from '@/components/shared/OrderStatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import CurrencyInput from '@/components/ui/CurrencyInput';
import StarRating from '@/components/ui/StarRating';
import Avatar from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency, formatDate } from '@/utils/format';
import { makersService } from '@/services/makers.service';
import { ordersService } from '@/services/orders.service';
import { quotesService } from '@/services/quotes.service';
import type { Order } from '@/types';

interface DashStats {
  totalOrders: number;
  pendingOrders: number;
  monthRevenue: number;
  totalProducts: number;
  openQuotes: number;
  rating: number;
  totalReviews: number;
  balance: number;
}

interface RecentReview {
  rating: number;
  comment?: string;
  client?: { name?: string; avatar?: string };
  createdAt?: string;
}

interface WithdrawalItem {
  id: string;
  amount: number;
  pixKey: string;
  pixKeyType: string;
  status: string;
  createdAt: string;
}

const PIX_KEY_TYPES = [
  { value: 'CPF',    label: 'CPF' },
  { value: 'CNPJ',   label: 'CNPJ' },
  { value: 'EMAIL',  label: 'E-mail' },
  { value: 'PHONE',  label: 'Telefone' },
  { value: 'RANDOM', label: 'Chave aleatória' },
];

const WITHDRAWAL_STATUS: Record<string, { label: string; variant: 'yellow' | 'green' | 'red' | 'gray'; icon: typeof Clock }> = {
  PENDING:  { label: 'Pendente',  variant: 'yellow', icon: Clock },
  PAID:     { label: 'Pago',      variant: 'green',  icon: CheckCircle },
  APPROVED: { label: 'Aprovado',  variant: 'green',  icon: CheckCircle },
  REJECTED: { label: 'Rejeitado', variant: 'red',    icon: Clock },
};

function WithdrawalStatusBadge({ status }: { status: string }) {
  const cfg = WITHDRAWAL_STATUS[status] ?? { label: status, variant: 'gray' as const, icon: Clock };
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="!flex items-center gap-1 shrink-0">
      <Icon size={11} /> {cfg.label}
    </Badge>
  );
}

export default function MakerDashboard() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [stats,        setStats]        = useState<DashStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [openQuotes,   setOpenQuotes]   = useState<{ id: string; title: string; material?: string; budget?: number }[]>([]);
  const [reviews,      setReviews]      = useState<RecentReview[]>([]);
  const [loading,      setLoading]      = useState(true);

  // Modal "Solicitar Saque"
  const [walletOpen,      setWalletOpen]      = useState(false);
  const [walletLoading,   setWalletLoading]   = useState(false);
  const [balancePending,  setBalancePending]  = useState(0);
  const [history,         setHistory]         = useState<WithdrawalItem[]>([]);
  const [amount,          setAmount]          = useState(0);
  const [pixKey,          setPixKey]          = useState('');
  const [pixKeyType,      setPixKeyType]      = useState('CPF');
  const [submitting,      setSubmitting]      = useState(false);

  const loadWallet = useCallback(async () => {
    setWalletLoading(true);
    try {
      const data = await makersService.getWithdrawals();
      setBalancePending(data.balancePending);
      setHistory(data.history);
    } catch (e) {
      console.error(e);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const openWallet = () => {
    setWalletOpen(true);
    loadWallet();
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, orders, quotesData] = await Promise.all([
        makersService.getDashboard(),
        ordersService.getAll({ limit: '5', sortBy: 'createdAt', order: 'desc' }),
        quotesService.getMakerQuotes(),
      ]);

      const d = dash as { stats: DashStats; recentReviews: RecentReview[] };
      setStats(d.stats);
      setReviews(d.recentReviews ?? []);
      setRecentOrders(orders.data ?? []);
      setOpenQuotes((quotesData.open ?? []).slice(0, 3));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const s = stats;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixKey.trim()) { toastError('Informe a chave PIX.'); return; }
    if (amount <= 0) { toastError('Informe um valor válido.'); return; }
    if (amount > (s?.balance ?? 0)) { toastError('Saldo insuficiente para esse valor.'); return; }

    setSubmitting(true);
    try {
      const res = await makersService.requestWithdrawal({ amount, pixKey: pixKey.trim(), pixKeyType });
      success('Solicitação enviada!', res.message ?? 'Processaremos seu saque em até 2 dias úteis.');
      setAmount(0);
      setPixKey('');
      setPixKeyType('CPF');
      await Promise.all([load(), loadWallet()]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Erro ao solicitar saque. Tente novamente.';
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Dashboard Maker</h1>
          <p className="text-gray-400 mt-1">Bem-vindo de volta, {user?.name?.split(' ')[0]}!</p>
        </div>
        <button onClick={load} className="btn-ghost !p-2" title="Atualizar">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: ShoppingBag, label: 'Pedidos Ativos',    value: s?.pendingOrders ?? 0,                     color: 'text-neon-blue',    bg: 'bg-neon-blue/10'    },
          { icon: DollarSign,  label: 'Receita do Mês',    value: formatCurrency(s?.monthRevenue ?? 0),       color: 'text-emerald-400',  bg: 'bg-emerald-400/10'  },
          { icon: Star,        label: 'Avaliação Média',   value: (s?.rating ?? 0).toFixed(1),               color: 'text-yellow-400',   bg: 'bg-yellow-400/10'   },
          { icon: FileText,    label: 'Orçamentos Abertos',value: s?.openQuotes ?? 0,                        color: 'text-neon-purple',  bg: 'bg-neon-purple/10'  },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="glass rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <div className="text-2xl font-black text-white">{loading ? '—' : value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Pedidos Recentes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Pedidos Recentes</h2>
              <Link to="/dashboard/maker/orders" className="btn-ghost text-sm">Ver todos <ArrowRight size={14} /></Link>
            </div>

            {loading ? (
              <div className="glass rounded-2xl p-8 border border-white/5 text-center text-gray-500 text-sm">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" /> Carregando...
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="glass rounded-2xl p-8 border border-white/5 text-center">
                <Package size={36} className="text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Nenhum pedido ainda.</p>
                <p className="text-xs text-gray-600 mt-1">Responda orçamentos para começar a receber pedidos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const title = order.notes ?? order.items?.[0]?.product?.name ?? `Pedido #${order.id.slice(0,6)}`;
                  const client = order.client?.name ?? '—';
                  return (
                    <div key={order.id} className="glass rounded-xl p-4 border border-white/5 hover:border-neon-blue/20 transition-all flex items-center gap-4">
                      <div className="w-10 h-10 bg-neon-blue/10 rounded-xl flex items-center justify-center shrink-0">
                        <Package size={16} className="text-neon-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{title}</p>
                        <p className="text-xs text-gray-400">{client} · {formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-white text-sm">{formatCurrency(order.total)}</div>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <Link to={`/dashboard/maker/orders`} className="btn-ghost text-xs !px-2 !py-1 shrink-0">Ver</Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Orçamentos Disponíveis */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Orçamentos Disponíveis</h2>
              <Link to="/dashboard/maker/quotes" className="btn-ghost text-sm">Ver todos <ArrowRight size={14} /></Link>
            </div>

            {loading ? (
              <div className="glass rounded-2xl p-8 border border-white/5 text-center text-gray-500 text-sm">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" /> Carregando...
              </div>
            ) : openQuotes.length === 0 ? (
              <div className="glass rounded-2xl p-8 border border-white/5 text-center">
                <FileText size={36} className="text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Nenhuma solicitação aberta no momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {openQuotes.map((q) => (
                  <div key={q.id} className="glass rounded-xl p-4 border border-white/5 hover:border-neon-purple/20 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{q.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {q.material && <Badge variant="purple" className="text-xs">{q.material}</Badge>}
                          {q.budget != null && (
                            <span className="text-xs text-gray-400">Orçamento: {formatCurrency(q.budget)}</span>
                          )}
                        </div>
                      </div>
                      <Link to="/dashboard/maker/quotes">
                        <Button size="sm">Responder</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Saldo */}
          <div className="glass rounded-2xl p-5 border border-emerald-500/10 bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign size={16} className="text-emerald-400" />
              <span className="font-bold text-white">Saldo Disponível</span>
            </div>
            <div className="text-3xl font-black text-white mb-1">
              {loading ? '—' : formatCurrency(s?.balance ?? 0)}
            </div>
            {(s?.balance ?? 0) === 0 && !loading && (
              <p className="text-xs text-gray-500">Nenhum saldo acumulado ainda.</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full border-emerald-500/30 text-emerald-400"
              disabled={loading || (s?.balance ?? 0) <= 0}
              onClick={openWallet}
            >
              <Wallet size={14} /> Solicitar Saque
            </Button>
          </div>

          {/* Avaliações */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-yellow-400" />
              <span className="font-bold text-white">Avaliações Recentes</span>
            </div>

            {(s?.totalReviews ?? 0) === 0 && !loading ? (
              <div className="text-center py-4">
                <StarRating rating={0} size={16} />
                <p className="text-xs text-gray-500 mt-2">Nenhuma avaliação ainda.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-black text-white">{(s?.rating ?? 0).toFixed(1)}</span>
                  <div>
                    <StarRating rating={s?.rating ?? 0} size={16} />
                    <span className="text-xs text-gray-400 mt-1 block">{s?.totalReviews ?? 0} avaliações</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {reviews.map((r, i) => (
                    <div key={i} className="border-t border-white/5 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Avatar name={r.client?.name ?? '?'} src={r.client?.avatar} size="sm" />
                          <span className="text-xs font-medium text-white">{r.client?.name ?? 'Cliente'}</span>
                        </div>
                        <StarRating rating={r.rating} size={10} />
                      </div>
                      {r.comment && <p className="text-xs text-gray-400">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Performance */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} /> Performance
            </h3>
            {[
              { label: 'Total de pedidos',   value: loading ? '—' : String(s?.totalOrders ?? 0),   color: 'text-neon-blue'   },
              { label: 'Produtos ativos',    value: loading ? '—' : String(s?.totalProducts ?? 0), color: 'text-neon-purple' },
              { label: 'Total de avaliações',value: loading ? '—' : String(s?.totalReviews ?? 0),  color: 'text-yellow-400'  },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-gray-400">{label}</span>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Solicitar Saque */}
      <Modal isOpen={walletOpen} onClose={() => setWalletOpen(false)} title="Solicitar Saque" size="md">
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
            <div>
              <p className="text-xs text-gray-400">Disponível</p>
              <p className="text-lg font-bold text-emerald-400">{formatCurrency(s?.balance ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Pendente</p>
              <p className="text-lg font-bold text-yellow-400">{formatCurrency(balancePending)}</p>
            </div>
          </div>

          <CurrencyInput label="Valor do saque" value={amount} onChange={setAmount} placeholder="R$ 0,00" />

          <div>
            <label className="label">Tipo de chave PIX</label>
            <select className="input" value={pixKeyType} onChange={(e) => setPixKeyType(e.target.value)}>
              {PIX_KEY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <Input
            label="Chave PIX"
            placeholder="Digite sua chave PIX"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
          />

          <Button type="submit" className="w-full" loading={submitting}>
            Confirmar solicitação
          </Button>

          {/* Histórico de saques */}
          <div className="pt-2">
            <h4 className="text-sm font-bold text-white mb-2">Histórico de saques</h4>
            {walletLoading ? (
              <div className="text-center py-6 text-gray-500 text-sm">
                <RefreshCw size={18} className="animate-spin mx-auto mb-2" /> Carregando...
              </div>
            ) : history.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Nenhuma solicitação de saque ainda.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{formatCurrency(h.amount)}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {formatDate(h.createdAt)} · {PIX_KEY_TYPES.find((t) => t.value === h.pixKeyType)?.label ?? h.pixKeyType}
                      </p>
                    </div>
                    <WithdrawalStatusBadge status={h.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
