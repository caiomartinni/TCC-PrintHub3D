import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CartItem, Product } from '@/types';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  isOpen: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

// Returns a user-specific localStorage key so carts don't bleed between accounts
const storageKey = (userId?: string) =>
  userId ? `printhub_cart_${userId}` : null;

const loadCart = (userId?: string): CartItem[] => {
  const key = storageKey(userId);
  if (!key) return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [items,  setItems]  = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // ── Reload cart whenever the logged-in user changes ──────────────────────────
  useEffect(() => {
    setItems(loadCart(user?.id));
    setIsOpen(false); // close drawer on account switch
  }, [user?.id]);

  // ── Persist to the current user's key whenever items change ──────────────────
  useEffect(() => {
    const key = storageKey(user?.id);
    if (key) {
      localStorage.setItem(key, JSON.stringify(items));
    }
  }, [items, user?.id]);

  // ── Actions ───────────────────────────────────────────────────────────────────
  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      setItems((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
              : i
          );
        }
        return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
      });
      setIsOpen(true);
    },
    [isAuthenticated, navigate]
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) { removeItem(productId); return; }
      setItems((prev) =>
        prev.map((i) =>
          i.product.id === productId
            ? { ...i, quantity: Math.min(quantity, i.product.stock) }
            : i
        )
      );
    },
    [removeItem]
  );

  const clearCart  = useCallback(() => setItems([]), []);
  const openCart   = useCallback(() => setIsOpen(true),  []);
  const closeCart  = useCallback(() => setIsOpen(false), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total     = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, itemCount, total, isOpen, addItem, removeItem, updateQuantity, clearCart, openCart, closeCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
