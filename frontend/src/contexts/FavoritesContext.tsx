import {
  createContext, useContext, useState, useEffect,
  useCallback, ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { productsService } from '@/services/products.service';
import type { Product } from '@/types';

interface FavoritesContextType {
  favoriteIds:      Set<string>;
  favoriteProducts: Product[];
  loading:          boolean;
  isFavorited:      (productId: string) => boolean;
  toggle:           (product: Product) => Promise<void>;
  reload:           () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading,          setLoading]          = useState(false);

  const favoriteIds = new Set(favoriteProducts.map(p => p.id));

  const reload = useCallback(async () => {
    if (!isAuthenticated) { setFavoriteProducts([]); return; }
    setLoading(true);
    try {
      const products = await productsService.getFavorites();
      setFavoriteProducts(products);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => { reload(); }, [reload]);

  const toggle = useCallback(async (product: Product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const alreadyFav = favoriteIds.has(product.id);

    // atualização otimista: reflete mudança imediatamente, reverte se a API falhar
    if (alreadyFav) {
      setFavoriteProducts(prev => prev.filter(p => p.id !== product.id));
    } else {
      setFavoriteProducts(prev => [product, ...prev]);
    }

    try {
      await productsService.toggleFavorite(product.id);
    } catch {
      if (alreadyFav) {
        setFavoriteProducts(prev => [product, ...prev]);
      } else {
        setFavoriteProducts(prev => prev.filter(p => p.id !== product.id));
      }
    }
  }, [isAuthenticated, navigate, favoriteIds]);

  const isFavorited = useCallback((productId: string) => favoriteIds.has(productId), [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, favoriteProducts, loading, isFavorited, toggle, reload }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};
