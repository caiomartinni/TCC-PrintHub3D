import { useState, useEffect, useCallback } from 'react';
import { Wallet, TrendingUp, DollarSign, Check, ChevronLeft, ChevronRight, Landmark } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { financeiroService, type FinanceiroResumo, type SaqueItem } from '@/services/financeiro.service';
import { formatCurrency, formatDate } from '@/utils/format';

const PAGE_SIZE = 5;

const cardStyle = {
  background: '#1c1c1f',
  border: '1px solid rgba(255,255,255,0.06)',
};

export default function MakerFinanceiro() {
  const { info } = useToast();

  const [resumo, setResumo] = useState<FinanceiroResumo | null>(null);
  const [loadingResumo, setLoadingResumo] = useState(true);

  const [saques, setSaques] = useState<SaqueItem[]>([]);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loadingSaques, setLoadingSaques] = useState(true);

  useEffect(() => {
    financeiroService.getResumo()
      .then(setResumo)
      .catch(() => {})
      .finally(() => setLoadingResumo(false));
  }, []);

  const loadSaques = useCallback((p: number) => {
    setLoadingSaques(true);
    financeiroService.getSaques(p, PAGE_SIZE)
      .then((res) => {
        setSaques(res.data);
        setPages(res.pagination.pages || 1);
      })
      .catch(() => {})
      .finally(() => setLoadingSaques(false));
  }, []);

  useEffect(() => { loadSaques(page); }, [loadSaques, page]);

  const emBreve = () => info('Em breve', 'Essa funcionalidade ainda está em desenvolvimento.');

  const saldo = resumo?.saldoDisponivel ?? 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-zinc-100">Financeiro</h1>
        <p className="text-zinc-500 mt-1">Acompanhe seu saldo, receitas e histórico de saques.</p>
      </div>

      {/* Linha superior */}
      <div className="flex flex-col lg:flex-row gap-5 mb-5 items-stretch">
        {/* Saldo disponível para saque (~60%) */}
        <div
          className="lg:w-3/5 rounded-xl p-6 flex flex-col"
          style={{ background: '#1c1c1f', border: '1px solid #7c3aed' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={16} style={{ color: '#a78bfa' }} />
            <span className="text-sm font-medium text-zinc-500">Saldo disponível para saque</span>
          </div>
          <div className="text-4xl font-black mb-6" style={{ color: '#a78bfa' }}>
            {loadingResumo ? '—' : formatCurrency(saldo)}
          </div>
          <div className="flex flex-wrap gap-3 mt-auto">
            <Button
              disabled={loadingResumo || saldo <= 0}
              onClick={emBreve}
              style={{ background: '#7c3aed', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
              className="border-0 text-white"
            >
              Solicitar saque
            </Button>
            <Button
              variant="outline"
              onClick={emBreve}
              className="border-white/10 text-zinc-100 hover:bg-white/5"
            >
              Ver dados bancários
            </Button>
          </div>
        </div>

        {/* Receita do mês + Total sacado (~40%) */}
        <div className="lg:w-2/5 flex flex-col gap-5">
          <div className="rounded-xl p-6 flex-1" style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-emerald-400" />
              <span className="text-sm font-medium text-zinc-500">Receita do mês</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: '#4ade80' }}>
              {loadingResumo ? '—' : formatCurrency(resumo?.receitaMes ?? 0)}
            </div>
          </div>

          <div className="rounded-xl p-6 flex-1" style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={16} className="text-zinc-600" />
              <span className="text-sm font-medium text-zinc-500">Total sacado</span>
            </div>
            <div className="text-2xl font-bold text-zinc-600">
              {loadingResumo ? '—' : formatCurrency(resumo?.totalSacado ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de saques */}
      <div className="rounded-xl p-6" style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-100">Histórico de saques</h2>
          <button
            onClick={emBreve}
            className="text-sm font-medium hover:underline transition-colors"
            style={{ color: '#a78bfa' }}
          >
            Ver todos →
          </button>
        </div>

        {loadingSaques ? (
          <div className="text-center py-12 text-zinc-500 text-sm">Carregando...</div>
        ) : saques.length === 0 ? (
          <div className="text-center py-12">
            <Landmark size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Nenhum saque realizado ainda</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-white/[0.06]">
              {saques.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 py-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check size={16} className="text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-100 truncate">
                        {s.banco} •••• {s.ultimosDigitos}
                      </p>
                      <p className="text-xs text-zinc-500">{formatDate(s.dataConclusao)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold" style={{ color: '#4ade80' }}>
                      {formatCurrency(s.valor)}
                    </span>
                    <Badge variant="green">Concluído</Badge>
                  </div>
                </div>
              ))}
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-ghost !p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-zinc-500">Página {page} de {pages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                  className="btn-ghost !p-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
