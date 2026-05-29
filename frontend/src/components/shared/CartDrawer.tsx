import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import { cn } from '@/utils/cn';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total, itemCount } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleGoMarketplace = () => {
    closeCart();
    navigate('/marketplace');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out',
          'bg-[#0d0d0d] border-l border-white/10',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-neon-blue" />
            <h2 className="text-lg font-bold text-white">Carrinho</h2>
            {itemCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-neon-blue text-[#0a0a0a] text-xs flex items-center justify-center font-bold">
                {itemCount}
              </span>
            )}
          </div>
          <button onClick={closeCart} className="btn-ghost !p-2">
            <X size={18} />
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
            <div className="text-6xl select-none">🛒</div>
            <h3 className="text-lg font-bold text-white">Seu carrinho está vazio</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Explore o marketplace e adicione produtos que você queira comprar.
            </p>
            <Button variant="secondary" onClick={handleGoMarketplace}>
              Explorar Marketplace
            </Button>
          </div>
        ) : (
          /* Items list */
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="glass rounded-xl p-3 border border-white/5 flex gap-3 group"
              >
                {/* Image */}
                <img
                  src={item.product.images[0] ?? 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200'}
                  alt={item.product.name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0 bg-dark-700"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
                    {item.product.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">{item.product.material}</p>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-white">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 glass rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-6 h-6 glass rounded flex items-center justify-center text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors shrink-0 self-start mt-0.5 opacity-0 group-hover:opacity-100"
                  title="Remover"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/10 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
                </span>
                <span className="text-white font-bold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Frete</span>
                <span>Calculado no checkout</span>
              </div>
            </div>

            <Button className="w-full" onClick={handleCheckout}>
              Finalizar Pedido
              <ArrowRight size={18} />
            </Button>

            <button
              onClick={closeCart}
              className="w-full text-sm text-gray-500 hover:text-gray-300 transition-colors py-1"
            >
              Continuar comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
