import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, MapPin } from 'lucide-react';
import type { Product } from '@/types';
import { formatCurrency } from '@/utils/format';
import Badge from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';

interface ProductCardProps {
  product: Product;
  onFavorite?: (id: string) => void;
  viewMode?: 'grid' | 'list';
}

export default function ProductCard({ product, onFavorite, viewMode = 'grid' }: ProductCardProps) {
  const { addItem } = useCart();
  const { isFavorited, toggle } = useFavorites();
  const favorited = isFavorited(product.id);


  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
    onFavorite?.(product.id);
  };

  if (viewMode === 'list') return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="glass rounded-xl border border-white/10 hover:border-neon-blue/30 hover:shadow-neon-blue transition-all duration-300 flex gap-4 p-3 items-center">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-dark-700 shrink-0">
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-xs text-gray-300 font-medium">Esgotado</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {product.category && (
            <span className="text-xs text-gray-500 uppercase tracking-wider">{product.category.name}</span>
          )}
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-1 mt-0.5 group-hover:text-neon-blue transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Star size={11} className="fill-yellow-400 text-yellow-400" />
              {product.rating.toFixed(1)}
              <span className="text-gray-600">({product.totalReviews})</span>
            </div>
            <Badge variant="purple" className="text-xs">{product.material}</Badge>
            {product.maker && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={10} />{product.maker.city}, {product.maker.state}
              </span>
            )}
          </div>
        </div>

        {/* Price + actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-lg font-bold text-white">{formatCurrency(product.price)}</span>
          </div>

          <button
            onClick={handleFavorite}
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
              favorited ? 'bg-red-500/20 text-red-400' : 'glass text-gray-500 hover:text-red-400'
            )}
          >
            <Heart size={14} fill={favorited ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (product.stock > 0) addItem(product); }}
            disabled={product.stock === 0}
            title={product.stock === 0 ? 'Esgotado' : 'Adicionar ao carrinho'}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 flex items-center justify-center text-neon-blue hover:bg-neon-blue/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </Link>
  );

  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="glass rounded-2xl overflow-hidden border border-white/10 hover:border-neon-blue/30 hover:shadow-neon-blue transition-all duration-300 h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden bg-dark-700">
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isFeatured && <Badge variant="blue">Destaque</Badge>}
            {product.stock === 0 && <Badge variant="gray">Esgotado</Badge>}
          </div>
          {/* Favorite */}
          <button
            onClick={handleFavorite}
            className={cn(
              'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
              favorited ? 'bg-red-500 text-white' : 'glass text-gray-400 hover:text-red-400'
            )}
          >
            <Heart size={14} fill={favorited ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          {product.category && (
            <span className="text-xs text-gray-500 uppercase tracking-wider">{product.category.name}</span>
          )}
          <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-neon-blue transition-colors line-clamp-2">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-400">{product.rating.toFixed(1)} ({product.totalReviews})</span>
          </div>

          {/* Material */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="purple">{product.material}</Badge>
            {product.color && <span className="text-xs text-gray-500">{product.color}</span>}
          </div>

          {/* Maker Location */}
          {product.maker && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={10} />
              <span>{product.maker.city}, {product.maker.state}</span>
            </div>
          )}

          {/* Price & Action */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
            <div>
              <span className="text-lg font-bold text-white">{formatCurrency(product.price)}</span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (product.stock > 0) addItem(product);
              }}
              disabled={product.stock === 0}
              title={product.stock === 0 ? 'Esgotado' : 'Adicionar ao carrinho'}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 border border-neon-blue/30 flex items-center justify-center text-neon-blue hover:bg-neon-blue/30 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
