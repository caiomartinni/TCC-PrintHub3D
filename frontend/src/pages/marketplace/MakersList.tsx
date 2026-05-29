import { useState } from 'react';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MakerCard from '@/components/shared/MakerCard';
import { mockMakers } from '@/data/mock';
import type { MakerProfile } from '@/types';

const STATES = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'CE', 'DF'];
const MATERIALS = ['PLA', 'ABS', 'PETG', 'Resina', 'TPU', 'Nylon'];

export default function MakersList() {
  const [makers] = useState<MakerProfile[]>(mockMakers);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('rating');

  const filtered = makers
    .filter((m) => {
      if (search) return (m.companyName || m.user?.name || '').toLowerCase().includes(search.toLowerCase());
      if (selectedState && m.state !== selectedState) return false;
      if (selectedMaterials.length && !selectedMaterials.some((mat) => m.materials.includes(mat))) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'orders') return b.totalOrders - a.totalOrders;
      if (sortBy === 'response') return a.responseTime - b.responseTime;
      return 0;
    });

  const toggleMaterial = (m: string) =>
    setSelectedMaterials((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16">
        <div className="glass-dark border-b border-white/5 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-black text-white mb-2">Makers</h1>
            <p className="text-gray-400">{makers.length} makers verificados no Brasil</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar makers..." className="input pl-10 w-full" />
              </div>
              <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="input w-auto">
                <option value="">Todos os estados</option>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input w-auto">
                <option value="rating">Melhor Avaliação</option>
                <option value="orders">Mais Pedidos</option>
                <option value="response">Mais Rápido</option>
              </select>
            </div>

            {/* Material filters */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <SlidersHorizontal size={14} className="text-gray-500" />
              <span className="text-xs text-gray-500">Material:</span>
              {MATERIALS.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleMaterial(m)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${selectedMaterials.includes(m) ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400 text-sm">{filtered.length} maker(s) encontrado(s)</p>
            <div className="flex items-center gap-1 text-xs text-gray-500"><MapPin size={12} />Próximos a você primeiro</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((m) => <MakerCard key={m.id} maker={m} />)}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
