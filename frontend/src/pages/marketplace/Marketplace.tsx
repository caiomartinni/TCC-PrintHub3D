import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Grid3x3, List } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shared/ProductCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { mockProducts, mockCategories } from '@/data/mock';
import type { Product } from '@/types';

const MATERIALS = ['PLA', 'ABS', 'PETG', 'Resina', 'TPU', 'Nylon', 'PLA+'];
const SORT_OPTIONS = [
  { label: 'Mais Recentes', value: 'createdAt' },
  { label: 'Menor Preço', value: 'price_asc' },
  { label: 'Maior Preço', value: 'price_desc' },
  { label: 'Mais Vendidos', value: 'totalSales' },
  { label: 'Melhor Avaliação', value: 'rating' },
];

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('createdAt');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      let filtered = [...mockProducts];
      if (search) filtered = filtered.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));
      if (selectedCategory) filtered = filtered.filter((p) => p.category?.slug === selectedCategory);
      if (selectedMaterials.length) filtered = filtered.filter((p) => selectedMaterials.includes(p.material));
      if (priceRange.min) filtered = filtered.filter((p) => p.price >= parseFloat(priceRange.min));
      if (priceRange.max) filtered = filtered.filter((p) => p.price <= parseFloat(priceRange.max));
      if (sortBy === 'price_asc') filtered.sort((a, b) => a.price - b.price);
      else if (sortBy === 'price_desc') filtered.sort((a, b) => b.price - a.price);
      else if (sortBy === 'totalSales') filtered.sort((a, b) => b.totalSales - a.totalSales);
      else if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating);
      setProducts(filtered);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedMaterials, priceRange, sortBy]);

  const toggleMaterial = (m: string) =>
    setSelectedMaterials((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);

  const clearFilters = () => {
    setSearch(''); setSelectedCategory(''); setSelectedMaterials([]);
    setPriceRange({ min: '', max: '' }); setSearchParams({});
  };

  const hasFilters = search || selectedCategory || selectedMaterials.length || priceRange.min || priceRange.max;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="glass-dark border-b border-white/5 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-black text-white mb-2">Marketplace</h1>
            <p className="text-gray-400">Explore {mockProducts.length}+ produtos únicos de impressão 3D</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar produtos, materiais, tags..."
                  className="input pl-10 w-full"
                />
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input w-auto min-w-[180px]">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary gap-2 ${showFilters ? 'border-neon-blue/50 text-neon-blue' : ''}`}>
                <SlidersHorizontal size={16} />Filtros
                {hasFilters && <span className="w-2 h-2 rounded-full bg-neon-blue" />}
              </button>
              <div className="flex gap-1">
                <button onClick={() => setViewMode('grid')} className={`btn-ghost !p-2.5 ${viewMode === 'grid' ? 'text-neon-blue' : ''}`}><Grid3x3 size={18} /></button>
                <button onClick={() => setViewMode('list')} className={`btn-ghost !p-2.5 ${viewMode === 'list' ? 'text-neon-blue' : ''}`}><List size={18} /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar Filters */}
            {showFilters && (
              <aside className="w-64 shrink-0 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white">Filtros</h3>
                  {hasFilters && (
                    <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1">
                      <X size={12} />Limpar
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Categorias</h4>
                  <div className="space-y-1">
                    <button onClick={() => setSelectedCategory('')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory ? 'bg-neon-blue/20 text-neon-blue' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                      Todas
                    </button>
                    {mockCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${selectedCategory === cat.slug ? 'bg-neon-blue/20 text-neon-blue' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                      >
                        <span>{cat.icon} {cat.name}</span>
                        <span className="text-xs opacity-60">{cat._count?.products}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Materials */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Material</h4>
                  <div className="flex flex-wrap gap-2">
                    {MATERIALS.map((m) => (
                      <button
                        key={m}
                        onClick={() => toggleMaterial(m)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${selectedMaterials.includes(m) ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Faixa de Preço</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Min" type="number" value={priceRange.min} onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))} className="!text-sm" />
                    <Input placeholder="Max" type="number" value={priceRange.max} onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))} className="!text-sm" />
                  </div>
                </div>
              </aside>
            )}

            {/* Products */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-400 text-sm">{products.length} produto(s) encontrado(s)</p>
                {hasFilters && (
                  <div className="flex flex-wrap gap-2">
                    {selectedCategory && <Badge variant="blue" className="cursor-pointer" onClick={() => setSelectedCategory('')}>{selectedCategory} <X size={10} /></Badge>}
                    {selectedMaterials.map((m) => <Badge key={m} variant="purple" className="cursor-pointer" onClick={() => toggleMaterial(m)}>{m} <X size={10} /></Badge>)}
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-white mb-2">Nenhum produto encontrado</h3>
                  <p className="text-gray-400 mb-6">Tente ajustar os filtros ou buscar por outros termos</p>
                  <Button variant="secondary" onClick={clearFilters}>Limpar Filtros</Button>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5' : 'space-y-4'}>
                  {products.map((p) => <ProductCard key={p.id} product={p} />)}
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
