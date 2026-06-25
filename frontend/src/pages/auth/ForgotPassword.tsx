import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle, Wrench } from 'lucide-react';
import api from '@/services/api';

export default function ForgotPassword() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState('');
  const [preview,   setPreview]   = useState<string | null>(null); // link Ethereal (dev)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Informe seu e-mail.'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setPreview((data as { data?: { previewUrl?: string } }).data?.previewUrl ?? null);
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-blue/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="PrintHub3D" className="w-14 h-14 rounded-2xl object-contain bg-white p-1.5 mb-4" />
          <h1 className="text-3xl font-black text-white">
            Print<span className="gradient-text">Hub3D</span>
          </h1>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/10">

          {sent ? (
            /* ── Sucesso ── */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">E-mail enviado!</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Se o endereço <strong className="text-white">{email}</strong> estiver cadastrado,
                você receberá um link para redefinir sua senha em instantes.
                Verifique também a caixa de spam.
              </p>
              <p className="text-xs text-gray-600">O link expira em 1 hora.</p>

              {/* Preview Ethereal (apenas em dev sem SMTP configurado) */}
              {preview && (
                <div className="mt-4 p-3 rounded-xl text-xs text-left"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
                  <p className="text-yellow-400 font-semibold mb-1 flex items-center gap-1.5"><Wrench size={13} />Modo desenvolvimento (SMTP não configurado)</p>
                  <p className="text-gray-400 mb-1">Visualize o e-mail de teste clicando no link abaixo:</p>
                  <a href={preview} target="_blank" rel="noreferrer"
                    className="text-neon-blue hover:underline break-all">{preview}</a>
                </div>
              )}

              <Link to="/login"
                className="inline-flex items-center gap-2 mt-2 text-sm text-neon-blue hover:underline">
                <ArrowLeft size={14} /> Voltar ao login
              </Link>
            </div>
          ) : (
            /* ── Formulário ── */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Esqueceu a senha?</h2>
                <p className="text-gray-400 text-sm">
                  Digite seu e-mail e enviaremos um link para você criar uma nova senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">E-mail cadastrado</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="seu@email.com"
                      className="input pl-10"
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl px-4 py-3 text-sm text-red-400"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
                    : <><Send size={16} /> Enviar link de redefinição</>
                  }
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
                  <ArrowLeft size={14} /> Voltar ao login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
