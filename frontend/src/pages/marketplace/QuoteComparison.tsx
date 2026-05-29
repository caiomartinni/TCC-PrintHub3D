import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, Check, DollarSign } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/format';
import { mockMakers } from '@/data/mock';

const mockResponses = [
  { id: '1', maker: mockMakers[0]!, price: 85.00, shippingPrice: 15.00, deadline: 5, notes: 'Entrego em PLA+ de alta resistência. Garanito qualidade premium.', rating: 4.8 },
  { id: '2', maker: mockMakers[1]!, price: 95.00, shippingPrice: 0, deadline: 7, notes: 'Posso fazer em ABS ou PLA+. Frete grátis para São Paulo.', rating: 4.9 },
  { id: '3', maker: { ...mockMakers[0]!, id: 'm3', companyName: 'Print3D Express', rating: 4.5, totalOrders: 78, responseTime: 3, city: 'Campinas', state: 'SP', user: { name: 'Rodrigo B.' } } as typeof mockMakers[0], price: 70.00, shippingPrice: 20.00, deadline: 4, notes: 'Entrega rápida. Material PLA padrão.', rating: 4.5 },
];

export default function QuoteComparison() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Comparar Propostas</h1>
          <p className="text-gray-400 mt-2">Solicitação: "Braço de reposição para drone DJI" · {mockResponses.length} propostas recebidas</p>
        </div>

        {/* Best pick indicator */}
        <div className="glass rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5 mb-6 flex items-center gap-3">
          <Check size={18} className="text-emerald-400" />
          <p className="text-sm text-gray-300">
            <span className="font-bold text-emerald-400">Melhor custo-benefício:</span> {mockMakers[1]!.companyName} — Frete grátis + melhor avaliação
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block glass rounded-2xl overflow-hidden border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Maker</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Preço</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Frete</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Prazo</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Avaliação</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockResponses.map((r, i) => (
                <tr key={r.id} className={`hover:bg-white/2 transition-colors ${i === 1 ? 'bg-emerald-500/5' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.maker.user?.name} size="sm" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{r.maker.companyName}</span>
                          {i === 1 && <Badge variant="green" className="text-xs">Recomendado</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <MapPin size={10} />{r.maker.city}, {r.maker.state}
                        </div>
                      </div>
                    </div>
                    {r.notes && <p className="text-xs text-gray-500 mt-2 max-w-xs">{r.notes}</p>}
                  </td>
                  <td className="px-6 py-5 text-right font-semibold text-white">{formatCurrency(r.price)}</td>
                  <td className="px-6 py-5 text-right">
                    {r.shippingPrice === 0
                      ? <Badge variant="green" className="text-xs">Grátis</Badge>
                      : <span className="text-gray-400 text-sm">{formatCurrency(r.shippingPrice)}</span>
                    }
                  </td>
                  <td className="px-6 py-5 text-right font-bold text-neon-blue">{formatCurrency(r.price + r.shippingPrice)}</td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                      <Clock size={13} />
                      <span>{r.deadline} dias</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-white font-semibold">{r.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <Button size="sm" onClick={() => navigate('/dashboard/client/orders')}>Aceitar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {mockResponses.map((r, i) => (
            <div key={r.id} className={`glass rounded-2xl p-5 border ${i === 1 ? 'border-emerald-500/30' : 'border-white/10'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar name={r.maker.user?.name} size="sm" />
                  <div>
                    <span className="font-bold text-white">{r.maker.companyName}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin size={10} />{r.maker.city}
                    </div>
                  </div>
                </div>
                {i === 1 && <Badge variant="green">Recomendado</Badge>}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="glass rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1"><DollarSign size={10} className="inline" />Total</div>
                  <div className="font-bold text-neon-blue">{formatCurrency(r.price + r.shippingPrice)}</div>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1"><Clock size={10} className="inline" />Prazo</div>
                  <div className="font-semibold text-white">{r.deadline}d</div>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-500 mb-1"><Star size={10} className="inline" />Rating</div>
                  <div className="font-semibold text-white">{r.rating}★</div>
                </div>
              </div>

              <Button className="w-full" onClick={() => navigate('/dashboard/client/orders')}>Aceitar Proposta</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
