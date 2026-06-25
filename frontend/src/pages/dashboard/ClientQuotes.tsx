import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Clock, Package, DollarSign, Star, MapPin,
  ChevronDown, ChevronUp, Check, RefreshCw, Plus, Award, ShoppingBag,
  Upload, Paperclip, Image,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { quotesService } from '@/services/quotes.service';
import api from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/format';
import type { QuoteRequest, QuoteResponse, MakerProfile } from '@/types';

interface MakerUser { name: string; avatar?: string }
interface MakerWithUser extends MakerProfile { user?: MakerUser }
interface ResponseWithMaker extends QuoteResponse { maker?: MakerWithUser }
interface QuoteWithResponses extends QuoteRequest {
  responses: ResponseWithMaker[];
  _count?: { responses: number };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'blue'|'yellow'|'green'|'red'|'gray'|'purple' }> = {
    OPEN:     { label: 'Aguardando propostas', variant: 'blue'   },
    PENDING:  { label: 'Propostas recebidas',  variant: 'yellow' },
    ACCEPTED: { label: 'Proposta aceita',       variant: 'green'  },
    REJECTED: { label: 'Encerrada',             variant: 'gray'   },
    EXPIRED:  { label: 'Expirada',              variant: 'gray'   },
  };
  const s = map[status] ?? { label: status, variant: 'gray' as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function ProposalStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'yellow'|'green'|'red'|'gray' }> = {
    PENDING:  { label: 'Aguardando sua resposta', variant: 'yellow' },
    ACCEPTED: { label: 'Aceita por você',          variant: 'green'  },
    REJECTED: { label: 'Recusada',                 variant: 'red'    },
  };
  const s = map[status] ?? { label: status, variant: 'gray' as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function AcceptModal({
  response, quoteTitle, onClose, onAccepted,
}: {
  response: ResponseWithMaker;
  quoteTitle: string;
  onClose: () => void;
  onAccepted: (orderId: string) => void;
}) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const makerName = response.maker?.user?.name ?? response.maker?.companyName ?? 'Maker';

  const handleAccept = async () => {
    setLoading(true);
    try {
      const result = await quotesService.acceptResponse(response.id) as { response: unknown; orderId: string };
      success('Pedido criado!', `Proposta de ${makerName} aceita. Seu pedido foi gerado.`);
      onAccepted(result?.orderId ?? '');
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Erro ao aceitar proposta.';
      error('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="glass-dark rounded-2xl border border-neon-blue/20 w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neon-blue/20 rounded-xl flex items-center justify-center">
              <Check size={20} className="text-neon-blue" />
            </div>
            <div>
              <h3 className="font-bold text-white">Aceitar proposta?</h3>
              <p className="text-xs text-gray-400 mt-0.5">{quoteTitle}</p>
            </div>
          </div>

          <div className="glass rounded-xl p-4 border border-white/5 space-y-2">
            <div className="flex items-center gap-3">
              <Avatar name={makerName} src={response.maker?.user?.avatar} size="sm" />
              <div>
                <p className="text-sm font-semibold text-white">{makerName}</p>
                {response.maker?.city && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={10} />{response.maker.city}
                  </p>
                )}
              </div>
              {response.maker?.rating > 0 && (
                <div className="ml-auto flex items-center gap-1 text-xs text-yellow-400">
                  <Star size={11} className="fill-yellow-400" />
                  {response.maker.rating.toFixed(1)}
                </div>
              )}
            </div>
            <div className="flex justify-between text-sm pt-1 border-t border-white/5">
              <span className="text-gray-400">Valor total</span>
              <span className="font-bold text-white">
                {formatCurrency(response.price + (response.shippingPrice ?? 0))}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Peças: {formatCurrency(response.price)}</span>
              <span>Frete: {formatCurrency(response.shippingPrice ?? 0)}</span>
              <span>Prazo: {response.deadline} dias</span>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            As demais propostas serão automaticamente recusadas e o maker será notificado.
          </p>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" loading={loading} onClick={handleAccept}>
              <Check size={15} /> Confirmar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function QuoteCard({
  quote, onAccept, onFilesUpdated,
}: {
  quote: QuoteWithResponses;
  onAccept: (response: ResponseWithMaker, quoteTitle: string) => void;
  onFilesUpdated: () => void;
}) {
  const { success, error } = useToast();
  const [showResponses, setShowResponses] = useState(false);
  const [showUpload, setShowUpload]       = useState(false);
  const [stlFile,    setStlFile]          = useState<File | null>(null);
  const [imageFile,  setImageFile]        = useState<File | null>(null);
  const [uploading,  setUploading]        = useState(false);

  const pendingResponses = quote.responses.filter(r => r.status === 'PENDING');
  const hasNewProposals  = pendingResponses.length > 0 && quote.status !== 'ACCEPTED';

  const handleUploadFiles = async () => {
    if (!stlFile && !imageFile) return;
    setUploading(true);
    try {
      const uploadFile = async (file: File, endpoint: string) => {
        const form = new FormData();
        form.append('file', file);
        const { data: r } = await api.post(`/uploads/${endpoint}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return (r as { data: { url: string } }).data.url;
      };

      const payload: { fileUrl?: string; imageUrl?: string } = {};
      if (stlFile)   payload.fileUrl  = await uploadFile(stlFile,   'stl');
      if (imageFile) payload.imageUrl = await uploadFile(imageFile, 'image');

      await quotesService.updateFiles(quote.id, payload);
      success('Arquivos enviados!', 'Os makers poderão visualizar seus arquivos.');
      setStlFile(null); setImageFile(null); setShowUpload(false);
      onFilesUpdated();
    } catch {
      error('Erro', 'Não foi possível enviar os arquivos. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`glass rounded-2xl border transition-all duration-200 overflow-hidden ${
      hasNewProposals ? 'border-neon-blue/30 shadow-neon-blue' : 'border-white/5 hover:border-white/10'
    }`}>
      {/* Quote header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-white">{quote.title}</h3>
              {hasNewProposals && (
                <span className="text-xs bg-neon-blue text-[#0a0a0a] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {pendingResponses.length} nova{pendingResponses.length > 1 ? 's' : ''}!
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 line-clamp-2">{quote.description}</p>
          </div>
          <StatusBadge status={quote.status} />
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
          {quote.quantity && <span className="flex items-center gap-1"><Package size={11} />Qtd: {quote.quantity}</span>}
          {quote.material && <Badge variant="purple" className="text-xs">{quote.material}</Badge>}
          {quote.budget   && <span className="flex items-center gap-1"><DollarSign size={11} />Limite: {formatCurrency(quote.budget)}</span>}
          {quote.city     && <span className="flex items-center gap-1"><MapPin size={11} />{quote.city}{quote.state ? ` - ${quote.state}` : ''}</span>}
          <span className="flex items-center gap-1"><Clock size={11} />{formatDate(quote.createdAt)}</span>
          <span className="text-gray-500">{quote.responses.length} proposta{quote.responses.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Files section — only for OPEN quotes */}
      {quote.status === 'OPEN' && (
        <div className="px-5 pb-4 border-t border-white/5 pt-3">
          {/* Current files */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {quote.fileUrl  && <a href={quote.fileUrl}  target="_blank" rel="noreferrer" className="flex items-center gap-1 text-neon-blue hover:underline"><Paperclip size={11}/>Arquivo STL</a>}
            {quote.imageUrl && <a href={quote.imageUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-neon-blue hover:underline"><Image size={11}/>Imagem de referência</a>}
            {!quote.fileUrl && !quote.imageUrl && <span className="text-gray-600 italic">Nenhum arquivo anexado</span>}
            <button onClick={() => setShowUpload(!showUpload)}
              className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-neon-blue transition-colors px-2 py-1 rounded-lg hover:bg-neon-blue/10">
              <Upload size={11}/>{showUpload ? 'Cancelar' : quote.fileUrl || quote.imageUrl ? 'Atualizar arquivos' : 'Adicionar arquivos'}
            </button>
          </div>

          {/* Upload panel */}
          {showUpload && (
            <div className="mt-3 space-y-2 p-3 rounded-xl" style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Arquivo STL/OBJ', accept: '.stl,.obj,.3mf', file: stlFile, onChange: (f: File|null) => setStlFile(f), icon: <Paperclip size={12}/> },
                  { label: 'Imagem de referência', accept: 'image/*', file: imageFile, onChange: (f: File|null) => setImageFile(f), icon: <Image size={12}/> },
                ].map(({ label, accept, file, onChange, icon }) => (
                  <label key={label} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all"
                    style={{ background: file ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${file ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                    <input type="file" accept={accept} className="sr-only"
                      onChange={e => onChange(e.target.files?.[0] ?? null)} />
                    {icon}
                    <span className="text-xs text-gray-400 truncate flex-1">{file ? file.name : label}</span>
                    {file && <Check size={10} className="text-neon-blue shrink-0"/>}
                  </label>
                ))}
              </div>
              <button onClick={handleUploadFiles} disabled={uploading || (!stlFile && !imageFile)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
                style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}>
                {uploading
                  ? <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"/>Enviando...</>
                  : <><Upload size={12}/>Enviar</>
                }
              </button>
            </div>
          )}
        </div>
      )}

      {/* Proposals toggle */}
      {quote.responses.length > 0 && (
        <>
          <button
            onClick={() => setShowResponses(!showResponses)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm border-t border-white/5 hover:bg-white/3 transition-colors"
          >
            <span className={hasNewProposals ? 'text-neon-blue font-semibold' : 'text-gray-400'}>
              {showResponses ? 'Ocultar propostas' : `Ver ${quote.responses.length} proposta${quote.responses.length !== 1 ? 's' : ''} recebida${quote.responses.length !== 1 ? 's' : ''}`}
            </span>
            {showResponses ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showResponses && (
            <div className="border-t border-white/5 divide-y divide-white/5">
              {quote.responses.map((resp) => {
                const makerName = resp.maker?.user?.name ?? resp.maker?.companyName ?? 'Maker';
                const isAccepted = resp.status === 'ACCEPTED';
                const isPending  = resp.status === 'PENDING';

                return (
                  <div key={resp.id} className={`p-5 transition-colors ${isAccepted ? 'bg-emerald-500/5' : ''}`}>
                    <div className="flex items-start gap-4">
                      {/* Maker info */}
                      <Avatar name={makerName} src={resp.maker?.user?.avatar} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-white text-sm">{makerName}</span>
                          {resp.maker?.kycStatus === 'APPROVED' && (
                            <Award size={13} className="text-neon-blue" title="Maker verificado" />
                          )}
                          {resp.maker?.rating > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-yellow-400">
                              <Star size={11} className="fill-yellow-400" />
                              {resp.maker.rating.toFixed(1)}
                              <span className="text-gray-500 ml-0.5">({resp.maker.totalReviews})</span>
                            </span>
                          )}
                          {resp.maker?.city && (
                            <span className="text-xs text-gray-500 flex items-center gap-0.5">
                              <MapPin size={10} />{resp.maker.city}
                            </span>
                          )}
                        </div>

                        {/* Proposal details */}
                        <div className="grid grid-cols-3 gap-3 mt-2 text-center">
                          <div className="glass rounded-lg p-2 border border-white/5">
                            <div className="text-sm font-bold text-white">{formatCurrency(resp.price)}</div>
                            <div className="text-xs text-gray-500">Peças</div>
                          </div>
                          <div className="glass rounded-lg p-2 border border-white/5">
                            <div className="text-sm font-bold text-white">{formatCurrency(resp.shippingPrice ?? 0)}</div>
                            <div className="text-xs text-gray-500">Frete</div>
                          </div>
                          <div className="glass rounded-lg p-2 border border-white/5">
                            <div className="text-sm font-bold text-white">{resp.deadline} dias</div>
                            <div className="text-xs text-gray-500">Prazo</div>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-400">
                            Total: <span className="font-bold text-white">{formatCurrency(resp.price + (resp.shippingPrice ?? 0))}</span>
                          </span>
                          <ProposalStatusBadge status={resp.status} />
                        </div>

                        {/* Notes */}
                        {resp.notes && resp.status !== 'REJECTED' && (
                          <p className="mt-2 text-xs text-gray-400 italic bg-white/3 rounded-lg px-3 py-2">
                            "{resp.notes}"
                          </p>
                        )}

                        {/* Accept button */}
                        {isPending && quote.status !== 'ACCEPTED' && (
                          <div className="mt-3">
                            <Button
                              size="sm"
                              onClick={() => onAccept(resp, quote.title)}
                            >
                              <Check size={14} /> Aceitar esta proposta
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Empty — no proposals yet */}
      {quote.responses.length === 0 && quote.status === 'OPEN' && (
        <div className="px-5 pb-4 text-xs text-gray-500 border-t border-white/5 pt-3">
          Aguardando propostas dos makers… você receberá uma notificação quando chegarem.
        </div>
      )}
    </div>
  );
}

export default function ClientQuotes() {
  const { error } = useToast();
  const navigate = useNavigate();
  const [quotes,    setQuotes]    = useState<QuoteWithResponses[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [accepting, setAccepting] = useState<{ response: ResponseWithMaker; quoteTitle: string } | null>(null);
  const [showDone,  setShowDone]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await quotesService.getAll();
      setQuotes(res.data as QuoteWithResponses[]);
    } catch {
      error('Erro', 'Não foi possível carregar seus orçamentos.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { load(); }, [load]);

  const handleAccepted = (orderId: string) => {
    load();
    // aguarda o toast de sucesso ser visível antes de redirecionar
    if (orderId) setTimeout(() => navigate('/dashboard/client/orders'), 1500);
  };

  const activeQuotes    = quotes.filter(q => q.status !== 'ACCEPTED');
  const convertedQuotes = quotes.filter(q => q.status === 'ACCEPTED');

  const openCount      = activeQuotes.filter(q => q.status === 'OPEN').length;
  const pendingCount   = activeQuotes.filter(q => q.responses.some(r => r.status === 'PENDING')).length;
  const acceptedCount  = convertedQuotes.length;
  const totalProposals = quotes.reduce((sum, q) => sum + (q._count?.responses ?? q.responses.length), 0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Meus Orçamentos</h1>
          <p className="text-gray-400 mt-1">Acompanhe suas solicitações e propostas recebidas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost !p-2" title="Atualizar">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link to="/quote/request">
            <Button size="sm"><Plus size={16} /> Nova solicitação</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Solicitações',    value: quotes.length,   color: 'text-white',         bg: 'bg-white/5'        },
          { label: 'Com novas propostas', value: pendingCount,color: 'text-neon-blue',      bg: 'bg-neon-blue/10'   },
          { label: 'Aguardando',      value: openCount,       color: 'text-yellow-400',     bg: 'bg-yellow-400/10'  },
          { label: 'Aceitas',         value: acceptedCount,   color: 'text-emerald-400',    bg: 'bg-emerald-400/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`glass rounded-xl p-4 border border-white/5 ${bg}`}>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {totalProposals > 0 && pendingCount > 0 && (
        <div className="glass rounded-xl border border-neon-blue/20 bg-neon-blue/5 p-4 mb-6 flex items-center gap-3">
          <FileText size={18} className="text-neon-blue shrink-0" />
          <p className="text-sm text-white">
            Você tem <strong className="text-neon-blue">{pendingCount} solicitação{pendingCount > 1 ? 'ões' : ''}</strong> com novas propostas aguardando sua resposta.
          </p>
        </div>
      )}

      {/* Active list */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Carregando...</div>
      ) : activeQuotes.length === 0 && convertedQuotes.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={48} className="text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhuma solicitação ainda</h3>
          <p className="text-gray-400 text-sm mb-6">
            Crie sua primeira solicitação e receba propostas dos makers.
          </p>
          <Link to="/quote/request">
            <Button><Plus size={16} /> Solicitar orçamento</Button>
          </Link>
        </div>
      ) : (
        <>
          {activeQuotes.length > 0 && (
            <div className="space-y-4">
              {activeQuotes.map((q) => (
                <QuoteCard
                  key={q.id}
                  quote={q}
                  onAccept={(response, title) => setAccepting({ response, quoteTitle: title })}
                  onFilesUpdated={load}
                />
              ))}
            </div>
          )}

          {activeQuotes.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">
              Nenhuma solicitação ativa no momento.
            </div>
          )}

          {/* Converted to orders section */}
          {convertedQuotes.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowDone(!showDone)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-3"
              >
                <ShoppingBag size={14} className="text-emerald-400" />
                <span>{convertedQuotes.length} solicitaç{convertedQuotes.length > 1 ? 'ões convertidas' : 'ão convertida'} em pedido</span>
                <span className="text-gray-600">— {showDone ? 'ocultar' : 'ver histórico'}</span>
              </button>
              {showDone && (
                <div className="space-y-3">
                  {convertedQuotes.map(q => (
                    <div key={q.id} className="glass rounded-xl border border-emerald-500/10 bg-emerald-500/3 p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{q.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(q.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <ShoppingBag size={11} /> Pedido criado
                        </span>
                        <Link to="/dashboard/client/orders" className="text-xs text-neon-blue hover:underline">
                          Ver pedido →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Accept modal */}
      {accepting && (
        <AcceptModal
          response={accepting.response}
          quoteTitle={accepting.quoteTitle}
          onClose={() => setAccepting(null)}
          onAccepted={handleAccepted}
        />
      )}
    </DashboardLayout>
  );
}
