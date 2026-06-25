import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FileText, Clock, User, Mail, Package, DollarSign,
  Check, X, ChevronDown, ChevronUp, RefreshCw, Send,
  AlertTriangle, Calendar, Layers, Truck, MapPin, Info,
  Paperclip, ImageIcon,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { quotesService, type MakerQuoteOpen, type MakerQuoteResponded } from '@/services/quotes.service';
import { formatCurrency, formatDate } from '@/utils/format';

const respondSchema = z.object({
  price:         z.coerce.number().positive('Informe o valor'),
  shippingPrice: z.coerce.number().min(0).optional(),
  deadline:      z.coerce.number().min(2, 'O prazo mínimo é de 2 dias'),
  notes:         z.string().optional(),
});
type RespondForm = z.infer<typeof respondSchema>;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'blue' | 'yellow' | 'green' | 'red' | 'gray' }> = {
    OPEN:     { label: 'Aberta',            variant: 'blue'   },
    PENDING:  { label: 'Aguardando cliente',variant: 'yellow' },
    ACCEPTED: { label: 'Aceita',            variant: 'green'  },
    REJECTED: { label: 'Recusada',          variant: 'red'    },
    EXPIRED:  { label: 'Expirada',          variant: 'gray'   },
  };
  const s = map[status] ?? { label: status, variant: 'gray' as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function RespondModal({
  quote, onClose, onSent,
}: {
  quote: MakerQuoteOpen;
  onClose: () => void;
  onSent: () => void;
}) {
  const { success, error } = useToast();
  const { control, register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<RespondForm>({
      resolver: zodResolver(respondSchema),
      defaultValues: { shippingPrice: 0 },
    });

  const onSubmit = async (data: RespondForm) => {
    try {
      await quotesService.respond(quote.id, data);
      success('Proposta enviada!', `Sua proposta para "${quote.title}" foi enviada ao cliente.`);
      onSent();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Erro ao enviar proposta.';
      error('Erro', msg);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="glass-dark rounded-2xl border border-white/10 w-full max-w-lg shadow-2xl flex flex-col"
          style={{ maxHeight: '90vh' }}>

          {/* Header — sempre visível, não scrolla */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
            <div>
              <h2 className="font-bold text-white">Enviar Proposta</h2>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{quote.title}</p>
            </div>
            <button onClick={onClose} className="btn-ghost !p-1.5"><X size={18} /></button>
          </div>

          {/* Body — área que scrolla */}
          <div className="overflow-y-auto flex-1">
          <form id="respond-form" onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Price */}
            <Controller control={control} name="price" render={({ field }) => (
              <CurrencyInput
                label="Seu preço pelas peças (R$) *"
                icon={<DollarSign size={15} />}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.price?.message}
              />
            )} />

            {/* Endereço de entrega do cliente */}
            {(quote.city || quote.state) && (
              <div className="glass rounded-xl border border-white/10 p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={15} className="text-neon-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">
                    Endereço de entrega do cliente
                  </p>
                  <p className="text-sm font-medium text-white">
                    {[quote.city, quote.state].filter(Boolean).join(' — ')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Use esta localização para calcular o frete por fora e informar o valor abaixo.
                  </p>
                </div>
              </div>
            )}

            {/* Shipping price — preenchido manualmente pelo maker */}
            <Controller control={control} name="shippingPrice" render={({ field }) => (
              <CurrencyInput
                label="Valor do frete (R$)"
                icon={<Truck size={15} />}
                value={field.value ?? 0}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.shippingPrice?.message}
              />
            )} />

            <Input
              label="Prazo de entrega (dias) *"
              type="number" min={2} placeholder="Ex: 7"
              icon={<Calendar size={15} />}
              error={errors.deadline?.message}
              {...register('deadline')}
            />
            <div>
              <label className="label">Observações</label>
              <textarea
                rows={3}
                placeholder="Detalhes adicionais sobre sua proposta, materiais, acabamento..."
                className="input resize-none"
                {...register('notes')}
              />
            </div>

            {/* Painel de comissão — aparece quando o preço é preenchido */}
            {(watch('price') ?? 0) > 0 && (() => {
              const COMMISSION  = 0.10;
              const basePrice   = watch('price') ?? 0;
              const shipping    = watch('shippingPrice') ?? 0;
              const fee         = basePrice * COMMISSION;
              const totalClient = basePrice + fee + shipping;
              const youReceive  = basePrice; // maker recebe o preço base sem a comissão

              return (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
                  {/* Header */}
                  <div className="flex items-center gap-2 px-4 py-2.5"
                    style={{ background: 'rgba(0,212,255,0.08)', borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
                    <Info size={13} className="text-neon-blue shrink-0" />
                    <span className="text-xs font-semibold text-neon-blue">Simulação do valor — Comissão da plataforma: 10%</span>
                  </div>
                  {/* Breakdown */}
                  <div className="px-4 py-3 space-y-2" style={{ background: 'rgba(0,0,0,0.25)' }}>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Seu preço pelas peças</span>
                      <span className="font-semibold text-white">{formatCurrency(basePrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-1">
                        <span className="text-red-400 font-bold">+</span> Comissão da plataforma (10%)
                      </span>
                      <span className="font-semibold text-red-400">+ {formatCurrency(fee)}</span>
                    </div>
                    {shipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400 flex items-center gap-1">
                          <Truck size={11} /> Frete
                        </span>
                        <span className="font-semibold text-gray-300">+ {formatCurrency(shipping)}</span>
                      </div>
                    )}
                    <div className="border-t border-white/10 pt-2 flex justify-between">
                      <span className="text-sm font-bold text-white">Total que o cliente paga</span>
                      <span className="text-base font-black text-neon-blue">{formatCurrency(totalClient)}</span>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="px-4 py-2 flex items-center justify-between"
                    style={{ background: 'rgba(16,185,129,0.06)', borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                    <span className="text-xs text-emerald-400 flex items-center gap-1.5"><Check size={13} strokeWidth={3} />Você receberá após a conclusão</span>
                    <span className="text-sm font-black text-emerald-400">{formatCurrency(youReceive)}</span>
                  </div>
                  {/* Aviso se excede orçamento */}
                  {quote.budget && totalClient > quote.budget && (
                    <div className="px-4 py-2 flex items-center gap-2"
                      style={{ background: 'rgba(251,191,36,0.06)', borderTop: '1px solid rgba(251,191,36,0.2)' }}>
                      <AlertTriangle size={12} className="text-yellow-400 shrink-0" />
                      <span className="text-xs text-yellow-400">
                        Sua proposta ({formatCurrency(totalClient)}) excede o orçamento do cliente ({formatCurrency(quote.budget)})
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

          </form>
          </div>{/* fim do body scrollável */}

          {/* Rodapé — sempre visível, não scrolla */}
          <div className="flex gap-3 px-6 py-4 border-t border-white/10 shrink-0">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button form="respond-form" type="submit" className="flex-1" loading={isSubmitting}>
              <Send size={16} /> Enviar proposta
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function QuoteCard({
  quote, onRespond, onReject, isActive,
}: {
  quote: MakerQuoteOpen;
  onRespond: (q: MakerQuoteOpen) => void;
  onReject:  (q: MakerQuoteOpen) => void;
  isActive: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass rounded-xl border border-white/5 hover:border-white/10 transition-all overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start gap-4">
        <Avatar name={quote.client.name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-sm leading-snug">{quote.title}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap text-xs text-gray-400">
                <User size={11} /> <span className="truncate">{quote.client.name}</span>
                <span className="text-gray-600">·</span>
                <Mail size={11} /> <span className="truncate">{quote.client.email}</span>
              </div>
            </div>
            <StatusBadge status={quote.status} />
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Package size={11} />Qtd: {quote.quantity}</span>
            {quote.material && <Badge variant="purple" className="text-xs">{quote.material}</Badge>}
            {quote.budget && <span className="flex items-center gap-1"><DollarSign size={11} />{formatCurrency(quote.budget)}</span>}
            {quote.city && <span className="flex items-center gap-1">{quote.city}{quote.state ? ` - ${quote.state}` : ''}</span>}
            <span className="flex items-center gap-1"><Clock size={11} />{formatDate(quote.createdAt)}</span>
            <span className="text-gray-600">{quote._count?.responses ?? 0} proposta(s)</span>
          </div>
        </div>
      </div>

      {/* Expandable detail */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/3 transition-all border-t border-white/5"
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Descrição</p>
            <p className="text-sm text-gray-300 leading-relaxed">{quote.description}</p>
          </div>
          {(quote.width || quote.height || quote.depth) && (
            <div className="flex gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Layers size={11} />Dimensões:</span>
              {quote.width  && <span>L {quote.width}mm</span>}
              {quote.height && <span>A {quote.height}mm</span>}
              {quote.depth  && <span>P {quote.depth}mm</span>}
            </div>
          )}
          {quote.resistance && <p className="text-xs text-gray-400">Resistência: <span className="text-white">{quote.resistance}</span></p>}
          {quote.deadline  && <p className="text-xs text-gray-400">Prazo desejado: <span className="text-white">{formatDate(String(quote.deadline))}</span></p>}
          {(quote.fileUrl || quote.imageUrl) && (
            <div className="flex gap-3">
              {quote.fileUrl  && <a href={quote.fileUrl}  target="_blank" rel="noreferrer" className="text-xs text-neon-blue hover:underline flex items-center gap-1.5"><Paperclip size={12} />Arquivo STL</a>}
              {quote.imageUrl && <a href={quote.imageUrl} target="_blank" rel="noreferrer" className="text-xs text-neon-blue hover:underline flex items-center gap-1.5"><ImageIcon size={12} />Imagem de referência</a>}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-4 pb-4">
        {isActive ? (
          <>
            <Button size="sm" className="flex-1" onClick={() => onRespond(quote)}>
              <Send size={14} /> Enviar proposta
            </Button>
            <button
              onClick={() => onReject(quote)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-400 border border-white/10 rounded-lg hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              <X size={13} /> Recusar
            </button>
          </>
        ) : (
          <div className="flex-1 text-xs text-yellow-500/70 italic py-1">
            Conta pendente — não é possível responder
          </div>
        )}
      </div>
    </div>
  );
}

function RespondedCard({ item }: { item: MakerQuoteResponded }) {
  const [expanded, setExpanded] = useState(false);
  const q = item.quoteRequest;

  return (
    <div className="glass rounded-xl border border-white/5 overflow-hidden">
      <div className="p-4 flex items-start gap-4">
        <Avatar name={q.client.name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h3 className="font-semibold text-white text-sm leading-snug truncate">{q.title}</h3>
            <StatusBadge status={item.status} />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1"><User size={11} />{q.client.name}</span>
            <span className="flex items-center gap-1"><Mail size={11} />{q.client.email}</span>
            <span className="flex items-center gap-1"><Clock size={11} />{formatDate(item.createdAt)}</span>
          </div>
          {item.status !== 'REJECTED' && (
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-emerald-400 font-bold">{formatCurrency(item.price)}</span>
              {item.shippingPrice > 0 && <span className="text-gray-400">+ {formatCurrency(item.shippingPrice)} frete</span>}
              <span className="text-gray-400">{item.deadline} dias</span>
            </div>
          )}
        </div>
      </div>

      {item.notes && item.status !== 'REJECTED' && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-all border-t border-white/5"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Ocultar observações' : 'Ver observações'}
          </button>
          {expanded && (
            <p className="px-4 pb-4 text-sm text-gray-400 border-t border-white/5 pt-3">{item.notes}</p>
          )}
        </>
      )}
    </div>
  );
}

function RejectModal({ quote, onClose, onRejected }: { quote: MakerQuoteOpen; onClose: () => void; onRejected: () => void }) {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    setLoading(true);
    try {
      await quotesService.reject(quote.id);
      success('Solicitação recusada', `Você recusou "${quote.title}".`);
      onRejected();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao recusar.';
      error('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="glass-dark rounded-2xl border border-red-500/20 w-full max-w-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">Recusar solicitação?</h3>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{quote.title}</p>
            </div>
          </div>
          <p className="text-sm text-gray-400">A solicitação não aparecerá mais na sua lista. O cliente continuará podendo receber propostas de outros makers.</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-all disabled:opacity-40"
            >
              <X size={14} /> {loading ? 'Recusando...' : 'Recusar'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MakerQuotes() {
  const { user, refreshUser } = useAuth();
  const { error } = useToast();
  const isActive  = (user?.makerProfile as { status?: string })?.status === 'ACTIVE';
  const [data,        setData]        = useState<{ open: MakerQuoteOpen[]; responded: MakerQuoteResponded[] } | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState<'open' | 'responded'>('open');
  const [respondTo,   setRespondTo]   = useState<MakerQuoteOpen | null>(null);
  const [rejectTarget,setRejectTarget]= useState<MakerQuoteOpen | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await quotesService.getMakerQuotes();
      setData(result);
    } catch {
      error('Erro', 'Não foi possível carregar as solicitações.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    refreshUser(); // garante status atualizado (ex: após aprovação pelo admin)
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const openCount     = data?.open.length      ?? 0;
  const respondedCount= data?.responded.length ?? 0;
  const pendingCount  = data?.responded.filter(r => r.status === 'PENDING').length ?? 0;
  const acceptedCount = data?.responded.filter(r => r.status === 'ACCEPTED').length ?? 0;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Solicitações de Orçamento</h1>
          <p className="text-gray-400 mt-1">Gerencie as solicitações de clientes</p>
        </div>
        <button onClick={load} className="btn-ghost !p-2" title="Atualizar">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Pending banner */}
      {!isActive && (
        <div className="mb-6 rounded-2xl p-5 flex items-start gap-4"
          style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.3)' }}>
          <AlertTriangle size={22} className="text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white">Conta pendente de aprovação</p>
            <p className="text-sm text-gray-400 mt-1">
              Você pode visualizar as solicitações, mas não poderá responder até que seu perfil seja aprovado pelo administrador.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Novas',     value: openCount,      color: 'text-neon-blue',   bg: 'bg-neon-blue/10'   },
          { label: 'Enviadas',  value: respondedCount, color: 'text-gray-300',    bg: 'bg-white/5'        },
          { label: 'Pendentes', value: pendingCount,   color: 'text-yellow-400',  bg: 'bg-yellow-400/10'  },
          { label: 'Aceitas',   value: acceptedCount,  color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`glass rounded-xl p-4 border border-white/5 ${bg}`}>
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('open')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            tab === 'open' ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30' : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileText size={15} /> Novas Solicitações
          {openCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-neon-blue text-[#0a0a0a] text-xs font-bold flex items-center justify-center">
              {openCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('responded')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            tab === 'responded' ? 'bg-white/10 text-white border border-white/20' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Send size={15} /> Minhas Propostas
          {respondedCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center">
              {respondedCount}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Carregando...</div>
      ) : tab === 'open' ? (
        openCount === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma solicitação aberta</h3>
            <p className="text-gray-400 text-sm">Quando clientes solicitarem orçamentos, eles aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data!.open.map((q) => (
              <QuoteCard
                key={q.id}
                quote={q}
                onRespond={setRespondTo}
                onReject={setRejectTarget}
                isActive={isActive}
              />
            ))}
          </div>
        )
      ) : (
        respondedCount === 0 ? (
          <div className="text-center py-20">
            <Send size={48} className="text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma proposta enviada ainda</h3>
            <p className="text-gray-400 text-sm">Suas propostas para solicitações aparecerão aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data!.responded.map((item) => (
              <RespondedCard key={item.id} item={item} />
            ))}
          </div>
        )
      )}

      {/* Modals */}
      {respondTo && (
        <RespondModal
          quote={respondTo}
          onClose={() => setRespondTo(null)}
          onSent={load}
        />
      )}
      {rejectTarget && (
        <RejectModal
          quote={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={load}
        />
      )}
    </DashboardLayout>
  );
}
