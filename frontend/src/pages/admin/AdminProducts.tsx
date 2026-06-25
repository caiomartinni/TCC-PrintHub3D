import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Eye, EyeOff, ExternalLink } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { adminService, type AdminProduct } from '@/services/admin.service';
import { formatCurrency, formatDate } from '@/utils/format';

export default function AdminProducts() {
  const { success, error } = useToast();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [active,   setActive]   = useState('');
  const [page,     setPage]     = useState(1);
  const [toggling, setToggling] = useState<string | null>(null);

  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminService.getProducts({ page, limit: LIMIT, search: search||undefined, active: active||undefined });
      setProducts(r.data); setTotal(r.pagination.total);
    } catch { error('Erro', 'Não foi possível carregar os produtos.'); }
    finally { setLoading(false); }
  }, [page, search, active, error]);

  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 350); return () => clearTimeout(t); }, [search, active]); // eslint-disable-line
  useEffect(() => { load(); }, [page]); // eslint-disable-line

  const toggle = async (p: AdminProduct) => {
    setToggling(p.id);
    try {
      await adminService.toggleProduct(p.id);
      success(p.isActive ? 'Produto ocultado' : 'Produto reativado', p.name);
      load();
    } catch { error('Erro', 'Não foi possível atualizar.'); }
    finally { setToggling(null); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Gestão de Produtos</h1>
          <p className="text-gray-400 mt-1">{total} produto{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={load} className="btn-ghost !p-2"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      <div className="flex gap-3 mb-6">
        <Input placeholder="Buscar por nome ou descrição..." icon={<Search size={16} />}
          value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <select className="input w-auto" value={active} onChange={e => { setActive(e.target.value); setPage(1); }}>
          <option value="">Todos</option>
          <option value="true">Ativos</option>
          <option value="false">Ocultos</option>
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Produto', 'Maker', 'Preço', 'Estoque', 'Vendas', 'Cadastro', 'Status', 'Ações'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-500"><RefreshCw size={20} className="animate-spin mx-auto mb-2" />Carregando...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-16 text-center text-gray-500">Nenhum produto encontrado</td></tr>
            ) : products.map((p, i) => {
              const images = p.images as string[];
              return (
                <tr key={p.id} style={{ borderBottom: i < products.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none', opacity: p.isActive ? 1 : 0.6 }}
                  onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-700 shrink-0">
                        {images?.[0]
                          ? <img src={images[0]} alt={p.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-white/5" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate max-w-[140px]">{p.name}</p>
                        {p.category && <p className="text-xs text-gray-600">{p.category.name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[100px]">{p.maker?.user?.name ?? p.maker?.companyName}</td>
                  <td className="px-4 py-3 text-sm font-bold text-white">{formatCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{p.stock}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{p.totalSales}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.isActive ? 'green' : 'gray'}>{p.isActive ? 'Ativo' : 'Oculto'}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => toggle(p)} disabled={toggling === p.id}
                        title={p.isActive ? 'Ocultar' : 'Reativar'}
                        className={`btn-ghost !p-1.5 disabled:opacity-40 ${p.isActive ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-emerald-400'}`}>
                        {p.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <Link to={`/product/${p.slug}`} className="btn-ghost !p-1.5 text-gray-400 hover:text-neon-blue" title="Ver produto">
                        <ExternalLink size={13} />
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
