import { useState, useEffect, useCallback } from 'react';
import { Star, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import { useToast } from '@/components/ui/Toast';
import { makersService } from '@/services/makers.service';
import { formatDate } from '@/utils/format';

type ReviewItem = Awaited<ReturnType<typeof makersService.getReviews>>['data'][number];
type Summary    = Awaited<ReturnType<typeof makersService.getReviews>>['summary'];

const PAGE_SIZE = 10;

export default function MakerReviews() {
  const { error } = useToast();
  const [reviews,  setReviews]  = useState<ReviewItem[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await makersService.getReviews({ page: p, limit: PAGE_SIZE });
      setReviews(res.data);
      setSummary(res.summary);
      setTotal(res.pagination.total);
      setPages(res.pagination.pages || 1);
    } catch {
      error('Erro', 'Não foi possível carregar as avaliações.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { load(page); }, [load, page]);

  const ratingCounts = summary?.ratingCounts ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const maxCount = Math.max(1, ...Object.values(ratingCounts));

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Avaliações</h1>
          <p className="text-gray-400 mt-1">{total} avaliaç{total !== 1 ? 'ões' : 'ão'} recebida{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => load(page)} className="btn-ghost !p-2" title="Atualizar">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-5xl font-black text-white mb-2">{(summary?.rating ?? 0).toFixed(1)}</span>
          <StarRating rating={summary?.rating ?? 0} size={18} />
          <span className="text-xs text-gray-400 mt-2">{summary?.totalReviews ?? 0} avaliações no total</span>
        </div>

        <div className="md:col-span-2 glass rounded-2xl p-6 border border-white/5">
          <h3 className="font-bold text-white mb-4 text-sm">Distribuição das notas</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingCounts[star] ?? 0;
              const pct = (count / maxCount) * 100;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-gray-400 w-10 shrink-0">
                    {star} <Star size={11} className="fill-yellow-400 text-yellow-400" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-yellow-400/70" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Carregando...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20">
          <Star size={48} className="text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhuma avaliação ainda</h3>
          <p className="text-gray-400 text-sm">
            Avaliações de clientes sobre seus produtos e pedidos entregues aparecerão aqui.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="glass rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.client?.name ?? 'Cliente'} src={r.client?.avatar} size="sm" />
                    <span className="font-medium text-white text-sm">{r.client?.name ?? 'Cliente'}</span>
                    {r.product?.name && (
                      <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{r.product.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StarRating rating={r.rating} size={13} />
                    <span className="text-xs text-gray-600">{formatDate(r.createdAt)}</span>
                  </div>
                </div>
                {r.title && <p className="text-sm font-semibold text-white mb-1">{r.title}</p>}
                {r.comment && <p className="text-sm text-gray-400">{r.comment}</p>}
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-ghost !p-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-400">Página {page} de {pages}</span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="btn-ghost !p-2 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
