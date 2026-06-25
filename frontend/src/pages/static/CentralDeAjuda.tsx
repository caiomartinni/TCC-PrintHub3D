import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, ArrowLeft, Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const FAQS = [
  {
    category: 'Geral',
    questions: [
      {
        q: 'O que é a PrintHub3D?',
        a: 'A PrintHub3D é um marketplace que conecta clientes que precisam de peças ou produtos impressos em 3D a makers (fabricantes) verificados em todo o Brasil. Você pode comprar produtos prontos, solicitar orçamentos personalizados e acompanhar seus pedidos em tempo real.',
      },
      {
        q: 'Como funciona o processo de compra?',
        a: 'É simples: navegue pelo marketplace, escolha um produto ou solicite um orçamento descrevendo sua peça. Os makers enviarão propostas, você analisa e aceita a melhor, realiza o pagamento e acompanha a produção até a entrega.',
      },
      {
        q: 'A plataforma é gratuita para clientes?',
        a: 'Sim! O cadastro e o uso da plataforma são completamente gratuitos para clientes. Você só paga pelo produto ou serviço que contratar.',
      },
    ],
  },
  {
    category: 'Orçamentos',
    questions: [
      {
        q: 'Como faço para solicitar um orçamento?',
        a: 'Acesse a seção "Orçamento" no menu, preencha o formulário descrevendo sua peça (dimensões, material, quantidade, prazo desejado), e os makers próximos à sua localização serão notificados automaticamente.',
      },
      {
        q: 'Quanto tempo leva para receber propostas?',
        a: 'Os makers têm até 7 dias para enviar propostas. Na prática, a maioria responde em poucas horas. Você receberá uma notificação assim que uma proposta for enviada.',
      },
      {
        q: 'Posso solicitar orçamento sem um arquivo STL?',
        a: 'Sim! Você pode descrever sua peça em texto, enviar imagens de referência e especificar as dimensões. O arquivo STL é opcional — o maker pode criar o modelo 3D por você.',
      },
      {
        q: 'Posso recusar uma proposta?',
        a: 'Sim. Você não é obrigado a aceitar nenhuma proposta. Você pode aguardar outras propostas, negociar diretamente no chat com o maker ou simplesmente não aceitar.',
      },
    ],
  },
  {
    category: 'Pagamentos',
    questions: [
      {
        q: 'Quais formas de pagamento são aceitas?',
        a: 'Aceitamos cartão de crédito (Visa, Mastercard, Amex, Elo), cartão de débito, Pix, boleto bancário e pagamento pela conta Mercado Pago.',
      },
      {
        q: 'Meu pagamento é seguro?',
        a: 'Sim. Os pagamentos são processados pela plataforma Mercado Pago, líder em pagamentos online na América Latina. Seus dados financeiros nunca são armazenados na PrintHub3D.',
      },
      {
        q: 'Quando o maker recebe o pagamento?',
        a: 'O maker recebe 95% do valor após a confirmação da entrega. A PrintHub3D retém 5% como comissão pela plataforma. Isso garante segurança para ambas as partes.',
      },
      {
        q: 'Como funciona o reembolso?',
        a: 'Em caso de problemas com o pedido, entre em contato com o maker pelo chat. Se não houver resolução, abra uma disputa pela plataforma. A PrintHub3D atuará como mediadora para encontrar a melhor solução.',
      },
    ],
  },
  {
    category: 'Makers',
    questions: [
      {
        q: 'Como me tornar um maker na PrintHub3D?',
        a: 'Crie uma conta, selecione "Sou Maker" no cadastro, preencha as informações do seu perfil (impressoras, materiais, localização) e envie os documentos para verificação de identidade. Após aprovação, seu perfil ficará ativo.',
      },
      {
        q: 'Preciso de CNPJ para ser maker?',
        a: 'Não. Você pode se cadastrar como Pessoa Física (CPF) ou Pessoa Jurídica (CNPJ). O importante é ter uma impressora 3D e capacidade de atender pedidos.',
      },
      {
        q: 'Quanto custa ser maker?',
        a: 'O cadastro é gratuito. A PrintHub3D cobra apenas 5% de comissão sobre as vendas realizadas pela plataforma. Não há mensalidade ou taxa fixa.',
      },
      {
        q: 'O que é verificação de identidade (KYC)?',
        a: 'É um processo para confirmar que você é quem diz ser. É necessário enviar uma selfie segurando o documento e uma foto do documento de identidade (RG, CNH ou Passaporte). Isso garante confiança e segurança para os clientes.',
      },
    ],
  },
  {
    category: 'Entrega e Pedidos',
    questions: [
      {
        q: 'Como funciona o rastreamento do pedido?',
        a: 'Após a confirmação do pedido, você pode acompanhar cada etapa: confirmado → em impressão → controle de qualidade → enviado → entregue. Você recebe notificações a cada atualização.',
      },
      {
        q: 'O frete é incluso no orçamento?',
        a: 'Cada maker define seu próprio valor de frete. No orçamento você verá separado o valor das peças e o valor do frete, podendo calcular o total antes de aceitar.',
      },
      {
        q: 'Posso conversar com o maker durante o processo?',
        a: 'Sim! Cada pedido tem um chat exclusivo entre você e o maker. Você pode tirar dúvidas, pedir atualizações e compartilhar informações adicionais a qualquer momento.',
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden transition-all"
      style={{ background: open ? '#141414' : '#0f0f0f' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-3">
        <span className={`text-sm font-semibold ${open ? 'text-white' : 'text-gray-300'}`}>{q}</span>
        {open ? <ChevronUp size={16} className="text-neon-blue shrink-0" /> : <ChevronDown size={16} className="text-gray-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function CentralDeAjuda() {
  const [search, setSearch] = useState('');

  const filtered = search
    ? FAQS.map(cat => ({
        ...cat,
        questions: cat.questions.filter(
          q => q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(cat => cat.questions.length > 0)
    : FAQS;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center mx-auto mb-6">
            <HelpCircle size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Central de Ajuda</h1>
          <p className="text-gray-400 mb-8">Encontre respostas para as perguntas mais frequentes sobre a PrintHub3D.</p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar perguntas..."
              className="input pl-11 w-full"
            />
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p>Nenhuma pergunta encontrada para "<span className="text-white">{search}</span>"</p>
            </div>
          ) : (
            <div className="space-y-10">
              {filtered.map(cat => (
                <div key={cat.category}>
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-gradient-to-b from-neon-blue to-neon-purple" />
                    {cat.category}
                  </h2>
                  <div className="space-y-2">
                    {cat.questions.map(q => <FaqItem key={q.q} {...q} />)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 glass rounded-2xl p-8 border border-white/5 text-center">
            <h3 className="font-bold text-white mb-2">Não encontrou o que procurava?</h3>
            <p className="text-gray-400 text-sm mb-4">Nossa equipe está pronta para te ajudar.</p>
            <Link to="/contato"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #9333ea)' }}>
              Falar com a equipe →
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
