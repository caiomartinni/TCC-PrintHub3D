import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowRight, Zap, Shield, Star, Package, ChevronRight, Play, CheckCircle, Target, Search, Rocket } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shared/ProductCard';
import MakerCard from '@/components/shared/MakerCard';
import CategoryIcon from '@/components/shared/CategoryIcon';
import Button from '@/components/ui/Button';
import type { Category, Product, MakerProfile } from '@/types';
import api from '@/services/api';

export default function Landing() {
  const navigate = useNavigate();
  const [liveStats,  setLiveStats]  = useState({ totalMakers: 0, totalProducts: 0, totalOrders: 0 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [makers,     setMakers]     = useState<MakerProfile[]>([]);

  useEffect(() => {
    api.get('/stats').then(r => {
      setLiveStats((r.data as { data: typeof liveStats }).data);
    }).catch(() => {});

    api.get('/categories').then(r => {
      const data = (r.data as { data: Category[] }).data;
      setCategories(data.filter(c => (c._count?.products ?? 0) > 0));
    }).catch(() => {});

    api.get('/products', { params: { limit: 4, sortBy: 'createdAt', order: 'desc' } }).then(r => {
      setProducts((r.data as { data: Product[] }).data);
    }).catch(() => {});

    api.get('/makers', { params: { limit: 4, sortBy: 'rating', order: 'desc' } }).then(r => {
      setMakers((r.data as { data: MakerProfile[] }).data);
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight mb-8 animate-slide-up">
            Impressão 3D
            <br />
            <span className="gradient-text">sob demanda</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 animate-slide-up">
            Conectamos você aos melhores makers de impressão 3D do Brasil. Peças prontas, personalizadas ou orçamento competitivo em minutos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Button size="lg" onClick={() => navigate('/marketplace')}>
              Explorar Marketplace
              <ArrowRight size={20} />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('/quote/request')}>
              <Play size={16} />
              Solicitar Orçamento
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-20 max-w-3xl mx-auto">
            {[
              { value: liveStats.totalMakers.toLocaleString('pt-BR'),   label: 'Makers Verificados'  },
              { value: liveStats.totalProducts.toLocaleString('pt-BR'), label: 'Produtos Disponíveis' },
              { value: liveStats.totalOrders.toLocaleString('pt-BR'),   label: 'Pedidos Realizados'  },
            ].map(({ value, label }) => (
              <div key={label} className="glass rounded-2xl p-4 border border-white/5">
                <div className="text-3xl font-black gradient-text">{value}</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title">Explore por Categoria</h2>
          <p className="section-subtitle">Encontre exatamente o que você precisa</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/marketplace?category=${cat.slug}`}
              className="glass rounded-2xl p-4 text-center border border-white/5 hover:border-neon-blue/30 hover:shadow-neon-blue transition-all duration-300 group w-32 shrink-0"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-2 group-hover:bg-neon-blue/10 transition-colors">
                <CategoryIcon slug={cat.slug} size={22} />
              </div>
              <div className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors leading-tight">
                {cat.name}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {cat._count?.products ?? 0} {(cat._count?.products ?? 0) === 1 ? 'produto' : 'produtos'}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="section-title">Produtos em Destaque</h2>
            <p className="section-subtitle mt-2">Os favoritos da nossa comunidade</p>
          </div>
          <Link to="/marketplace" className="btn-ghost hidden md:flex">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-600">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum produto disponível no momento.</p>
          </div>
        )}

        <div className="text-center mt-8 md:hidden">
          <Link to="/marketplace"><Button variant="secondary">Ver todos os produtos</Button></Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="section-title">Como Funciona</h2>
          <p className="section-subtitle">Simples, rápido e seguro</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Target, step: '01', title: 'Escolha ou Solicite',
              desc: 'Navegue pelo marketplace e compre produtos prontos, ou envie a descrição da sua peça para receber orçamentos personalizados.'
            },
            {
              icon: Search, step: '02', title: 'Compare e Escolha',
              desc: 'Receba propostas de vários makers verificados. Compare preço, prazo, avaliação e distância para escolher o melhor.'
            },
            {
              icon: Package, step: '03', title: 'Receba em Casa',
              desc: 'Acompanhe sua peça sendo impressa em tempo real e receba direto na sua casa com rastreamento completo.'
            },
          ].map(({ icon: StepIcon, step, title, desc }) => (
            <div key={step} className="glass rounded-2xl p-8 border border-white/5 hover:border-neon-purple/20 transition-all duration-300 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <StepIcon size={28} className="text-white" strokeWidth={1.5} />
              </div>
              <div className="text-xs font-mono text-neon-blue mb-2">{step}</div>
              <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Makers */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="section-title">Top Makers</h2>
            <p className="section-subtitle mt-2">Profissionais verificados e avaliados</p>
          </div>
          <Link to="/makers" className="btn-ghost hidden md:flex">
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        {makers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {makers.map((maker) => <MakerCard key={maker.id} maker={maker} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-600">
            <p className="text-sm">Nenhum maker disponível no momento.</p>
          </div>
        )}
      </section>

      {/* Quote CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass rounded-3xl p-12 border border-neon-blue/20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-purple/5" />
          <div className="relative">
            <Rocket size={44} className="text-white mx-auto mb-6" strokeWidth={1.5} />
            <h2 className="section-title mb-4">Tem uma ideia para imprimir?</h2>
            <p className="section-subtitle mb-8">
              Envie o arquivo STL ou descreva sua peça e receba orçamentos dos makers mais próximos de você em minutos.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              {['Upload STL', 'Descreva a peça', 'Receba propostas', 'Escolha o melhor'].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-neon-blue" />
                  <span className="text-sm text-gray-300">{step}</span>
                  {i < 3 && <ChevronRight size={14} className="text-gray-600 hidden sm:block" />}
                </div>
              ))}
            </div>

            <Button size="lg" onClick={() => navigate('/quote/request')}>
              Solicitar Orçamento Grátis
              <ArrowRight size={20} />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Shield className="text-neon-blue" size={28} />, title: 'Makers Verificados', desc: 'Todos os makers passam por verificação KYC e revisão de qualidade antes de serem aprovados.' },
            { icon: <Zap className="text-neon-purple" size={28} />, title: 'Pagamento Seguro', desc: 'Pagamento protegido com split automático. Dinheiro liberado só após confirmação da entrega.' },
            { icon: <Star className="text-yellow-400" size={28} />, title: 'Qualidade Garantida', desc: 'Sistema de avaliações transparente. 98% de satisfação entre nossos clientes.' },
            { icon: <Package className="text-emerald-400" size={28} />, title: 'Rastreamento Real', desc: 'Acompanhe sua impressão em tempo real desde o início até a entrega na sua porta.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 flex gap-4">
              <div className="shrink-0 w-12 h-12 glass rounded-xl flex items-center justify-center">{icon}</div>
              <div>
                <h3 className="font-bold text-white mb-1">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
