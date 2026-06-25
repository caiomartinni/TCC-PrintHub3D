import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MakerCard from '@/components/shared/MakerCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { makersService } from '@/services/makers.service';
import type { MakerProfile } from '@/types';

const STATES    = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'CE', 'DF', 'GO', 'PE', 'AM', 'MT', 'MS'];
const MATERIALS = ['PLA', 'ABS', 'PETG', 'Resina', 'TPU', 'Nylon', 'PLA+'];

export default function MakersList() {
  const [makers,            setMakers]            = useState<MakerProfile[]>([]);
  const [total,             setTotal]             = useState(0);
  const [loading,           setLoading]           = useState(true);
  const [search,            setSearch]            = useState('');
  const [selectedState,     setSelectedState]     = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [sortBy,            setSortBy]            = useState('rating');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        limit: 50,
        sortBy,
        order: 'desc',
      };
      if (search)        params['search'] = search;
      if (selectedState) params['state']  = selectedState;

      const res = await makersService.getAll(params);

      // Client-side material filter (API doesn't support multi-material filter)
      let data = res.data;
      if (selectedMaterials.length > 0) {
        data = data.filter(m => {
          const mats = (m.materials as unknown as string[]) ?? [];
          return selectedMaterials.some(mat => mats.includes(mat));
        });
      }

      setMakers(data);
      setTotal(res.pagination?.total ?? data.length);
    } catch {
      setMakers([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedState, selectedMaterials, sortBy]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [load]);

  const toggleMaterial = (m: string) =>
    setSelectedMaterials(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16">
        <div className="glass-dark border-b border-white/5 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-black text-white mb-2">Makers</h1>
            <p className="text-gray-400">
              {loading ? 'Carregando...' : `${total} maker${total !== 1 ? 's' : ''} verificado${total !== 1 ? 's' : ''} no Brasil`}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar makers..."
                  className="input pl-10 w-full"
                />
              </div>
              <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="input w-auto">
                <option value="">Todos os estados</option>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input w-auto">
                <option value="rating">Melhor Avaliação</option>
                <option value="totalOrders">Mais Pedidos</option>
              </select>
            </div>

            {/* Material filters */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <SlidersHorizontal size={14} className="text-gray-500" />
              <span className="text-xs text-gray-500">Material:</span>
              {MATERIALS.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMaterial(m)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    selectedMaterials.includes(m)
                      ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400 text-sm">
              {loading ? 'Buscando...' : `${makers.length} maker${makers.length !== 1 ? 's' : ''} encontrado${makers.length !== 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={12} />Ordenado por {sortBy === 'rating' ? 'avaliação' : 'pedidos'}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
          ) : makers.length === 0 ? (
            <div className="text-center py-20">
              <Search size={48} className="text-gray-600 mx-auto mb-4" strokeWidth={1.5} />
              <h3 className="text-xl font-bold text-white mb-2">Nenhum maker encontrado</h3>
              <p className="text-gray-400">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {makers.map(m => (
                <MakerCard
                  key={m.id}
                  maker={{ ...m, materials: (m.materials as unknown as string[]) ?? [] }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
