import { Link } from 'react-router-dom';
import { Printer, GitBranch, MessageCircle, Camera, Briefcase } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
                <Printer size={16} className="text-white" />
              </div>
              <span className="font-bold text-white text-xl">Print<span className="gradient-text">Hub3D</span></span>
            </Link>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              O marketplace mais completo de impressão 3D sob demanda do Brasil. Conectando makers e clientes.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {[GitBranch, MessageCircle, Camera, Briefcase].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 glass rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:border-neon-blue/30 transition-all duration-200">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Plataforma</h4>
            <ul className="space-y-2.5">
              {[['Marketplace', '/marketplace'], ['Makers', '/makers'], ['Solicitar Orçamento', '/quote/request'], ['Como Funciona', '#']].map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-gray-400 hover:text-white text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Suporte</h4>
            <ul className="space-y-2.5">
              {[['Central de Ajuda', '#'], ['Termos de Uso', '#'], ['Privacidade', '#'], ['Contato', '#']].map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-gray-400 hover:text-white text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="neon-divider mt-10 mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© 2024 PrintHub3D. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <span>Feito com</span>
            <span className="text-red-400">♥</span>
            <span>no Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
