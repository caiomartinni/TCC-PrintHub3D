import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, CheckCircle, ArrowLeft, Clock, Lightbulb } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function Contato() {
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent]       = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    // TODO: integrar com backend para envio real de e-mail
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-10 text-sm">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left — Info */}
          <div>
            <h1 className="text-4xl font-black text-white mb-3">Entre em Contato</h1>
            <p className="text-gray-400 leading-relaxed mb-10">
              Tem alguma dúvida, sugestão ou precisa de suporte? Nossa equipe está pronta para te ajudar.
            </p>

            <div className="space-y-5">
              {/* Business info */}
              <div className="glass rounded-2xl p-6 border border-white/8 space-y-5">
                <h2 className="font-bold text-white text-lg">PrintHub3D</h2>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-neon-blue/10 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-neon-blue" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Endereço</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      Avenida Irmãos Pereira, 670<br />
                      Centro, Campo Mourão - PR<br />
                      CEP 87301-010
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neon-purple/10 rounded-xl flex items-center justify-center shrink-0">
                    <Phone size={18} className="text-neon-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Telefone / WhatsApp</p>
                    <a href="tel:+5541988808330" className="text-sm text-gray-400 hover:text-neon-purple transition-colors mt-0.5 block">
                      (41) 98880-8330
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-400/10 rounded-xl flex items-center justify-center shrink-0">
                    <Mail size={18} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">E-mail</p>
                    <a href="mailto:printhub3d@gmail.com" className="text-sm text-gray-400 hover:text-emerald-400 transition-colors mt-0.5 block">
                      printhub3d@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Horário de Atendimento</p>
                    <p className="text-sm text-gray-400 mt-0.5">Segunda a Sexta: 8h às 18h</p>
                    <p className="text-sm text-gray-400">Sábado: 8h às 12h</p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-xl p-4 border border-white/5">
                <p className="text-xs text-gray-500 flex items-start gap-1.5">
                  <Lightbulb size={14} className="shrink-0 mt-0.5" />
                  <span>
                    Para dúvidas rápidas, confira nossa{' '}
                    <Link to="/ajuda" className="text-neon-blue hover:underline">Central de Ajuda</Link>
                    {' '}com perguntas frequentes.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="px-6 py-5" style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Send size={16} className="text-neon-blue" /> Envie uma mensagem
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Respondemos em até 24 horas úteis</p>
              </div>

              {sent ? (
                <div className="p-10 flex flex-col items-center justify-center text-center gap-4">
                  <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center">
                    <CheckCircle size={32} className="text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Mensagem enviada!</h3>
                  <p className="text-gray-400 text-sm">
                    Obrigado por entrar em contato. Nossa equipe responderá em até 24 horas úteis no e-mail <strong className="text-white">{form.email}</strong>.
                  </p>
                  <button onClick={() => { setSent(false); setForm({ name:'', email:'', subject:'', message:'' }); }}
                    className="text-sm text-neon-blue hover:underline mt-2">
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Nome completo *" placeholder="Seu nome"
                      value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    <Input label="E-mail *" type="email" placeholder="seu@email.com"
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Assunto</label>
                    <select className="input w-full"
                      value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                      <option value="">Selecione um assunto...</option>
                      <option>Dúvida sobre pedido</option>
                      <option>Problema com pagamento</option>
                      <option>Quero ser maker</option>
                      <option>Sugestão</option>
                      <option>Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Mensagem *</label>
                    <textarea rows={6} placeholder="Descreva sua dúvida ou mensagem em detalhes..."
                      className="input resize-none w-full"
                      value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                  </div>
                  <Button type="submit" className="w-full" loading={sending}
                    disabled={!form.name || !form.email || !form.message}>
                    <Send size={15} /> Enviar mensagem
                  </Button>
                  <p className="text-xs text-gray-600 text-center">
                    Ao enviar, você concorda com nossa{' '}
                    <Link to="/privacidade" className="text-gray-400 hover:underline">Política de Privacidade</Link>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
