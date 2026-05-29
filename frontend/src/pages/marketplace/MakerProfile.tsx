import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Package, Star, Award, Globe, Camera, MessageSquare } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shared/ProductCard';
import StarRating from '@/components/ui/StarRating';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { mockMakers, mockProducts } from '@/data/mock';

export default function MakerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const maker = mockMakers.find((m) => m.id === id) || mockMakers[0]!;
  const makerProducts = mockProducts.filter((p) => p.makerId === maker.id);

  const mockReviews = [
    { id: '1', name: 'Ana P.', rating: 5, comment: 'Excelente trabalho! Qualidade impecável e prazo respeitado.', date: '2024-01-20' },
    { id: '2', name: 'Carlos M.', rating: 5, comment: 'Maker top! Comunicação ótima e resultado perfeito.', date: '2024-01-15' },
    { id: '3', name: 'Juliana F.', rating: 4, comment: 'Muito boa qualidade. Só demorou um dia a mais que o estimado.', date: '2024-01-10' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16">
        {/* Header Banner */}
        <div className="h-48 bg-gradient-to-r from-dark-100 via-dark-200 to-dark-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/10 to-neon-purple/10" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(0,212,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(147,51,234,0.15) 0%, transparent 50%)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start gap-6 -mt-16 mb-10 relative z-10">
            <div className="ring-4 ring-[#0a0a0a] rounded-full">
              <Avatar name={maker.user?.name} src={maker.user?.avatar} size="xl" className="!w-24 !h-24 !text-2xl" />
            </div>
            <div className="flex-1 pt-10 md:pt-0">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-black text-white">{maker.companyName || maker.user?.name}</h1>
                    {maker.kycStatus === 'APPROVED' && (
                      <Badge variant="blue"><Award size={10} className="mr-1" />Verificado</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-400 flex-wrap">
                    <div className="flex items-center gap-1"><MapPin size={14} />{maker.city}, {maker.state}</div>
                    <div className="flex items-center gap-1"><Star size={14} className="text-yellow-400" />{maker.rating.toFixed(1)} ({maker.totalReviews} avaliações)</div>
                    <div className="flex items-center gap-1"><Clock size={14} />Responde em ~{maker.responseTime}h</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {maker.instagram && (
                    <button className="btn-ghost !p-2"><Camera size={18} /></button>
                  )}
                  {maker.website && (
                    <button className="btn-ghost !p-2"><Globe size={18} /></button>
                  )}
                  <Button onClick={() => navigate('/quote/request')}>
                    <MessageSquare size={16} />Solicitar Orçamento
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">
              {/* Bio */}
              <div>
                <h2 className="text-xl font-bold text-white mb-3">Sobre</h2>
                <p className="text-gray-400 leading-relaxed">{maker.bio}</p>
              </div>

              {/* Products */}
              {makerProducts.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-5">Produtos ({makerProducts.length})</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {makerProducts.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-white">Avaliações</h2>
                  <StarRating rating={maker.rating} size={18} showValue />
                </div>
                <div className="space-y-4">
                  {mockReviews.map((r) => (
                    <div key={r.id} className="glass rounded-xl p-5 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={r.name} size="sm" />
                          <span className="font-medium text-white text-sm">{r.name}</span>
                        </div>
                        <StarRating rating={r.rating} size={12} />
                      </div>
                      <p className="text-sm text-gray-400">{r.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="font-bold text-white mb-4">Estatísticas</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Pedidos', value: maker.totalOrders },
                    { label: 'Avaliações', value: maker.totalReviews },
                    { label: 'Avaliação', value: `${maker.rating.toFixed(1)}★` },
                    { label: 'Resp. tempo', value: `${maker.responseTime}h` },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <div className="text-xl font-bold gradient-text">{value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Package size={16} />Equipamentos</h3>
                <div className="space-y-2">
                  {maker.printers.map((p) => (
                    <div key={p} className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="text-neon-blue">•</span>{p}
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="font-bold text-white mb-4">Materiais</h3>
                <div className="flex flex-wrap gap-2">
                  {maker.materials.map((m) => <Badge key={m} variant="purple">{m}</Badge>)}
                </div>
              </div>

              {maker.maxBuildVolume && (
                <div className="glass rounded-xl p-4 border border-white/5 text-sm">
                  <span className="text-gray-400">Volume máx. de impressão: </span>
                  <span className="text-white font-medium">{maker.maxBuildVolume}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
