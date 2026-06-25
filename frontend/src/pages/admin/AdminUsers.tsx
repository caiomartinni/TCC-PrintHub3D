import { useState, useEffect, useCallback } from 'react';
import {
  Search, Shield, User, Printer, CheckCircle, XCircle,
  RefreshCw, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight,
  Crown, AlertCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { adminService, type AdminUser } from '@/services/admin.service';
import { formatDate } from '@/utils/format';

const ROLE_CONFIG = {
  ADMIN:  { label: 'Admin',   icon: <Crown   size={11} />, bg: 'rgba(0,212,255,0.15)',   color: '#00d4ff',  border: 'rgba(0,212,255,0.35)'   },
  MAKER:  { label: 'Maker',   icon: <Printer size={11} />, bg: 'rgba(147,51,234,0.15)',  color: '#9333ea',  border: 'rgba(147,51,234,0.35)'  },
  CLIENT: { label: 'Cliente', icon: <User    size={11} />, bg: 'rgba(255,255,255,0.07)', color: '#d1d5db',  border: 'rgba(255,255,255,0.18)' },
};

const MAKER_STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: 'Ativo',    color: 'text-emerald-400' },
  PENDING:   { label: 'Pendente', color: 'text-yellow-400'  },
  SUSPENDED: { label: 'Suspenso', color: 'text-red-400'     },
  REJECTED:  { label: 'Rejeitado',color: 'text-red-400'     },
};

export default function AdminUsers() {
  const { success, error } = useToast();

  const [users,      setUsers]      = useState<AdminUser[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page,       setPage]       = useState(1);
  const [toggling,   setToggling]   = useState<string | null>(null);

  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        page, limit: LIMIT,
        search: search || undefined,
        role:   roleFilter || undefined,
      });
      setUsers(res.data);
      setTotal(res.pagination.total);
    } catch {
      error('Erro', 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, error]);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(); }, 400);
    return () => clearTimeout(t);
  }, [search, roleFilter]); // eslint-disable-line

  useEffect(() => { load(); }, [page]); // eslint-disable-line

  const handleToggle = async (u: AdminUser) => {
    setToggling(u.id);
    try {
      await adminService.toggleUser(u.id);
      success(
        u.isActive ? 'Usuário desativado' : 'Usuário ativado',
        `${u.name} foi ${u.isActive ? 'desativado' : 'ativado'}.`
      );
      load();
    } catch {
      error('Erro', 'Não foi possível atualizar o usuário.');
    } finally {
      setToggling(null);
    }
  };

  const handleMakerAction = async (makerId: string, action: 'approve' | 'reject', makerName: string) => {
    try {
      await adminService.approveMaker(makerId, action);
      success(
        action === 'approve' ? 'Maker aprovado!' : 'Maker rejeitado',
        `${makerName} foi ${action === 'approve' ? 'aprovado' : 'rejeitado'}.`
      );
      load();
    } catch {
      error('Erro', 'Não foi possível atualizar o maker.');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const stats = [
    { label: 'Total',   value: total,                             color: 'text-white',         bg: 'bg-white/5'        },
    { label: 'Clientes',value: users.filter(u => u.role === 'CLIENT').length, color: 'text-gray-300', bg: 'bg-white/5' },
    { label: 'Makers',  value: users.filter(u => u.role === 'MAKER').length,  color: 'text-neon-purple', bg: 'bg-neon-purple/10' },
    { label: 'Inativos',value: users.filter(u => !u.isActive).length,         color: 'text-red-400', bg: 'bg-red-400/10' },
  ];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Gestão de Usuários</h1>
          <p className="text-gray-400 mt-1">{total} usuário{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={load} className="btn-ghost !p-2" title="Atualizar">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, color, bg }) => (
          <div key={label} className={`glass rounded-xl p-4 border border-white/5 ${bg}`}>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Buscar por nome ou e-mail..."
          icon={<Search size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          className="input w-auto min-w-[160px]"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">Todos os perfis</option>
          <option value="CLIENT">Clientes</option>
          <option value="MAKER">Makers</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Usuário', 'Perfil', 'Cadastro', 'Pedidos', 'Status', 'Ações'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-gray-500">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
                  Carregando...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-gray-500">
                  Nenhum usuário encontrado
                </td>
              </tr>
            ) : (
              users.map((u, idx) => {
                const role = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.CLIENT;
                const makerStatus = u.makerProfile ? MAKER_STATUS[u.makerProfile.status] : null;
                const orderCount  = u._count?.ordersAsClient ?? 0;

                return (
                  <tr key={u.id}
                    className="transition-colors"
                    style={{
                      borderBottom: idx < users.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      opacity: u.isActive ? 1 : 0.6,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* User info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} src={u.avatar} size="sm" />
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{u.name}</p>
                          <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          {u.phone && <p className="text-xs text-gray-600">{u.phone}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        {/* Pill rendered inline to guarantee consistent shape */}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '2px 10px', borderRadius: '9999px',
                          fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap',
                          background: role.bg, color: role.color,
                          border: `1px solid ${role.border}`,
                        }}>
                          {role.icon}{role.label}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {formatDate(u.createdAt)}
                    </td>

                    {/* Orders */}
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-white">{orderCount}</span>
                      <span className="text-xs text-gray-600 ml-1">pedido{orderCount !== 1 ? 's' : ''}</span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      {u.isActive
                        ? <span className="flex items-center gap-1.5 text-emerald-400 text-sm"><CheckCircle size={13} />Ativo</span>
                        : <span className="flex items-center gap-1.5 text-red-400 text-sm"><XCircle size={13} />Inativo</span>
                      }
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Toggle active/inactive — not for ADMINs */}
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggle(u)}
                            disabled={toggling === u.id}
                            title={u.isActive ? 'Desativar usuário' : 'Ativar usuário'}
                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                              u.isActive
                                ? 'text-red-400 border-red-500/30 hover:bg-red-500/10'
                                : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
                            } disabled:opacity-40`}
                          >
                            {toggling === u.id
                              ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              : u.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />
                            }
                            {u.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                        )}

                        {/* Maker approval actions */}
                        {u.role === 'MAKER' && u.makerProfile?.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleMakerAction(u.makerProfile!.id!, 'approve', u.name)}
                              className="flex items-center gap-1 text-xs text-emerald-400 border border-emerald-500/30 px-2 py-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                            >
                              <CheckCircle size={11} /> Aprovar
                            </button>
                            <button
                              onClick={() => handleMakerAction(u.makerProfile!.id!, 'reject', u.name)}
                              className="flex items-center gap-1 text-xs text-red-400 border border-red-500/30 px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                            >
                              <AlertCircle size={11} /> Rejeitar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#161616' }}>
            <p className="text-xs text-gray-500">
              Mostrando {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost !p-2 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-white font-medium">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-ghost !p-2 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
