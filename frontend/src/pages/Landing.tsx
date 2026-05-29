import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Star, Package, ChevronRight, Play, CheckCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/shared/ProductCard';
import MakerCard from '@/components/shared/MakerCard';
import Button from '@/components/ui/Button';
import { mockProducts, mockCategories, mockMakers, stats } from '@/data/mock';
import { formatCurrency } from '@/utils/format';

export default function Landing() {
  const navigate = useNavigate();

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
            {[
              { value: stats.totalMakers.toLocaleString(), label: 'Makers Verificados' },
              { value: stats.totalProducts.toLocaleString(), label: 'Produtos Disponíveis' },
              { value: stats.totalOrders.toLocaleString(), label: 'Pedidos Realizados' },
              { value: `${stats.satisfaction}%`, label: 'Satisfação dos Clientes' },
            ].map(({ value, label }) => (
              <div key={label} className="glass rounded-2xl p-4 border border-white/5">
                <div className="text-3xl font-black gradient-text">{value}</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
          <span className="text-xs text-gray-600">Role para ver mais</span>
          <ChevronRight size={16} className="text-gray-600 rotate-90" />
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title">Explore por Categoria</h2>
          <p className="section-subtitle">Encontre exatamente o que você precisa</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {mockCategories.map((cat) => (
            <Link
              key={cat.id}
              to={`/marketplace?category=${cat.slug}`}
              className="glass rounded-2xl p-4 text-center border border-white/5 hover:border-neon-blue/30 hover:shadow-neon-blue transition-all duration-300 group"
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors leading-tight">
                {cat.name}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">{cat._count?.products}</div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockProducts.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

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
              icon: '🎯', step: '01', title: 'Escolha ou Solicite',
              desc: 'Navegue pelo marketplace e compre produtos prontos, ou envie a descrição da sua peça para receber orçamentos personalizados.'
            },
            {
              icon: '🔍', step: '02', title: 'Compare e Escolha',
              desc: 'Receba propostas de vários makers verificados. Compare preço, prazo, avaliação e distância para escolher o melhor.'
            },
            {
              icon: '📦', step: '03', title: 'Receba em Casa',
              desc: 'Acompanhe sua peça sendo impressa em tempo real e receba direto na sua casa com rastreamento completo.'
            },
          ].map(({ icon, step, title, desc }) => (
            <div key={step} className="glass rounded-2xl p-8 border border-white/5 hover:border-neon-purple/20 transition-all duration-300 text-center">
              <div className="text-5xl mb-4">{icon}</div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {mockMakers.map((maker) => <MakerCard key={maker.id} maker={maker} />)}
        </div>
      </section>

      {/* Quote CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass rounded-3xl p-12 border border-neon-blue/20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-purple/5" />
          <div className="relative">
            <div className="text-5xl mb-6">🚀</div>
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

      {/* Pricing preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="section-title">Exemplos de Preços</h2>
          <p className="section-subtitle">Transparência total nos custos</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Chaveiro', price: 8, material: 'PLA', icon: '🔑' },
            { name: 'Vaso P', price: 35, material: 'PETG', icon: '🌺' },
            { name: 'Miniatura', price: 45, material: 'Resina', icon: '⚔️' },
            { name: 'Engrenagem', price: 55, material: 'ABS', icon: '⚙️' },
            { name: 'Modelo 3D', price: 120, material: 'PLA+', icon: '🏗️' },
            { name: 'Peça Técnica', price: 200, material: 'Nylon', icon: '🔧' },
          ].map(({ name, price, material, icon }) => (
            <div key={name} className="glass rounded-xl p-4 text-center border border-white/5 hover:border-neon-blue/20 transition-all">
              <div className="text-3xl mb-2">{icon}</div>
              <div className="font-semibold text-white text-sm">{name}</div>
              <div className="text-neon-blue font-bold mt-1">a partir de {formatCurrency(price)}</div>
              <div className="text-xs text-gray-500 mt-0.5">{material}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-600 mt-4">*Preços estimados. Varia por complexidade, material e maker.</p>
      </section>

      <Footer />
    </div>
  );
}
