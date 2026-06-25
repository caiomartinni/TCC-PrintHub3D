import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, ChevronLeft, ChevronRight, MessageSquare, ExternalLink } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import OrderStatusBadge from '@/components/shared/OrderStatusBadge';
import { useToast } from '@/components/ui/Toast';
import { adminService } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Order, OrderStatus } from '@/types';

export default function AdminOrders() {
  const { error } = useToast();
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [page,    setPage]    = useState(1);

  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminService.getOrders({ page, limit: LIMIT, status: status||undefined, search: search||undefined });
      setOrders(r.data); setTotal(r.pagination.total);
    } catch { error('Erro', 'Não foi possível carregar os pedidos.'); }
    finally { setLoading(false); }
  }, [page, search, status, error]);

  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 350); return () => clearTimeout(t); }, [search, status]); // eslint-disable-line
  useEffect(() => { load(); }, [page]); // eslint-disable-line

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Gestão de Pedidos</h1>
          <p className="text-gray-400 mt-1">{total} pedido{total !== 1 ? 's' : ''} no total</p>
        </div>
        <button onClick={load} className="btn-ghost !p-2"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      <div className="flex gap-3 mb-6">
        <Input placeholder="Buscar por cliente ou e-mail..." icon={<Search size={16} />}
          value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <select className="input w-auto min-w-[180px]" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Todos os status</option>
          {['PENDING','CONFIRMED','PRINTING','QUALITY_CHECK','SHIPPED','DELIVERED','CANCELLED','REFUNDED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Pedido', 'Cliente', 'Maker', 'Valor', 'Status', 'Data', 'Ações'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-16 text-center text-gray-500"><RefreshCw size={20} className="animate-spin mx-auto mb-2" />Carregando...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-16 text-center text-gray-500">Nenhum pedido encontrado</td></tr>
            ) : orders.map((o, i) => {
              const title      = (o as { items?: { product?: { name: string } }[] }).items?.[0]?.product?.name ?? o.notes ?? `#${o.id.slice(-8).toUpperCase()}`;
              const clientName = (o as { client?: { name: string; avatar?: string } }).client?.name ?? 'Cliente';
              const clientAvatar = (o as { client?: { avatar?: string } }).client?.avatar;
              const makerName  = (o as { maker?: { user?: { name: string } } }).maker?.user?.name ?? 'Maker';

              return (
                <tr key={o.id} style={{ borderBottom: i < orders.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                >
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-gray-500">#{o.id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-white font-medium truncate max-w-[140px]">{title}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={clientName} src={clientAvatar} size="sm" />
                      <span className="text-sm text-gray-300 truncate max-w-[100px]">{clientName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 truncate max-w-[100px]">{makerName}</td>
                  <td className="px-4 py-3 text-sm font-bold text-white">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3"><OrderStatusBadge status={o.status as OrderStatus} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/order/${o.id}`} className="btn-ghost !p-1.5 text-gray-400 hover:text-white" title="Ver detalhes">
                        <ExternalLink size={13} />
                      </Link>
                      <Link to={`/order/${o.id}/chat`} className="btn-ghost !p-1.5 text-gray-400 hover:text-neon-blue" title="Chat">
                        <MessageSquare size={13} />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#161616' }}>
            <p className="text-xs text-gray-500">{Math.min((page-1)*LIMIT+1,total)}–{Math.min(page*LIMIT,total)} de {total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-ghost !p-2 disabled:opacity-40"><ChevronLeft size={16}/></button>
              <span className="text-sm text-white">{page}/{totalPages}</span>
              <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="btn-ghost !p-2 disabled:opacity-40"><ChevronRight size={16}/></button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
