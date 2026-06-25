import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, Check, X } from 'lucide-react';
import { Printer } from 'lucide-react';
import api from '@/services/api';
import { PWD_RULES } from './Register';

export default function ResetPassword() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get('token') ?? '';

  const [userInfo,  setUserInfo]  = useState<{ name: string; email: string } | null>(null);
  const [tokenErr,  setTokenErr]  = useState('');
  const [loadingToken, setLoadingToken] = useState(true);

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);

  useEffect(() => {
    if (!token) { setTokenErr('Link inválido. Solicite um novo.'); setLoadingToken(false); return; }
    api.get(`/auth/reset-password/${token}`)
      .then(r => setUserInfo((r.data as { data: { name: string; email: string } }).data))
      .catch(err => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setTokenErr(msg || 'Link inválido ou expirado.');
      })
      .finally(() => setLoadingToken(false));
  }, [token]);

  const passed    = PWD_RULES.filter(r => r.test(password)).length;
  const pwdColors = ['#ef4444','#f97316','#eab308','#84cc16','#22c55e'];
  const pwdColor  = pwdColors[passed - 1] ?? '#374151';
  const pwdLabels = ['','Muito fraca','Fraca','Razoável','Boa','Forte'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (passed < 5) { setError('A senha não atende a todos os requisitos.'); return; }
    if (password !== confirm) { setError('As senhas não conferem.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neon-purple/8 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple items-center justify-center mb-4 shadow-[0_0_32px_rgba(147,51,234,0.3)]">
            <Printer size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">
            Print<span className="gradient-text">Hub3D</span>
          </h1>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/10">

          {/* Carregando token */}
          {loadingToken && (
            <div className="text-center py-8 space-y-3">
              <span className="w-8 h-8 border-2 border-neon-blue border-t-transparent rounded-full animate-spin inline-block" />
              <p className="text-gray-400 text-sm">Validando link...</p>
            </div>
          )}

          {/* Token inválido/expirado */}
          {!loadingToken && tokenErr && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto">
                <AlertTriangle size={28} className="text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Link inválido</h2>
              <p className="text-gray-400 text-sm">{tokenErr}</p>
              <Link to="/forgot-password"
                className="inline-block mt-2 text-sm text-neon-blue hover:underline">
                Solicitar novo link →
              </Link>
            </div>
          )}

          {/* Sucesso */}
          {success && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Senha redefinida!</h2>
              <p className="text-gray-400 text-sm">
                Sua senha foi alterada com sucesso.<br />
                Redirecionando para o login...
              </p>
              <Link to="/login" className="inline-block text-sm text-neon-blue hover:underline">
                Ir para o login agora →
              </Link>
            </div>
          )}

          {/* Formulário */}
          {!loadingToken && !tokenErr && !success && userInfo && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">Criar nova senha</h2>
                <p className="text-gray-400 text-sm">Escolha uma senha forte para sua conta.</p>
              </div>

              {/* Info da conta */}
              <div className="rounded-xl p-4 mb-5 flex items-center gap-3"
                style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shrink-0 text-white font-bold text-sm">
                  {userInfo.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{userInfo.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{userInfo.email}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nova senha */}
                <div>
                  <label className="label">Nova senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="Mínimo 8 caracteres"
                      className="input pl-10 pr-10"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                      {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>

                  {/* Indicador de força */}
                  {password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1 h-1.5">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="flex-1 rounded-full transition-all duration-300"
                            style={{ background: i <= passed ? pwdColor : '#1f2937' }} />
                        ))}
                      </div>
                      <span className="text-xs font-medium" style={{ color: pwdColor }}>{pwdLabels[passed]}</span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {PWD_RULES.map(r => {
                          const ok = r.test(password);
                          return (
                            <span key={r.key} className="flex items-center gap-1 text-xs transition-colors"
                              style={{ color: ok ? '#22c55e' : '#6b7280' }}>
                              {ok ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                              {r.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmar senha */}
                <div>
                  <label className="label">Confirmar nova senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setError(''); }}
                      placeholder="Repita a senha"
                      className={`input pl-10 ${confirm && confirm !== password ? 'border-red-500/50' : confirm && confirm === password ? 'border-emerald-500/50' : ''}`}
                    />
                    {confirm && confirm === password && (
                      <CheckCircle size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
                    )}
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-400 mt-1">As senhas não conferem</p>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl px-4 py-3 text-sm text-red-400"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || passed < 5 || password !== confirm}
                  className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvando...</>
                    : <><CheckCircle size={16} /> Salvar nova senha</>
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
