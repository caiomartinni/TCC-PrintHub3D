import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
            <FileText size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Termos de Uso</h1>
            <p className="text-gray-500 text-sm mt-0.5">Última atualização: janeiro de 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-gray-400 leading-relaxed">
          {[
            {
              title: '1. Aceitação dos Termos',
              content: 'Ao acessar e utilizar a plataforma PrintHub3D, você concorda com os presentes Termos de Uso. Caso não concorde com qualquer disposição aqui prevista, pedimos que não utilize nossos serviços. Estes termos regulam a relação entre a PrintHub3D e todos os usuários da plataforma, sejam eles clientes ou makers.',
            },
            {
              title: '2. Descrição do Serviço',
              content: 'A PrintHub3D é um marketplace que conecta clientes que necessitam de peças ou produtos impressos em 3D a makers (fabricantes) verificados. A plataforma permite solicitar orçamentos, comparar propostas, realizar pagamentos e acompanhar pedidos de forma segura.',
            },
            {
              title: '3. Cadastro e Conta',
              content: 'Para utilizar a plataforma, é necessário criar uma conta com informações verdadeiras e atualizadas. Você é responsável pela segurança de sua senha e por todas as atividades realizadas em sua conta. A PrintHub3D não se responsabiliza por acessos não autorizados decorrentes de negligência do usuário.',
            },
            {
              title: '4. Makers e Verificação',
              content: 'Makers são profissionais ou empresas que oferecem serviços de impressão 3D na plataforma. Para se tornar um maker ativo, é necessário passar pelo processo de verificação de identidade (KYC) e ter o perfil aprovado pela equipe da PrintHub3D. A PrintHub3D reserva-se o direito de suspender ou remover makers que violem estas políticas.',
            },
            {
              title: '5. Transações e Pagamentos',
              content: 'Os pagamentos são processados de forma segura por meio da plataforma Mercado Pago. A PrintHub3D retém uma comissão de 5% sobre cada transação realizada. O valor restante (95%) é repassado ao maker após a confirmação da entrega. Em caso de disputas ou reembolsos, a PrintHub3D atuará como mediadora.',
            },
            {
              title: '6. Responsabilidades do Usuário',
              content: 'Os usuários comprometem-se a utilizar a plataforma de forma ética e legal, não realizar pedidos fraudulentos, fornecer informações corretas sobre os produtos ou serviços solicitados, e respeitar as políticas de privacidade e segurança da plataforma.',
            },
            {
              title: '7. Propriedade Intelectual',
              content: 'Todo o conteúdo da plataforma — incluindo logotipo, layout, textos e funcionalidades — é protegido por direitos autorais e pertence à PrintHub3D. É vedada a reprodução ou uso comercial sem autorização prévia.',
            },
            {
              title: '8. Limitação de Responsabilidade',
              content: 'A PrintHub3D não se responsabiliza pela qualidade técnica dos produtos impressos, atrasos na entrega causados por terceiros, ou perdas indiretas decorrentes do uso da plataforma. A responsabilidade da PrintHub3D limita-se ao valor das transações realizadas.',
            },
            {
              title: '9. Alterações nos Termos',
              content: 'A PrintHub3D reserva-se o direito de atualizar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas por e-mail ou notificação na plataforma. O uso continuado da plataforma após as alterações implica aceitação dos novos termos.',
            },
            {
              title: '10. Foro e Legislação',
              content: 'Estes Termos são regidos pelas leis brasileiras. Quaisquer disputas serão submetidas ao foro da comarca de Campo Mourão - PR, salvo exceções previstas em lei.',
            },
          ].map(({ title, content }) => (
            <div key={title} className="glass rounded-2xl p-6 border border-white/5">
              <h2 className="text-lg font-bold text-white mb-3">{title}</h2>
              <p>{content}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 glass rounded-2xl p-6 border border-neon-blue/20 text-center">
          <p className="text-gray-400 text-sm">Dúvidas sobre nossos termos?</p>
          <Link to="/contato" className="text-neon-blue hover:underline text-sm font-medium mt-1 inline-block">
            Entre em contato conosco →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
