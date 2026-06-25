import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, FileText, MessageSquare, Package, CheckCircle, Star, Printer, Shield, DollarSign, Lock, MapPin } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';

const CLIENT_STEPS = [
  { icon: <ShoppingCart size={24} />, title: 'Explore o Marketplace', desc: 'Navegue por centenas de produtos prontos de makers verificados em todo o Brasil. Filtre por material, localização e avaliação.' },
  { icon: <FileText size={24} />, title: 'Solicite um Orçamento', desc: 'Precisa de algo personalizado? Descreva sua peça, envie imagens ou arquivo STL e receba propostas de makers próximos a você.' },
  { icon: <MessageSquare size={24} />, title: 'Analise e Negocie', desc: 'Compare propostas de diferentes makers — preço, prazo, avaliação e distância. Converse diretamente no chat antes de decidir.' },
  { icon: <Package size={24} />, title: 'Pedido e Acompanhamento', desc: 'Após aceitar a proposta e realizar o pagamento, acompanhe cada etapa: impressão, controle de qualidade, envio e entrega.' },
  { icon: <Star size={24} />, title: 'Avalie o Maker', desc: 'Após receber o produto, avalie o maker. Sua avaliação ajuda outros clientes e incentiva a qualidade na plataforma.' },
];

const MAKER_STEPS = [
  { icon: <Printer size={24} />, title: 'Crie seu Perfil', desc: 'Cadastre-se como maker, informe suas impressoras, materiais e localização. Quanto mais completo seu perfil, mais pedidos você recebe.' },
  { icon: <Shield size={24} />, title: 'Verificação de Identidade', desc: 'Envie selfie e documento de identificação. Após aprovação pela equipe PrintHub3D, seu perfil fica ativo no marketplace.' },
  { icon: <FileText size={24} />, title: 'Receba Solicitações', desc: 'Clientes próximos à sua localização enviarão solicitações de orçamento. Você decide quais aceitar e envia suas propostas.' },
  { icon: <MessageSquare size={24} />, title: 'Converse com o Cliente', desc: 'Use o chat integrado para esclarecer dúvidas, alinhar expectativas e garantir que o cliente receba exatamente o que precisa.' },
  { icon: <DollarSign size={24} />, title: 'Receba seu Pagamento', desc: 'Após a entrega confirmada, você recebe 95% do valor diretamente na sua conta. A PrintHub3D retém apenas 5% de comissão.' },
];

export default function ComoFunciona() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16">

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-10 text-sm">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <h1 className="text-5xl font-black text-white mb-4">
            Como Funciona o <span className="gradient-text">PrintHub3D</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Conectamos clientes que precisam de impressão 3D a makers verificados em todo o Brasil, de forma simples, segura e transparente.
          </p>
        </section>

        {/* Client flow */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border border-neon-blue/30 text-neon-blue text-sm mb-4">
              <ShoppingCart size={14} /> Para Clientes
            </div>
            <h2 className="text-3xl font-black text-white">Compre ou encomende em 5 passos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {CLIENT_STEPS.map((step, i) => (
              <div key={i} className="relative">
                <div className="glass rounded-2xl p-5 border border-white/5 hover:border-neon-blue/20 transition-all h-full">
                  <div className="w-10 h-10 bg-neon-blue/15 rounded-xl flex items-center justify-center text-neon-blue mb-4">
                    {step.icon}
                  </div>
                  <div className="text-xs font-mono text-neon-blue/60 mb-1">0{i + 1}</div>
                  <h3 className="font-bold text-white text-sm mb-2">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
                {i < CLIENT_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 z-10 text-gray-700 text-lg">→</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Maker flow */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full border border-neon-purple/30 text-neon-purple text-sm mb-4">
              <Printer size={14} /> Para Makers
            </div>
            <h2 className="text-3xl font-black text-white">Venda sua impressão em 5 passos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {MAKER_STEPS.map((step, i) => (
              <div key={i} className="relative">
                <div className="glass rounded-2xl p-5 border border-white/5 hover:border-neon-purple/20 transition-all h-full">
                  <div className="w-10 h-10 bg-neon-purple/15 rounded-xl flex items-center justify-center text-neon-purple mb-4">
                    {step.icon}
                  </div>
                  <div className="text-xs font-mono text-neon-purple/60 mb-1">0{i + 1}</div>
                  <h3 className="font-bold text-white text-sm mb-2">{step.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
                {i < MAKER_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 z-10 text-gray-700 text-lg">→</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Guarantees */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <h2 className="text-3xl font-black text-white text-center mb-10">Por que escolher a PrintHub3D?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Lock, title: 'Pagamento Seguro', desc: 'Processado pelo Mercado Pago. O dinheiro fica retido até a confirmação da entrega.' },
              { icon: CheckCircle, title: 'Makers Verificados', desc: 'Todos passam por verificação de identidade antes de ativar o perfil na plataforma.' },
              { icon: Star, title: 'Sistema de Avaliações', desc: 'Transparência total. Veja as avaliações reais de outros clientes antes de contratar.' },
              { icon: MessageSquare, title: 'Chat Integrado', desc: 'Comunique-se diretamente com o maker em cada pedido sem sair da plataforma.' },
              { icon: MapPin, title: 'Makers Próximos', desc: 'Priorizamos makers próximos à sua localização para fretes mais rápidos e baratos.' },
              { icon: Shield, title: 'Suporte Dedicado', desc: 'Nossa equipe está disponível para mediar disputas e garantir sua satisfação.' },
            ].map(({ icon: FeatureIcon, title, desc }) => (
              <div key={title} className="glass rounded-2xl p-6 border border-white/5 flex gap-4">
                <span className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <FeatureIcon size={20} className="text-white" strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 text-center">
          <div className="glass rounded-3xl p-12 border border-neon-blue/15 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 to-neon-purple/5" />
            <div className="relative">
              <h2 className="text-3xl font-black text-white mb-3">Pronto para começar?</h2>
              <p className="text-gray-400 mb-8">Junte-se a centenas de makers e clientes que já usam a PrintHub3D.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register"><Button size="lg">Criar conta grátis</Button></Link>
                <Link to="/marketplace"><Button variant="secondary" size="lg">Explorar marketplace</Button></Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
