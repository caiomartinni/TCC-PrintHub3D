import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, MapPin, Package, Clock, Shield, ChevronLeft, ChevronRight, Award, MessageSquare } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StarRating from '@/components/ui/StarRating';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { productsService } from '@/services/products.service';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Product, Review } from '@/types';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isFavorited, toggle } = useFavorites();

  const [product,     setProduct]     = useState<Product | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [notFound,    setNotFound]    = useState(false);
  const [selectedImg, setSelectedImg] = useState(0);
  const [qty,         setQty]         = useState(1);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    productsService.getBySlug(slug)
      .then((p) => setProduct(p))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Reset image index when product changes
  useEffect(() => { setSelectedImg(0); setQty(1); }, [product?.id]);

  const reviews: Review[] = (product as Product & { reviews?: Review[] })?.reviews ?? [];

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Navbar />
      <LoadingSpinner size="lg" />
    </div>
  );

  if (notFound || !product) return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Package size={56} className="text-gray-600" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold text-white">Produto não encontrado</h2>
        <p className="text-gray-400">Este produto pode ter sido removido ou o link está incorreto.</p>
        <Button onClick={() => navigate('/marketplace')}>Voltar ao Marketplace</Button>
      </div>
      <Footer />
    </div>
  );

  const images = (product.images as unknown as string[]) ?? [];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
          <ChevronRight size={14} />
          <span className="text-gray-400">{product.category?.name}</span>
          <ChevronRight size={14} />
          <span className="text-white truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden glass border border-white/10 relative">
              <img
                src={images[selectedImg] || images[0] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImg((s) => Math.max(0, s - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 glass rounded-full p-2 hover:text-white">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setSelectedImg((s) => Math.min(images.length - 1, s + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 glass rounded-full p-2 hover:text-white">
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImg(i)} className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === selectedImg ? 'border-neon-blue' : 'border-white/10'}`}>
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.category && <Badge variant="blue">{product.category.name}</Badge>}
                {product.isFeatured && <Badge variant="purple">Destaque</Badge>}
              </div>
              <h1 className="text-3xl font-black text-white leading-tight">{product.name}</h1>
              <div className="flex items-center gap-3 mt-3">
                <StarRating rating={product.rating} showValue />
                <span className="text-gray-500 text-sm">({product.totalReviews} avaliações)</span>
                <span className="text-gray-500 text-sm">{product.totalSales} vendas</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-white">{formatCurrency(product.price)}</span>
              {product.comparePrice && (
                <span className="text-xl text-gray-500 line-through mb-1">{formatCurrency(product.comparePrice)}</span>
              )}
              {product.comparePrice && (
                <Badge variant="green" className="mb-1">-{Math.round((1 - product.price / product.comparePrice) * 100)}%</Badge>
              )}
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Package size={14} />, label: 'Material', value: product.material },
                { icon: <Package size={14} />, label: 'Cor', value: product.color || 'Não especificado' },
                { icon: <Package size={14} />, label: 'Dimensões', value: product.dimensions || 'Não informado' },
                { icon: <Clock size={14} />, label: 'Tempo de Impressão', value: product.printTime ? `${product.printTime}h` : 'Variável' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="glass rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">{icon}<span>{label}</span></div>
                  <div className="text-sm font-medium text-white">{value}</div>
                </div>
              ))}
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="label !mb-0 whitespace-nowrap">Quantidade:</label>
                <div className="flex items-center gap-1">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 glass rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white font-bold">−</button>
                  <span className="w-10 text-center font-bold text-white">{qty}</span>
                  <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="w-8 h-8 glass rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors text-white font-bold">+</button>
                </div>
                <span className="text-xs text-gray-500">{product.stock} disponíveis</span>
              </div>

              {product.stock === 0 && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  Produto sem estoque
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  disabled={product.stock === 0}
                  onClick={() => {
                    if (product.stock > 0) addItem(product, qty);
                  }}
                >
                  <ShoppingCart size={18} />
                  {product.stock === 0
                    ? 'Esgotado'
                    : `Adicionar ao Carrinho — ${formatCurrency(product.price * qty)}`}
                </Button>
                <button
                  onClick={() => toggle(product)}
                  title={isFavorited(product.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                    isFavorited(product.id)
                      ? 'bg-red-500/20 border-red-500/30 text-red-400'
                      : 'glass border-white/10 text-gray-400 hover:text-red-400'
                  }`}
                >
                  <Heart size={18} fill={isFavorited(product.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {/* Maker */}
            {product.maker && (
              <Link to={`/maker/${product.maker.id}`} className="block glass rounded-2xl p-4 border border-white/5 hover:border-neon-purple/30 transition-all duration-300 group">
                <div className="flex items-center gap-4">
                  <Avatar name={product.maker.user?.name} src={product.maker.user?.avatar} size="lg" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white group-hover:text-neon-purple transition-colors">{product.maker.companyName || product.maker.user?.name}</span>
                      {product.maker.kycStatus === 'APPROVED' && <Award size={14} className="text-neon-blue" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <div className="flex items-center gap-1"><Star size={11} className="fill-yellow-400 text-yellow-400" />{product.maker.rating.toFixed(1)}</div>
                      <div className="flex items-center gap-1"><MapPin size={11} />{product.maker.city}, {product.maker.state}</div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Trust indicators */}
            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              <div className="flex items-center gap-1"><Shield size={12} className="text-neon-blue" />Pagamento seguro</div>
              <div className="flex items-center gap-1"><Package size={12} className="text-emerald-400" />Envio rastreado</div>
              <div className="flex items-center gap-1"><Star size={12} className="text-yellow-400" />Garantia de qualidade</div>
            </div>
          </div>
        </div>

        {/* Description & Reviews */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Descrição</h2>
              <p className="text-gray-400 leading-relaxed">{product.description}</p>
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="gray" className="text-xs">#{tag}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Avaliações</h2>
                <div className="flex items-center gap-2">
                  <StarRating rating={product.rating} size={18} showValue />
                  <span className="text-gray-400 text-sm">({product.totalReviews})</span>
                </div>
              </div>
              {reviews.length === 0 ? (
                <div className="glass rounded-xl p-8 border border-white/5 text-center">
                  <Star size={32} className="text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Nenhuma avaliação ainda.</p>
                  <p className="text-xs text-gray-600 mt-1">Seja o primeiro a avaliar este produto.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="glass rounded-xl p-5 border border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.client?.name ?? '?'} src={r.client?.avatar} size="sm" />
                          <div>
                            <span className="font-medium text-white text-sm">{r.client?.name ?? 'Cliente'}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <StarRating rating={r.rating} size={11} />
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>
                      </div>
                      {r.comment && <p className="text-sm text-gray-400">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2"><MessageSquare size={16} />Solicitar Orçamento</h3>
              <p className="text-sm text-gray-400 mb-4">Precisa de personalização? Solicite um orçamento diretamente com este maker.</p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/quote/request')}>
                Solicitar Orçamento
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
