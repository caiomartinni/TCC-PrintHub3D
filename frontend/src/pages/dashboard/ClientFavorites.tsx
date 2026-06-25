import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, MapPin, RefreshCw, ExternalLink } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/utils/format';

export default function ClientFavorites() {
  const { favoriteProducts, loading, toggle, reload } = useFavorites();
  const { addItem } = useCart();

  const images = (product: { images: unknown }) =>
    (product.images as string[]) ?? [];

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Meus Favoritos</h1>
          <p className="text-gray-400 mt-1">
            {favoriteProducts.length} produto{favoriteProducts.length !== 1 ? 's' : ''} salvos
          </p>
        </div>
        <button onClick={reload} className="btn-ghost !p-2" title="Atualizar">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Carregando...</div>
      ) : favoriteProducts.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={48} className="text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum favorito ainda</h3>
          <p className="text-gray-400 text-sm mb-6">
            Explore o marketplace e salve os produtos que você gostou.
          </p>
          <Link to="/marketplace">
            <Button>Explorar Marketplace</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {favoriteProducts.map((product) => {
            const imgs = images(product);
            const discount = product.comparePrice
              ? Math.round((1 - product.price / product.comparePrice) * 100)
              : null;

            return (
              <div key={product.id} className="glass rounded-2xl overflow-hidden border border-white/10 hover:border-neon-blue/30 transition-all duration-300 flex flex-col group">
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-dark-700">
                  <img
                    src={imgs[0] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {discount && (
                    <div className="absolute top-3 left-3">
                      <Badge variant="green">-{discount}%</Badge>
                    </div>
                  )}
                  {/* Remove favorite button */}
                  <button
                    onClick={() => toggle(product)}
                    title="Remover dos favoritos"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-all duration-200"
                  >
                    <Heart size={14} fill="currentColor" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  {product.category && (
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{product.category.name}</span>
                  )}
                  <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2">
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-400">{product.rating.toFixed(1)} ({product.totalReviews})</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="purple">{product.material}</Badge>
                  </div>

                  {product.maker && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={10} />
                      <span>{product.maker.city}, {product.maker.state}</span>
                    </div>
                  )}

                  {/* Price + Actions */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                    <div>
                      {product.comparePrice && (
                        <span className="text-xs text-gray-500 line-through block">
                          {formatCurrency(product.comparePrice)}
                        </span>
                      )}
                      <span className="text-lg font-bold text-white">{formatCurrency(product.price)}</span>
                    </div>

                    <div className="flex gap-1.5">
                      {/* View product */}
                      <Link
                        to={`/product/${product.slug}`}
                        className="w-8 h-8 glass rounded-lg flex items-center justify-center text-gray-400 hover:text-neon-blue transition-colors"
                        title="Ver produto"
                      >
                        <ExternalLink size={14} />
                      </Link>
                      {/* Add to cart */}
                      <button
                        onClick={() => { if (product.stock > 0) addItem(product); }}
                        disabled={product.stock === 0}
                        title={product.stock === 0 ? 'Esgotado' : 'Adicionar ao carrinho'}
                        className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 flex items-center justify-center text-neon-blue hover:bg-neon-blue/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
