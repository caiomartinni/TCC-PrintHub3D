import { useState, useEffect, useCallback } from 'react';
import { Search, Shield, RefreshCw, Check, X, Pause, Play, ChevronLeft, ChevronRight, Star, Package, ShoppingBag, ExternalLink, MessageSquare } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { adminService, type AdminMaker } from '@/services/admin.service';
import { formatDate } from '@/utils/format';

const STATUS_CFG: Record<string, { label: string; variant: 'green'|'yellow'|'red'|'gray'|'blue' }> = {
  ACTIVE:    { label: 'Ativo',    variant: 'green'  },
  PENDING:   { label: 'Pendente', variant: 'yellow' },
  SUSPENDED: { label: 'Suspenso',variant: 'red'    },
  REJECTED:  { label: 'Rejeitado',variant: 'gray'  },
};

export default function AdminMakers() {
  const { success, error } = useToast();
  const [makers,   setMakers]   = useState<AdminMaker[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [page,     setPage]     = useState(1);
  const [acting,        setActing]        = useState<string | null>(null);
  const [correctionTarget, setCorrectionTarget] = useState<string | null>(null);
  const [correctionNote,   setCorrectionNote]   = useState('');
  const [correctionFiles,  setCorrectionFiles]  = useState<string[]>([]);

  const LIMIT = 15;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminService.getMakers({ page, limit: LIMIT, status: status||undefined, search: search||undefined });
      setMakers(r.data); setTotal(r.pagination.total);
    } catch { error('Erro', 'Não foi possível carregar os makers.'); }
    finally { setLoading(false); }
  }, [page, search, status, error]);

  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 350); return () => clearTimeout(t); }, [search, status]); // eslint-disable-line
  useEffect(() => { load(); }, [page]); // eslint-disable-line

  const act = async (id: string, action: 'approve'|'reject'|'suspend'|'reactivate', name: string) => {
    setActing(id);
    try {
      await adminService.updateMakerStatus(id, action);
      const labels: Record<string, string> = { approve: 'aprovado', reject: 'rejeitado', suspend: 'suspenso', reactivate: 'reativado' };
      success(`Maker ${labels[action]}`, name);
      load();
    } catch { error('Erro', 'Não foi possível atualizar.'); }
    finally { setActing(null); }
  };

  const sendCorrection = async () => {
    if (!correctionTarget || !correctionNote.trim()) return;
    try {
      await adminService.requestKycCorrection(correctionTarget, correctionNote, correctionFiles);
      success('Solicitação enviada', 'O maker foi notificado.');
      setCorrectionTarget(null); setCorrectionNote(''); setCorrectionFiles([]);
      load();
    } catch { error('Erro', 'Não foi possível enviar a solicitação.'); }
  };

  const toggleFile = (f: string) =>
    setCorrectionFiles(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Gestão de Makers</h1>
          <p className="text-gray-400 mt-1">{total} maker{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={load} className="btn-ghost !p-2"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { s: '',          label: 'Todos',    color: 'text-white'        },
          { s: 'ACTIVE',    label: 'Ativos',   color: 'text-emerald-400'  },
          { s: 'PENDING',   label: 'Pendentes',color: 'text-yellow-400'   },
          { s: 'SUSPENDED', label: 'Suspensos',color: 'text-red-400'      },
        ].map(({ s, label, color }) => (
          <button key={label} onClick={() => { setStatus(s); setPage(1); }}
            className={`glass rounded-xl p-4 border transition-all text-left ${status === s ? 'border-neon-blue/40 bg-neon-blue/5' : 'border-white/5 hover:border-white/10'}`}>
            <div className={`text-xs font-medium ${color}`}>{label}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        <Input placeholder="Buscar por nome, empresa ou e-mail..." icon={<Search size={16} />}
          value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <select className="input w-auto" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativos</option>
          <option value="PENDING">Pendentes</option>
          <option value="SUSPENDED">Suspensos</option>
          <option value="REJECTED">Rejeitados</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="glass rounded-2xl p-12 border border-white/5 text-center text-gray-500">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />Carregando...
          </div>
        ) : makers.length === 0 ? (
          <div className="glass rounded-2xl p-12 border border-white/5 text-center text-gray-500">Nenhum maker encontrado</div>
        ) : makers.map(m => {
          const cfg = STATUS_CFG[m.status] ?? STATUS_CFG.PENDING;
          return (
            <div key={m.id} className="glass rounded-xl border border-white/5 p-4 hover:border-white/10 transition-all">
              <div className="flex items-start gap-4">
                <Avatar name={m.user.name} src={m.user.avatar} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-bold text-white">{m.companyName || m.user.name}</p>
                      <p className="text-xs text-gray-400">{m.user.name} · {m.user.email}</p>
                      {m.city && <p className="text-xs text-gray-500 mt-0.5">{m.city}, {m.state}</p>}
                    </div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '3px 10px', borderRadius: '9999px',
                      fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
                      background: cfg.variant === 'green' ? 'rgba(16,185,129,0.15)'
                        : cfg.variant === 'red' ? 'rgba(239,68,68,0.15)'
                        : cfg.variant === 'yellow' ? 'rgba(251,191,36,0.15)'
                        : 'rgba(255,255,255,0.08)',
                      color: cfg.variant === 'green' ? '#34d399'
                        : cfg.variant === 'red' ? '#f87171'
                        : cfg.variant === 'yellow' ? '#fbbf24'
                        : '#9ca3af',
                      border: `1px solid ${cfg.variant === 'green' ? 'rgba(52,211,153,0.3)'
                        : cfg.variant === 'red' ? 'rgba(248,113,113,0.3)'
                        : cfg.variant === 'yellow' ? 'rgba(251,191,36,0.3)'
                        : 'rgba(255,255,255,0.15)'}`,
                    }}>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Star size={10} className="text-yellow-400" />{m.rating.toFixed(1)} ({m.totalReviews} avaliações)</span>
                    <span className="flex items-center gap-1"><Package size={10} />{m._count?.products ?? 0} produtos</span>
                    <span className="flex items-center gap-1"><ShoppingBag size={10} />{m._count?.ordersAsMaker ?? 0} pedidos</span>
                    <span>
                      {m.kycStatus === 'APPROVED'
                        ? <span className="text-emerald-400 font-medium flex items-center gap-1"><Check size={13} strokeWidth={3} />Verificação Concluída</span>
                        : m.kycStatus === 'CORRECTION_NEEDED'
                        ? <span className="text-red-400 font-medium">Correção Solicitada</span>
                        : m.kycStatus === 'REJECTED'
                        ? <span className="text-red-400 font-medium">Verificação Recusada</span>
                        : <span className="text-yellow-400 font-medium">Verificação Pendente</span>
                      }
                    </span>
                    <span>Cadastro: {formatDate(m.createdAt)}</span>
                  </div>

                  {/* KYC docs */}
                  {(m.documentUrl || m.selfieUrl || m.documentBackUrl) && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {m.selfieUrl        && <a href={m.selfieUrl}        target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-neon-blue hover:underline"><ExternalLink size={10} />Selfie</a>}
                      {m.documentUrl      && <a href={m.documentUrl}      target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-neon-blue hover:underline"><ExternalLink size={10} />Doc. Frente</a>}
                      {m.documentBackUrl  && <a href={m.documentBackUrl}  target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-neon-blue hover:underline"><ExternalLink size={10} />Doc. Verso</a>}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  {/* PENDING: Solicitar Correção + Aprovar + Reprovar */}
                  {m.status === 'PENDING' && <>
                    <button onClick={() => { setCorrectionTarget(m.id); setCorrectionNote(''); setCorrectionFiles([]); }}
                      className="flex items-center gap-1 text-xs text-neon-blue border border-neon-blue/30 px-2.5 py-1.5 rounded-lg hover:bg-neon-blue/10">
                      <MessageSquare size={11}/>Solicitar correção
                    </button>
                    <button disabled={acting===m.id} onClick={() => act(m.id,'approve',m.user.name)}
                      className="flex items-center gap-1 text-xs text-emerald-400 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 disabled:opacity-40">
                      <Check size={11}/>Aprovar
                    </button>
                    <button disabled={acting===m.id} onClick={() => act(m.id,'reject',m.user.name)}
                      className="flex items-center gap-1 text-xs text-red-400 border border-red-500/30 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 disabled:opacity-40">
                      <X size={11}/>Reprovar
                    </button>
                  </>}

                  {/* ACTIVE: apenas Suspender */}
                  {m.status === 'ACTIVE' && (
                    <button disabled={acting===m.id} onClick={() => act(m.id,'suspend',m.user.name)}
                      className="flex items-center gap-1 text-xs text-yellow-400 border border-yellow-400/30 px-2.5 py-1.5 rounded-lg hover:bg-yellow-400/10 disabled:opacity-40">
                      <Pause size={11}/>Suspender
                    </button>
                  )}

                  {/* SUSPENDED / REJECTED: Reativar */}
                  {(m.status === 'SUSPENDED' || m.status === 'REJECTED') && (
                    <button disabled={acting===m.id} onClick={() => act(m.id,'reactivate',m.user.name)}
                      className="flex items-center gap-1 text-xs text-emerald-400 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/10 disabled:opacity-40">
                      <Play size={11}/>Reativar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-gray-500">Página {page} de {totalPages} · {total} makers</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-ghost !p-2 disabled:opacity-40"><ChevronLeft size={16}/></button>
            <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="btn-ghost !p-2 disabled:opacity-40"><ChevronRight size={16}/></button>
          </div>
        </div>
      )}
      {/* Correction request modal */}
      {correctionTarget && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setCorrectionTarget(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: '#131313', border: '1px solid rgba(0,212,255,0.2)' }}>
              <div className="flex items-center gap-3">
                <MessageSquare size={20} className="text-neon-blue" />
                <div>
                  <h3 className="font-bold text-white">Solicitar Correção</h3>
                  <p className="text-xs text-gray-500 mt-0.5">O maker verá esta mensagem e apenas os uploads necessários</p>
                </div>
              </div>

              {/* File checkboxes */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-400 mb-2">Selecione os arquivos que precisam ser reenviados:</p>
                {[
                  { key: 'selfie',   label: 'Selfie com Documento' },
                  { key: 'docFront', label: 'Documento — Frente (RG/CNH)' },
                  { key: 'docBack',  label: 'Documento — Verso (RG/CNH)' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                    style={{ background: correctionFiles.includes(key) ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.03)',
                             border: `1px solid ${correctionFiles.includes(key) ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                    <input type="checkbox" checked={correctionFiles.includes(key)} onChange={() => toggleFile(key)}
                      className="w-4 h-4 accent-cyan-400 cursor-pointer" />
                    <span className="text-sm text-white">{label}</span>
                  </label>
                ))}
                {correctionFiles.length === 0 && (
                  <p className="text-xs text-yellow-500/70 mt-1 pl-1">Nenhum arquivo selecionado — o maker verá todos os campos de upload</p>
                )}
              </div>

              <textarea rows={4} value={correctionNote} onChange={e => setCorrectionNote(e.target.value)}
                placeholder="Ex: O documento enviado está ilegível. Por favor, envie uma foto mais nítida do RG ou CNH."
                className="input resize-none w-full text-sm" />
              <div className="flex gap-3">
                <button onClick={() => { setCorrectionTarget(null); setCorrectionFiles([]); }} className="flex-1 btn-secondary">Cancelar</button>
                <button onClick={sendCorrection} disabled={!correctionNote.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neon-blue/15 border border-neon-blue/30 text-neon-blue font-semibold text-sm hover:bg-neon-blue/25 disabled:opacity-40">
                  <MessageSquare size={14}/> Enviar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
