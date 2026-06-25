import { Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center">
            <Lock size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Política de Privacidade</h1>
            <p className="text-gray-500 text-sm mt-0.5">Última atualização: janeiro de 2026</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-neon-purple/20 mb-8">
          <p className="text-gray-300 text-sm leading-relaxed">
            A PrintHub3D valoriza a privacidade dos seus usuários e está comprometida com a proteção dos seus dados pessoais,
            em conformidade com a <strong className="text-white">Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
          </p>
        </div>

        <div className="space-y-6 text-gray-400 leading-relaxed">
          {[
            {
              title: '1. Dados que Coletamos',
              items: [
                'Informações de cadastro: nome, e-mail, CPF/CNPJ, telefone',
                'Endereço para entrega e faturamento',
                'Documentos de verificação de identidade (makers)',
                'Histórico de pedidos e transações',
                'Dados de navegação e uso da plataforma',
                'Localização aproximada (para encontrar makers próximos)',
              ],
            },
            {
              title: '2. Como Utilizamos seus Dados',
              items: [
                'Criar e gerenciar sua conta na plataforma',
                'Processar pedidos e pagamentos com segurança',
                'Verificar a identidade dos makers (KYC)',
                'Enviar notificações sobre pedidos e propostas',
                'Melhorar a experiência da plataforma',
                'Cumprir obrigações legais e regulatórias',
              ],
            },
            {
              title: '3. Compartilhamento de Dados',
              items: [
                'Makers: nome e cidade para exibição no perfil público',
                'Mercado Pago: dados necessários para processamento de pagamentos',
                'Autoridades: quando exigido por lei ou ordem judicial',
                'Não vendemos dados pessoais a terceiros para fins comerciais',
              ],
            },
            {
              title: '4. Segurança dos Dados',
              items: [
                'Transmissão de dados criptografada (HTTPS)',
                'Senhas armazenadas com hash seguro (bcrypt)',
                'Acesso restrito a dados pessoais por nossa equipe',
                'Monitoramento contínuo para detectar acessos não autorizados',
              ],
            },
            {
              title: '5. Seus Direitos (LGPD)',
              items: [
                'Acesso: solicitar cópia dos seus dados pessoais',
                'Correção: atualizar dados incorretos ou desatualizados',
                'Exclusão: solicitar a remoção dos seus dados',
                'Portabilidade: receber seus dados em formato legível',
                'Revogação: retirar o consentimento para uso dos dados',
              ],
            },
          ].map(({ title, items }) => (
            <div key={title} className="glass rounded-2xl p-6 border border-white/5">
              <h2 className="text-lg font-bold text-white mb-4">{title}</h2>
              <ul className="space-y-2">
                {items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-neon-purple mt-1 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-3">6. Cookies</h2>
            <p>Utilizamos cookies essenciais para o funcionamento da plataforma (autenticação e sessão). Não utilizamos cookies de rastreamento para fins publicitários.</p>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-3">7. Retenção de Dados</h2>
            <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após exclusão da conta, dados pessoais são removidos em até 30 dias. Dados de transações podem ser mantidos por até 5 anos para fins fiscais.</p>
          </div>
        </div>

        <div className="mt-10 glass rounded-2xl p-6 border border-neon-purple/20 text-center">
          <p className="text-gray-400 text-sm">Para exercer seus direitos ou esclarecer dúvidas sobre privacidade:</p>
          <Link to="/contato" className="text-neon-purple hover:underline text-sm font-medium mt-1 inline-block">
            printhub3d@gmail.com →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
