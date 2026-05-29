import { useState } from 'react';
import { Search, Shield, User, Printer, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { formatDate } from '@/utils/format';

const mockUsers = [
  { id: '1', name: 'João Silva', email: 'joao@email.com', role: 'CLIENT', isActive: true, createdAt: '2024-01-15', orders: 8 },
  { id: '2', name: 'Carlos Almeida', email: 'maker1@printhub3d.com', role: 'MAKER', isActive: true, createdAt: '2023-12-01', orders: 152 },
  { id: '3', name: 'Fernanda Costa', email: 'maker2@printhub3d.com', role: 'MAKER', isActive: true, createdAt: '2023-11-15', orders: 267 },
  { id: '4', name: 'Ana Santos', email: 'ana@email.com', role: 'CLIENT', isActive: false, createdAt: '2024-01-20', orders: 2 },
  { id: '5', name: 'Admin', email: 'admin@printhub3d.com', role: 'ADMIN', isActive: true, createdAt: '2023-01-01', orders: 0 },
];

const roleIcon: Record<string, React.ReactNode> = {
  ADMIN: <Shield size={12} />,
  MAKER: <Printer size={12} />,
  CLIENT: <User size={12} />,
};
const roleVariant: Record<string, 'blue' | 'purple' | 'gray'> = {
  ADMIN: 'blue', MAKER: 'purple', CLIENT: 'gray',
};

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const filtered = mockUsers.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.includes(search)) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Gestão de Usuários</h1>
        <p className="text-gray-400 mt-1">{mockUsers.length} usuários cadastrados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input placeholder="Buscar por nome ou e-mail..." icon={<Search size={16} />} value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <select className="input w-auto" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Todos os perfis</option>
          <option value="CLIENT">Clientes</option>
          <option value="MAKER">Makers</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden border border-white/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Perfil</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cadastro</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pedidos</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-white/2 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="sm" />
                    <div>
                      <p className="font-semibold text-white text-sm">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={roleVariant[u.role]!}>
                    <span className="mr-1">{roleIcon[u.role]}</span>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">{formatDate(u.createdAt)}</td>
                <td className="px-6 py-4 text-sm text-white font-semibold">{u.orders}</td>
                <td className="px-6 py-4">
                  {u.isActive
                    ? <span className="flex items-center gap-1 text-emerald-400 text-sm"><CheckCircle size={12} />Ativo</span>
                    : <span className="flex items-center gap-1 text-red-400 text-sm"><XCircle size={12} />Inativo</span>
                  }
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="!px-2"><MoreVertical size={14} /></Button>
                    <Button size="sm" variant={u.isActive ? 'danger' : 'secondary'} className="text-xs">
                      {u.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
