import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Package, Star, ShieldCheck, Globe, Camera, MessageSquare, Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shared/ProductCard';
import StarRating from '@/components/ui/StarRating';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { makersService } from '@/services/makers.service';
import { formatDate } from '@/utils/format';
import type { Product } from '@/types';

interface MakerReview {
  id:        string;
  rating:    number;
  title?:    string;
  comment?:  string;
  createdAt: string;
  client: { name: string; avatar?: string | null };
}

interface MakerFull {
  id:            string;
  userId:        string;
  companyName?:  string;
  bio?:          string;
  website?:      string;
  instagram?:    string;
  status:        string;
  rating:        number;
  totalReviews:  number;
  totalOrders:   number;
  city?:         string;
  state?:        string;
  printers:      unknown;   // JSON field — cast to string[]
  materials:     unknown;   // JSON field — cast to string[]
  maxBuildVolume?: string;
  kycStatus:     string;
  user: { name: string; avatar?: string | null; createdAt: string };
  products:      Product[];
  reviews:       MakerReview[];
  _count: { products: number; reviews: number; ordersAsMaker: number };
}

export default function MakerProfile() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();

  const [maker,    setMaker]    = useState<MakerFull | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    makersService.getById(id)
      .then(data => setMaker(data as unknown as MakerFull))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  );

  if (notFound || !maker) return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Search size={56} className="text-gray-600" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold text-white">Maker não encontrado</h2>
        <p className="text-gray-400">Este perfil não existe ou não está disponível.</p>
        <Button onClick={() => navigate('/makers')}>Ver todos os makers</Button>
      </div>
      <Footer />
    </div>
  );

  // Prisma retorna campos JSON como valores JS; precisa de cast explícito para string[]
  const printers  = (maker.printers  as string[]) ?? [];
  const materials = (maker.materials as string[]) ?? [];

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
            <div className="rounded-full">
              <Avatar name={maker.user.name} src={maker.user.avatar ?? undefined} size="xl" className="!w-24 !h-24 !text-2xl" />
            </div>
            <div className="flex-1 pt-10 md:pt-0">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-black text-white">
                      {maker.companyName || maker.user.name}
                    </h1>
                    {maker.kycStatus === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,180,220,0.08))',
                          border: '1px solid rgba(0,212,255,0.35)',
                          color: '#00d4ff',
                        }}>
                        <ShieldCheck size={12} strokeWidth={2.5} />
                        Verificado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-400 flex-wrap">
                    {(maker.city || maker.state) && (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />{maker.city}{maker.city && maker.state ? ', ' : ''}{maker.state}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-400" />
                      {maker.rating.toFixed(1)} ({maker.totalReviews} avaliações)
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {maker.instagram && (
                    <a href={`https://instagram.com/${maker.instagram.replace('@','')}`} target="_blank" rel="noreferrer">
                      <button className="btn-ghost !p-2" title={`Instagram: ${maker.instagram}`}><Camera size={18} /></button>
                    </a>
                  )}
                  {maker.website && (
                    <a href={maker.website} target="_blank" rel="noreferrer">
                      <button className="btn-ghost !p-2" title="Website"><Globe size={18} /></button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-10">

              {/* Bio */}
              {maker.bio && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-3">Sobre</h2>
                  <p className="text-gray-400 leading-relaxed">{maker.bio}</p>
                </div>
              )}

              {/* Products */}
              {maker.products.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-white mb-5">
                    Produtos ({maker._count.products})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {maker.products.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={{ ...p, images: (p.images as unknown as string[]) ?? [] }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold text-white">
                    Avaliações ({maker._count.reviews})
                  </h2>
                  <StarRating rating={maker.rating} size={18} showValue />
                </div>

                {maker.reviews.length === 0 ? (
                  <div className="glass rounded-xl p-8 border border-white/5 text-center">
                    <Star size={28} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhuma avaliação ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {maker.reviews.map((r) => (
                      <div key={r.id} className="glass rounded-xl p-5 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar name={r.client.name} src={r.client.avatar ?? undefined} size="sm" />
                            <span className="font-medium text-white text-sm">{r.client.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <StarRating rating={r.rating} size={12} />
                            <span className="text-xs text-gray-600">{formatDate(r.createdAt)}</span>
                          </div>
                        </div>
                        {r.title && <p className="text-sm font-semibold text-white mb-1">{r.title}</p>}
                        {r.comment && <p className="text-sm text-gray-400">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="font-bold text-white mb-4">Estatísticas</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Pedidos',    value: maker._count.ordersAsMaker },
                    { label: 'Avaliações', value: maker._count.reviews       },
                    { label: 'Avaliação',  value: <span className="inline-flex items-center gap-1">{maker.rating.toFixed(1)}<Star size={14} className="fill-yellow-400 text-yellow-400" /></span> },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <div className="text-xl font-bold gradient-text">{value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              {printers.length > 0 && (
                <div className="glass rounded-2xl p-6 border border-white/5">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Package size={16} />Equipamentos
                  </h3>
                  <div className="space-y-2">
                    {printers.map((p) => (
                      <div key={p} className="text-sm text-gray-400 flex items-center gap-2">
                        <span className="text-neon-blue">•</span>{p}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials */}
              {materials.length > 0 && (
                <div className="glass rounded-2xl p-6 border border-white/5">
                  <h3 className="font-bold text-white mb-4">Materiais</h3>
                  <div className="flex flex-wrap gap-2">
                    {materials.map((m) => (
                      <span key={m} className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: 'rgba(147,51,234,0.12)',
                          border: '1px solid rgba(147,51,234,0.3)',
                          color: '#c084fc',
                        }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Max build volume */}
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
