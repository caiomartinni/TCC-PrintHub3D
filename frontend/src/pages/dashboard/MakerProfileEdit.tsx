import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Globe, Camera, MapPin, Package, Plus, X,
  Check, ExternalLink, Building2, Shield, CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { makersService } from '@/services/makers.service';

// ── Schema ────────────────────────────────────────────────────────────────────
const schema = z.object({
  companyName:    z.string().optional(),
  bio:            z.string().max(500, 'Máximo 500 caracteres').optional(),
  website:        z.string().url('URL inválida').optional().or(z.literal('')),
  instagram:      z.string().optional(),
  city:           z.string().min(2, 'Cidade obrigatória'),
  state:          z.string().min(2, 'Estado obrigatório'),
  maxBuildVolume: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const ALL_MATERIALS = ['PLA', 'PLA+', 'ABS', 'PETG', 'Resina', 'TPU', 'Nylon', 'Outro'];

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="px-6 py-4" style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 className="font-bold text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MakerProfileEdit() {
  const { user, refreshUser } = useAuth();
  const { success, error }    = useToast();

  const [printers,   setPrinters]   = useState<string[]>([]);
  const [materials,  setMaterials]  = useState<string[]>([]);
  const [newPrinter, setNewPrinter] = useState('');
  const [loading,    setLoading]    = useState(true);

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Busca dados frescos do servidor ao abrir a página (garante kycStatus atualizado)
  useEffect(() => {
    void refreshUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load current profile
  useEffect(() => {
    makersService.getDashboard()
      .then(() => {
        // getDashboard doesn't return profile fields — use auth/me via refreshUser
        // The profile data is in user.makerProfile after refresh
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Use authService.me() data stored in the user context
    // We'll load from the makers/dashboard or directly set from what we know
    if (user?.makerProfile) {
      const mp = user.makerProfile as {
        companyName?: string; bio?: string; website?: string; instagram?: string;
        city?: string; state?: string; maxBuildVolume?: string;
        printers?: unknown; materials?: unknown;
      };
      setValue('companyName',    mp.companyName    ?? '');
      setValue('bio',            mp.bio            ?? '');
      setValue('website',        mp.website        ?? '');
      setValue('instagram',      mp.instagram      ?? '');
      setValue('city',           mp.city           ?? '');
      setValue('state',          mp.state          ?? '');
      setValue('maxBuildVolume', mp.maxBuildVolume ?? '');
      setPrinters((mp.printers  as string[]) ?? []);
      setMaterials((mp.materials as string[]) ?? []);
      setLoading(false);
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.makerProfile]);

  const onSubmit = async (data: FormData) => {
    try {
      await makersService.updateProfile({
        ...data,
        printers:  printers  as unknown as string[],
        materials: materials as unknown as string[],
      });
      await refreshUser();
      success('Perfil atualizado!', 'Seu perfil de maker foi salvo com sucesso.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Não foi possível salvar o perfil.';
      error('Erro', msg);
    }
  };

  // ── Printer helpers ───────────────────────────────────────────────────────
  const addPrinter = () => {
    const v = newPrinter.trim();
    if (!v || printers.includes(v)) return;
    setPrinters(prev => [...prev, v]);
    setNewPrinter('');
  };
  const removePrinter = (p: string) => setPrinters(prev => prev.filter(x => x !== p));

  // ── Material helpers ──────────────────────────────────────────────────────
  const toggleMaterial = (m: string) =>
    setMaterials(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const makerId   = (user?.makerProfile as { id?: string })?.id;
  const kycStatus = (user?.makerProfile as { kycStatus?: string; kycNote?: string })?.kycStatus ?? 'PENDING';
  const kycNote   = (user?.makerProfile as { kycNote?: string })?.kycNote ?? '';

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64 text-gray-500">Carregando perfil...</div>
    </DashboardLayout>
  );

  const KycCard = () => {
    const [showNote, setShowNote] = useState(false);
    if (kycStatus === 'APPROVED') return (
      <div className="flex items-center gap-3 p-4 rounded-2xl mb-6" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)' }}>
        <CheckCircle size={20} className="text-emerald-400 shrink-0" />
        <div><p className="font-bold text-white text-sm">Verificação Concluída</p><p className="text-xs text-gray-400 mt-0.5">Sua identidade foi verificada pelo administrador.</p></div>
      </div>
    );
    if (kycStatus === 'CORRECTION_NEEDED') return (
      <div className="rounded-2xl mb-6 overflow-hidden" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-400 shrink-0" />
            <div><p className="font-bold text-white text-sm">Correção Solicitada</p><p className="text-xs text-gray-400 mt-0.5">O administrador solicitou correções nos seus documentos.</p></div>
          </div>
          <button onClick={() => setShowNote(!showNote)} className="flex items-center gap-1 text-xs text-red-400 hover:underline">
            Ver detalhes {showNote ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
          </button>
        </div>
        {showNote && kycNote && (
          <div className="px-4 pb-4">
            <div className="rounded-xl p-3 text-sm text-gray-300" style={{ background: '#0d0d0d' }}>
              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase">Mensagem do administrador:</p>
              {kycNote}
            </div>
          </div>
        )}
      </div>
    );
    if (kycStatus === 'REJECTED') return (
      <div className="flex items-center gap-3 p-4 rounded-2xl mb-6" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <X size={20} className="text-red-400 shrink-0" />
        <div><p className="font-bold text-white text-sm">Verificação Recusada</p><p className="text-xs text-gray-400 mt-0.5">Entre em contato com o suporte para mais informações.</p></div>
      </div>
    );
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl mb-6" style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.3)' }}>
        <Clock size={20} className="text-yellow-400 shrink-0" />
        <div>
          <p className="font-bold text-white text-sm">Verificação Pendente</p>
          <p className="text-xs text-gray-400 mt-0.5">Seus documentos estão aguardando análise do administrador. Isso pode levar até 48h.</p>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <KycCard />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Meu Perfil de Maker</h1>
          <p className="text-gray-400 mt-1">Configure como você aparece no marketplace</p>
        </div>
        {makerId && (
          <Link to={`/maker/${makerId}`} target="_blank"
            className="flex items-center gap-1.5 btn-ghost text-sm">
            <ExternalLink size={14} /> Ver perfil público
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="max-w-2xl space-y-6">

          {/* Preview card */}
          <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(147,51,234,0.08))', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Avatar name={user?.name} src={user?.avatar} size="xl" />
            <div>
              <p className="font-black text-white text-lg">{watch('companyName') || user?.name}</p>
              <p className="text-sm text-gray-400 mt-0.5">
                {watch('city') && watch('state') ? `${watch('city')}, ${watch('state')}` : 'Localização não informada'}
              </p>
              <p className="text-xs text-gray-600 mt-1">Prévia de como você aparece no marketplace</p>
            </div>
          </div>

          {/* Basic info */}
          <Section title="Informações Básicas" subtitle="Nome da empresa e apresentação pública">
            <div className="space-y-4">
              <Input label="Nome da empresa / marca" placeholder="Ex: AlmeidaTech 3D"
                icon={<Building2 size={16} />}
                error={errors.companyName?.message}
                {...register('companyName')} />

              <div>
                <label className="label flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><User size={14} />Bio / Apresentação</span>
                  <span className="text-xs text-gray-600 font-normal">
                    {(watch('bio') ?? '').length}/500
                  </span>
                </label>
                <textarea rows={4} maxLength={500}
                  placeholder="Descreva sua experiência, especialidades e o que torna seu trabalho único..."
                  className={`input resize-none ${errors.bio ? 'border-red-500/50' : ''}`}
                  {...register('bio')} />
                {errors.bio && <p className="mt-1 text-xs text-red-400">{errors.bio.message}</p>}
              </div>
            </div>
          </Section>

          {/* Location */}
          <Section title="Localização" subtitle="Usada para mostrar distância aos clientes">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Cidade *" placeholder="São Paulo"
                icon={<MapPin size={16} />}
                error={errors.city?.message}
                {...register('city')} />
              <div>
                <label className="label">Estado *</label>
                <select className={`input ${errors.state ? 'border-red-500/50' : ''}`} {...register('state')}>
                  <option value="">Selecione...</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <p className="mt-1 text-xs text-red-400">{errors.state.message}</p>}
              </div>
            </div>
          </Section>

          {/* Social */}
          <Section title="Links e Redes Sociais" subtitle="Opcional — aparece no seu perfil público">
            <div className="space-y-4">
              <Input label="Website" placeholder="https://seunome.com.br"
                icon={<Globe size={16} />}
                error={errors.website?.message}
                {...register('website')} />
              <Input label="Instagram" placeholder="@seuperfil"
                icon={<Camera size={16} />}
                error={errors.instagram?.message}
                {...register('instagram')} />
            </div>
          </Section>

          {/* Equipment */}
          <Section title="Equipamentos / Impressoras" subtitle="Lista as impressoras que você usa">
            <div className="space-y-3">
              {printers.length > 0 && (
                <div className="space-y-2">
                  {printers.map(p => (
                    <div key={p} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: '#0d0d0d' }}>
                      <Package size={13} className="text-neon-blue shrink-0" />
                      <span className="flex-1 text-sm text-white">{p}</span>
                      <button type="button" onClick={() => removePrinter(p)}
                        className="text-gray-600 hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPrinter}
                  onChange={e => setNewPrinter(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPrinter(); } }}
                  placeholder="Ex: Creality Ender 3 Pro"
                  className="input flex-1 text-sm"
                />
                <button type="button" onClick={addPrinter}
                  disabled={!newPrinter.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/10 transition-colors disabled:opacity-40">
                  <Plus size={14} /> Adicionar
                </button>
              </div>
              <p className="text-xs text-gray-600">Pressione Enter ou clique em Adicionar para incluir</p>
            </div>
          </Section>

          {/* Materials */}
          <Section title="Materiais que Trabalho" subtitle="Selecione os materiais disponíveis no seu estoque">
            <div className="flex flex-wrap gap-2">
              {ALL_MATERIALS.map(m => {
                const selected = materials.includes(m);
                return (
                  <button key={m} type="button" onClick={() => toggleMaterial(m)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                      selected
                        ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/40'
                        : 'text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                    }`}>
                    {selected && <Check size={12} />}
                    {m}
                  </button>
                );
              })}
            </div>
            {materials.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/5">
                {materials.map(m => <Badge key={m} variant="purple">{m}</Badge>)}
              </div>
            )}
          </Section>

          {/* Technical */}
          <Section title="Capacidade Técnica" subtitle="Opcional">
            <Input label="Volume máximo de impressão" placeholder="Ex: 300x300x400mm"
              error={errors.maxBuildVolume?.message}
              {...register('maxBuildVolume')} />
          </Section>

          {/* Save */}
          <div className="flex items-center justify-between pt-2">
            {makerId && (
              <Link to={`/maker/${makerId}`} target="_blank"
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-neon-blue transition-colors">
                <ExternalLink size={14} /> Ver como aparece para clientes
              </Link>
            )}
            <Button type="submit" loading={isSubmitting} className="ml-auto">
              <Check size={16} /> Salvar perfil
            </Button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
