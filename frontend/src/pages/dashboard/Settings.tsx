import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Phone, Lock, Eye, EyeOff, Trash2, AlertTriangle,
  Check, Mail, Shield, LogOut, MapPin, ChevronRight,
  Pencil, KeyRound, Home, UserX, Camera,
  Building2, Globe, Package, Plus, X, ExternalLink,
  Upload, FileCheck, ClockIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { authService } from '@/services/auth.service';
import { makersService } from '@/services/makers.service';
import { PWD_RULES } from '@/pages/auth/Register';

// ── Schemas ───────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  name:  z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  phone: z.string().optional(),
});
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword:     z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[a-z]/, 'Deve conter letra minúscula')
    .regex(/\d/,    'Deve conter número')
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Deve conter caractere especial (!@#...)'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Senhas não conferem', path: ['confirmPassword'],
});
const addressSchema = z.object({
  label:      z.string().min(1, 'Informe um nome para o endereço'),
  zipCode:    z.string().min(8, 'CEP inválido'),
  street:     z.string().min(3, 'Logradouro obrigatório'),
  number:     z.string().min(1, 'Número obrigatório'),
  complement: z.string().optional(),
  district:   z.string().min(2, 'Bairro obrigatório'),
  city:       z.string().min(2, 'Cidade obrigatória'),
  state:      z.string().min(2, 'Estado obrigatório'),
});

type ProfileData  = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;
type AddressData  = z.infer<typeof addressSchema>;

const maskCEP = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{0,3})/, '$1-$2');

const ALL_MATERIALS = ['PLA', 'PLA+', 'ABS', 'PETG', 'Resina', 'TPU', 'Nylon', 'Outro'];
const MAKER_STATES  = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const makerSchema = z.object({
  companyName:    z.string().optional(),
  bio:            z.string().max(500, 'Máximo 500 caracteres').optional(),
  website:        z.string().url('URL inválida').optional().or(z.literal('')),
  instagram:      z.string().optional(),
  city:           z.string().min(2, 'Cidade obrigatória'),
  state:          z.string().min(2, 'Estado obrigatório'),
  maxBuildVolume: z.string().optional(),
});
type MakerData = z.infer<typeof makerSchema>;

type Tab = 'perfil' | 'perfil-maker' | 'seguranca' | 'endereco' | 'conta';

/** Parseia kycNote que pode ser JSON {"note":"...","files":[...]} ou texto puro */
function parseKycNote(raw?: string | null): { note: string; files: string[] } {
  if (!raw) return { note: '', files: [] };
  try {
    const p = JSON.parse(raw) as { note?: string; files?: string[] };
    return { note: p.note ?? raw, files: p.files ?? [] };
  } catch {
    return { note: raw, files: [] };
  }
}

const BASE_TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'perfil',       label: 'Meu Perfil',    icon: <Pencil    size={16} /> },
  { id: 'seguranca',    label: 'Segurança',      icon: <KeyRound  size={16} /> },
  { id: 'endereco',     label: 'Endereço',       icon: <Home      size={16} /> },
  { id: 'conta',        label: 'Minha Conta',    icon: <UserX     size={16} /> },
];
const MAKER_TAB = { id: 'perfil-maker' as Tab, label: 'Perfil Maker', icon: <Building2 size={16} /> };

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const { success, error } = useToast();
  const navigate  = useNavigate();
  const [tab, setTab] = useState<Tab>('perfil');

  const isMaker = user?.role === 'MAKER';
  const TABS = isMaker
    ? [BASE_TABS[0]!, MAKER_TAB, ...BASE_TABS.slice(1)]
    : BASE_TABS;

  const [showCurrent,    setShowCurrent]    = useState(false);
  const [showNew,        setShowNew]        = useState(false);
  const [deleteModal,    setDeleteModal]    = useState(false);
  const [logoutConfirm,  setLogoutConfirm]  = useState(false);
  const [deletePass,     setDeletePass]     = useState('');
  const [deletingAcc,    setDeletingAcc]    = useState(false);
  const [loadingCep,     setLoadingCep]     = useState(false);
  const [uploadingAvatar,setUploadingAvatar]= useState(false);
  const [avatarPreview,  setAvatarPreview]  = useState<string | null>(null);
  const [removingAvatar, setRemovingAvatar] = useState(false);

  // ── KYC document upload state ─────────────────────────────────────────────────
  const [kycFiles,      setKycFiles]      = useState<{ selfie?: File; docFront?: File; docBack?: File }>({});
  const [kycPreviews,   setKycPreviews]   = useState<{ selfie?: string; docFront?: string; docBack?: string }>({});
  const [uploadingKyc,  setUploadingKyc]  = useState(false);

  // ── Maker profile state ───────────────────────────────────────────────────────
  const [printers,   setPrinters]   = useState<string[]>([]);
  const [materials,  setMaterials]  = useState<string[]>([]);
  const [newPrinter, setNewPrinter] = useState('');

  const makerForm = useForm<MakerData>({
    resolver: zodResolver(makerSchema),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setUploadingAvatar(true);

    try {
      const url = await authService.uploadAvatar(file);
      await authService.updateProfile({ avatar: url });
      await refreshUser();
      setAvatarPreview(null); // use the refreshed user avatar from now on
      success('Foto atualizada!', 'Sua foto de perfil foi salva.');
    } catch {
      setAvatarPreview(null);
      error('Erro', 'Não foi possível salvar a foto. Tente novamente.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = ''; // reset input so same file can be picked again
    }
  };

  const handleRemoveAvatar = async () => {
    setRemovingAvatar(true);
    try {
      await authService.updateProfile({ avatar: '' }); // empty string → null on backend
      await refreshUser();
      setAvatarPreview(null);
      success('Foto removida!', 'Seu perfil agora exibe suas iniciais.');
    } catch {
      error('Erro', 'Não foi possível remover a foto.');
    } finally {
      setRemovingAvatar(false);
    }
  };

  const roleLabel = user?.role === 'MAKER' ? 'Maker' : user?.role === 'ADMIN' ? 'Administrador' : 'Cliente';
  const roleBg    = user?.role === 'MAKER' ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30'
                  : user?.role === 'ADMIN' ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30'
                  : 'bg-neon-blue/20 text-neon-blue border-neon-blue/30';

  // ── Profile form ─────────────────────────────────────────────────────────────
  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', phone: user?.phone ?? '' },
  });
  const onSaveProfile = async (data: ProfileData) => {
    try {
      await authService.updateProfile(data);
      await refreshUser();
      success('Perfil atualizado!', 'Suas informações foram salvas.');
    } catch { error('Erro', 'Não foi possível atualizar o perfil.'); }
  };

  // ── Password form ─────────────────────────────────────────────────────────────
  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });
  const onSavePassword = async (data: PasswordData) => {
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      passwordForm.reset();
      success('Senha alterada!', 'Sua nova senha já está ativa.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Senha atual incorreta.';
      error('Erro', msg);
    }
  };

  // ── Address form ──────────────────────────────────────────────────────────────
  const addressForm = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    defaultValues: { label: 'Casa' },
  });
  useEffect(() => {
    authService.getAddress().then(addr => {
      if (addr) addressForm.reset({
        label: addr.label, zipCode: addr.zipCode, street: addr.street,
        number: addr.number, complement: addr.complement ?? '',
        district: addr.district, city: addr.city, state: addr.state,
      });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lookupCEP = async (cep: string) => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const d = await r.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (!d.erro) {
        addressForm.setValue('street',   d.logradouro ?? '');
        addressForm.setValue('district', d.bairro     ?? '');
        addressForm.setValue('city',     d.localidade ?? '');
        addressForm.setValue('state',    d.uf         ?? '');
      }
    } catch { /* silent */ }
    finally { setLoadingCep(false); }
  };
  const onSaveAddress = async (data: AddressData) => {
    try {
      await authService.saveAddress(data);
      localStorage.setItem('printhub_user_location', JSON.stringify({ city: data.city, state: data.state }));
      success('Endereço salvo!', 'Suas solicitações de orçamento usarão este endereço.');
    } catch { error('Erro', 'Não foi possível salvar o endereço.'); }
  };

  // ── Load maker profile ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isMaker) return;
    const mp = user?.makerProfile as {
      companyName?: string; bio?: string; website?: string; instagram?: string;
      city?: string; state?: string; maxBuildVolume?: string;
      printers?: unknown; materials?: unknown;
    } | undefined;
    if (mp) {
      makerForm.setValue('companyName',    mp.companyName    ?? '');
      makerForm.setValue('bio',            mp.bio            ?? '');
      makerForm.setValue('website',        mp.website        ?? '');
      makerForm.setValue('instagram',      mp.instagram      ?? '');
      makerForm.setValue('city',           mp.city           ?? '');
      makerForm.setValue('state',          mp.state          ?? '');
      makerForm.setValue('maxBuildVolume', mp.maxBuildVolume ?? '');
      setPrinters((mp.printers  as string[]) ?? []);
      setMaterials((mp.materials as string[]) ?? []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMaker, user?.makerProfile]);

  const handleKycFileChange = (field: 'selfie' | 'docFront' | 'docBack') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setKycFiles(prev => ({ ...prev, [field]: file }));
      setKycPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
    };

  const handleKycSubmit = async () => {
    if (!kycFiles.selfie && !kycFiles.docFront && !kycFiles.docBack) {
      error('Nenhum arquivo', 'Selecione pelo menos um arquivo para enviar.');
      return;
    }
    setUploadingKyc(true);
    try {
      const upload = async (file: File, type: 'image' | 'document') => {
        const form = new FormData();
        form.append('file', file);
        const { data: r } = await (await import('@/services/api')).default.post(
          `/uploads/${type}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return (r.data as { url: string }).url;
      };

      const payload: Record<string, string> = {};
      if (kycFiles.selfie)   payload['selfieUrl']       = await upload(kycFiles.selfie,   'image');
      if (kycFiles.docFront) payload['documentUrl']     = await upload(kycFiles.docFront, 'document');
      if (kycFiles.docBack)  payload['documentBackUrl'] = await upload(kycFiles.docBack,  'document');

      await makersService.updateProfile(payload as never);
      await refreshUser();
      setKycFiles({});
      setKycPreviews({});
      success('Documentos enviados!', 'Aguarde a revisão do administrador.');
    } catch {
      error('Erro', 'Não foi possível enviar os documentos. Tente novamente.');
    } finally {
      setUploadingKyc(false);
    }
  };

  const onSaveMaker = async (data: MakerData) => {
    try {
      await makersService.updateProfile({
        ...data,
        printers:  printers  as unknown as string[],
        materials: materials as unknown as string[],
      });
      await refreshUser();
      success('Perfil de maker atualizado!', 'As informações foram salvas.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Não foi possível salvar.';
      error('Erro', msg);
    }
  };

  const addPrinter = () => {
    const v = newPrinter.trim();
    if (!v || printers.includes(v)) return;
    setPrinters(p => [...p, v]); setNewPrinter('');
  };

  const makerId = (user?.makerProfile as { id?: string })?.id;

  // ── Delete account ────────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!deletePass) return;
    setDeletingAcc(true);
    try {
      await authService.deleteAccount(deletePass);
      logout(); navigate('/');
      success('Conta excluída', 'Sua conta e todos os dados foram removidos permanentemente.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Senha incorreta.';
      error('Erro', msg);
    } finally { setDeletingAcc(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">

        {/* ── Hero card ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #131320 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Banner */}
          <div className="h-20" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(147,51,234,0.15) 100%)' }} />

          <div className="px-6 pb-6">
            {/* Avatar overlapping banner */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              {/* Avatar with upload overlay */}
              <label className="relative w-20 h-20 rounded-full overflow-hidden shrink-0 cursor-pointer group" title="Clique para alterar a foto">
                <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} disabled={uploadingAvatar} />

                {/* Avatar image or preview */}
                {avatarPreview ? (
                  <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <Avatar name={user?.name} src={user?.avatar ?? undefined} size="xl" className="!w-full !h-full !rounded-full" />
                )}

                {/* Hover overlay */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all ${
                  uploadingAvatar ? 'bg-black/60' : 'bg-black/0 group-hover:bg-black/55'
                }`}>
                  {uploadingAvatar ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">Alterar</span>
                    </>
                  )}
                </div>
              </label>

              <div className="flex flex-col items-end gap-1.5 mb-1">
                {/* Remove photo — only shown when there's an avatar */}
                {(avatarPreview || user?.avatar) && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={removingAvatar || uploadingAvatar}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 disabled:opacity-40"
                    title="Remover foto e usar iniciais"
                  >
                    {removingAvatar
                      ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      : <X size={12} />
                    }
                    Remover foto
                  </button>
                )}
                <button
                  onClick={() => setLogoutConfirm(true)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                >
                  <LogOut size={13} /> Sair da conta
                </button>
              </div>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white">{user?.name}</h2>
                <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${roleBg}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tab bar ───────────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: '#111' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={tab === t.id
                ? { background: '#1e1e1e', color: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.4)' }
                : { color: '#666' }
              }
            >
              {t.icon}
              <span className="hidden sm:block">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab: Meu Perfil ──────────────────────────────────────────────── */}
        {tab === 'perfil' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="px-6 py-4" style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-bold text-white flex items-center gap-2"><Pencil size={15} className="text-neon-blue" /> Meu Perfil</h3>
              <p className="text-xs text-gray-500 mt-0.5">Atualize seu nome e telefone de contato</p>
            </div>
            <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="p-6 space-y-4">
              <Input label="Nome completo" icon={<User size={16} />}
                error={profileForm.formState.errors.name?.message}
                {...profileForm.register('name')} />
              <Input label="Telefone" placeholder="(11) 99999-9999" icon={<Phone size={16} />}
                error={profileForm.formState.errors.phone?.message}
                {...profileForm.register('phone')} />
              <div>
                <label className="label flex items-center gap-1.5">
                  <Mail size={14} /> E-mail
                  <span className="text-gray-600 text-xs ml-1">— não pode ser alterado</span>
                </label>
                <input value={user?.email ?? ''} disabled className="input opacity-40 cursor-not-allowed" />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" loading={profileForm.formState.isSubmitting}>
                  <Check size={15} /> Salvar alterações
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ── Tab: Perfil Maker (MAKER only) ──────────────────────────────── */}
        {tab === 'perfil-maker' && isMaker && (() => {
          const mp = user?.makerProfile;
          const kycStatus = mp?.kycStatus ?? 'PENDING';
          const { note: kycMsgNote, files: kycRequiredFiles } = parseKycNote(mp?.kycNote);
          // Which upload slots to show: if CORRECTION_NEEDED and files specified → only those; else show all 3
          const showAll = kycStatus !== 'CORRECTION_NEEDED' || kycRequiredFiles.length === 0;
          const show = (key: string) => showAll || kycRequiredFiles.includes(key);

          const kycSlots: { key: 'selfie' | 'docFront' | 'docBack'; label: string; sub: string; type: 'image' | 'document' }[] = [
            { key: 'selfie',   label: 'Selfie com Documento',    sub: 'Foto sua segurando o documento',        type: 'image'    },
            { key: 'docFront', label: 'Documento — Frente',      sub: 'RG ou CNH (frente)',                    type: 'document' },
            { key: 'docBack',  label: 'Documento — Verso',       sub: 'RG ou CNH (verso)',                     type: 'document' },
          ];

          return (
          <div className="space-y-5">
            {/* ── KYC Status card ─────────────────────────── */}
            {kycStatus === 'APPROVED' && (
              <div className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.15)' }}>
                  <FileCheck size={20} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-emerald-400">Identidade verificada</p>
                  <p className="text-xs text-gray-400 mt-0.5">Sua conta está aprovada. Você pode cadastrar produtos e responder orçamentos.</p>
                </div>
              </div>
            )}

            {kycStatus === 'PENDING' && (
              <div className="rounded-2xl p-4 flex items-start gap-4"
                style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.12)' }}>
                  <ClockIcon size={20} className="text-yellow-400" />
                </div>
                <div>
                  <p className="font-bold text-yellow-400">Verificação em análise</p>
                  <p className="text-xs text-gray-400 mt-0.5">Seus documentos foram recebidos e estão sendo revisados pelo administrador. Você será notificado após a aprovação.</p>
                </div>
              </div>
            )}

            {kycStatus === 'REJECTED' && (
              <div className="rounded-2xl p-4 flex items-start gap-4"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-400">Verificação recusada</p>
                  <p className="text-xs text-gray-400 mt-0.5">Sua solicitação foi recusada. Entre em contato com o suporte para mais informações.</p>
                </div>
              </div>
            )}

            {kycStatus === 'CORRECTION_NEEDED' && (
              <div className="rounded-2xl p-5 space-y-4"
                style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.3)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.15)' }}>
                    <AlertTriangle size={18} className="text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">Correção necessária</p>
                    <p className="text-xs text-gray-400 mt-0.5">O administrador solicitou a correção dos seguintes documentos:</p>
                  </div>
                </div>
                {kycMsgNote && (
                  <div className="rounded-xl p-3 text-sm text-gray-300 leading-relaxed"
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {kycMsgNote}
                  </div>
                )}
                {kycRequiredFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {kycRequiredFiles.map(f => {
                      const labels: Record<string, string> = { selfie: 'Selfie com Documento', docFront: 'Doc. Frente', docBack: 'Doc. Verso' };
                      return (
                        <span key={f} className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                          {labels[f] ?? f}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Upload fields — filtered by required files */}
                <div className="space-y-3 pt-1">
                  {kycSlots.filter(s => show(s.key)).map(slot => {
                    const file = kycFiles[slot.key];
                    const preview = kycPreviews[slot.key];
                    const existing = slot.key === 'selfie'   ? mp?.selfieUrl
                                   : slot.key === 'docFront' ? mp?.documentUrl
                                   : mp?.documentBackUrl;
                    return (
                      <label key={slot.key} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                        style={{ background: file ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.03)',
                                 border: `1px solid ${file ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                        <input type="file" accept={slot.type === 'image' ? 'image/*' : 'image/*,application/pdf'}
                          className="sr-only" onChange={handleKycFileChange(slot.key)} />
                        {(preview || existing) ? (
                          <img src={preview ?? existing} alt={slot.label}
                            className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                            <Upload size={16} className="text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{slot.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{file ? file.name : slot.sub}</p>
                        </div>
                        {file && <Check size={14} className="text-neon-blue shrink-0" />}
                      </label>
                    );
                  })}
                </div>

                <button onClick={handleKycSubmit} disabled={uploadingKyc || (!kycFiles.selfie && !kycFiles.docFront && !kycFiles.docBack)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}>
                  {uploadingKyc
                    ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Enviando...</>
                    : <><Upload size={14}/> Enviar documentos corrigidos</>
                  }
                </button>
              </div>
            )}

            {/* Upload inicial (só quando nenhum doc enviado ainda e PENDING sem kycNote) */}
            {kycStatus === 'PENDING' && !mp?.selfieUrl && !mp?.documentUrl && (
              <div className="rounded-2xl p-5 space-y-4"
                style={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)' }}>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  <Upload size={14} className="text-neon-blue" /> Envie seus documentos de verificação
                </p>
                <p className="text-xs text-gray-400">Selfie segurando o documento + frente e verso do RG ou CNH.</p>
                <div className="space-y-3">
                  {kycSlots.map(slot => {
                    const file = kycFiles[slot.key];
                    const preview = kycPreviews[slot.key];
                    return (
                      <label key={slot.key} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                        style={{ background: file ? 'rgba(0,212,255,0.06)' : 'rgba(255,255,255,0.03)',
                                 border: `1px solid ${file ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                        <input type="file" accept={slot.type === 'image' ? 'image/*' : 'image/*,application/pdf'}
                          className="sr-only" onChange={handleKycFileChange(slot.key)} />
                        {preview ? (
                          <img src={preview} alt={slot.label} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                            <Upload size={16} className="text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{slot.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{file ? file.name : slot.sub}</p>
                        </div>
                        {file && <Check size={14} className="text-neon-blue shrink-0" />}
                      </label>
                    );
                  })}
                </div>
                <button onClick={handleKycSubmit} disabled={uploadingKyc || (!kycFiles.selfie && !kycFiles.docFront && !kycFiles.docBack)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}>
                  {uploadingKyc
                    ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Enviando...</>
                    : <><Upload size={14}/> Enviar documentos</>
                  }
                </button>
              </div>
            )}

            {/* Preview + link */}
            <div className="rounded-2xl p-4 flex items-center justify-between gap-4" style={{ background: 'linear-gradient(135deg,rgba(0,212,255,0.08),rgba(147,51,234,0.08))', border:'1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3">
                <Avatar name={user?.name} src={user?.avatar ?? undefined} size="lg" />
                <div>
                  <p className="font-bold text-white">{makerForm.watch('companyName') || user?.name}</p>
                  <p className="text-sm text-gray-400">{makerForm.watch('city')}{makerForm.watch('state') ? `, ${makerForm.watch('state')}` : ''}</p>
                </div>
              </div>
              {makerId && (
                <Link to={`/maker/${makerId}`} target="_blank" className="flex items-center gap-1.5 text-xs text-neon-blue hover:underline shrink-0">
                  <ExternalLink size={12} /> Ver perfil público
                </Link>
              )}
            </div>

            <form onSubmit={makerForm.handleSubmit(onSaveMaker)} className="space-y-5">
              {/* Basic */}
              <div className="rounded-2xl overflow-hidden" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.1)' }}>
                <div className="px-5 py-3.5" style={{ background:'#161616', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2"><Building2 size={14} className="text-neon-purple" />Informações Básicas</h3>
                </div>
                <div className="p-5 space-y-4">
                  <Input label="Nome da empresa / marca" placeholder="Ex: AlmeidaTech 3D" icon={<Building2 size={15}/>}
                    error={makerForm.formState.errors.companyName?.message} {...makerForm.register('companyName')} />
                  <div>
                    <label className="label flex items-center justify-between">
                      Bio / Apresentação
                      <span className="text-xs text-gray-600 font-normal">{(makerForm.watch('bio')||'').length}/500</span>
                    </label>
                    <textarea rows={4} maxLength={500}
                      placeholder="Descreva sua experiência, especialidades e diferenciais..."
                      className={`input resize-none ${makerForm.formState.errors.bio?'border-red-500/50':''}`}
                      {...makerForm.register('bio')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Website" placeholder="https://..." icon={<Globe size={15}/>}
                      error={makerForm.formState.errors.website?.message} {...makerForm.register('website')} />
                    <Input label="Instagram" placeholder="@perfil" icon={<Camera size={15}/>}
                      {...makerForm.register('instagram')} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Cidade *" icon={<MapPin size={15}/>}
                      error={makerForm.formState.errors.city?.message} {...makerForm.register('city')} />
                    <div>
                      <label className="label">Estado *</label>
                      <select className={`input ${makerForm.formState.errors.state?'border-red-500/50':''}`} {...makerForm.register('state')}>
                        <option value="">Selecione...</option>
                        {MAKER_STATES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <Input label="Volume máximo de impressão" placeholder="Ex: 300x300x400mm"
                    icon={<Package size={15}/>} {...makerForm.register('maxBuildVolume')} />
                </div>
              </div>

              {/* Equipment */}
              <div className="rounded-2xl overflow-hidden" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.1)' }}>
                <div className="px-5 py-3.5" style={{ background:'#161616', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2"><Package size={14} className="text-neon-blue"/>Equipamentos / Impressoras</h3>
                </div>
                <div className="p-5 space-y-3">
                  {printers.map(p => (
                    <div key={p} className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background:'#0d0d0d' }}>
                      <span className="text-neon-blue text-xs">•</span>
                      <span className="flex-1 text-sm text-white">{p}</span>
                      <button type="button" onClick={() => setPrinters(prev => prev.filter(x => x !== p))} className="text-gray-600 hover:text-red-400 transition-colors"><X size={13}/></button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input type="text" value={newPrinter} onChange={e => setNewPrinter(e.target.value)}
                      onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addPrinter();} }}
                      placeholder="Ex: Bambu Lab P1P" className="input flex-1 text-sm" />
                    <button type="button" onClick={addPrinter} disabled={!newPrinter.trim()}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/10 disabled:opacity-40 transition-colors">
                      <Plus size={13}/> Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div className="rounded-2xl overflow-hidden" style={{ background:'#111', border:'1px solid rgba(255,255,255,0.1)' }}>
                <div className="px-5 py-3.5" style={{ background:'#161616', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                  <h3 className="font-bold text-white text-sm">Materiais que Trabalho</h3>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ALL_MATERIALS.map(m => {
                      const sel = materials.includes(m);
                      return (
                        <button key={m} type="button"
                          onClick={() => setMaterials(p => sel ? p.filter(x=>x!==m) : [...p,m])}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${sel?'bg-neon-purple/20 text-neon-purple border-neon-purple/40':'text-gray-400 border-white/10 hover:border-white/20'}`}>
                          {sel && <Check size={11}/>}{m}
                        </button>
                      );
                    })}
                  </div>
                  {materials.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                      {materials.map(m => (
                        <span key={m} className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{ background: 'rgba(147,51,234,0.12)', border: '1px solid rgba(147,51,234,0.3)', color: '#c084fc' }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" loading={makerForm.formState.isSubmitting}>
                  <Check size={15}/> Salvar perfil de maker
                </Button>
              </div>
            </form>
          </div>
          );
        })()}

        {/* ── Tab: Segurança ──────────────────────────────────────────────── */}
        {tab === 'seguranca' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="px-6 py-4" style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-bold text-white flex items-center gap-2"><KeyRound size={15} className="text-neon-purple" /> Segurança</h3>
              <p className="text-xs text-gray-500 mt-0.5">Use uma senha forte com pelo menos 6 caracteres</p>
            </div>
            <form onSubmit={passwordForm.handleSubmit(onSavePassword)} className="p-6 space-y-4">
              <Input label="Senha atual" type={showCurrent ? 'text' : 'password'}
                placeholder="Digite sua senha atual" icon={<Lock size={16} />}
                rightIcon={
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="hover:text-white">
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register('currentPassword')} />
              <div>
                <Input label="Nova senha" type={showNew ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres" icon={<Lock size={16} />}
                  rightIcon={
                    <button type="button" onClick={() => setShowNew(!showNew)} className="hover:text-white">
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  error={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register('newPassword')} />
                {/* Password strength indicator */}
                {(() => {
                  const pwd = passwordForm.watch('newPassword') ?? '';
                  if (!pwd) return null;
                  const passed = PWD_RULES.filter(r => r.test(pwd)).length;
                  const colors = ['#ef4444','#f97316','#eab308','#84cc16','#22c55e'];
                  const color  = colors[passed - 1] ?? '#374151';
                  const labels = ['','Muito fraca','Fraca','Razoável','Boa','Forte'];
                  return (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1 h-1.5">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="flex-1 rounded-full transition-all duration-300"
                            style={{ background: i <= passed ? color : '#1f2937' }} />
                        ))}
                      </div>
                      <span className="text-xs font-medium" style={{ color }}>{labels[passed]}</span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                        {PWD_RULES.map(r => {
                          const ok = r.test(pwd);
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
                  );
                })()}
              </div>
              <Input label="Confirmar nova senha" type={showNew ? 'text' : 'password'}
                placeholder="Repita a nova senha" icon={<Lock size={16} />}
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')} />

              {/* Password tips */}
              <div className="rounded-xl p-4 space-y-1.5" style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold text-gray-400 mb-2">Dicas para uma senha segura:</p>
                {['Mínimo de 6 caracteres', 'Misture letras maiúsculas e minúsculas', 'Use números e símbolos'].map(tip => (
                  <p key={tip} className="text-xs text-gray-600 flex items-center gap-2">
                    <ChevronRight size={10} className="text-neon-blue shrink-0" />{tip}
                  </p>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={passwordForm.formState.isSubmitting}>
                  <Shield size={15} /> Alterar senha
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ── Tab: Endereço ──────────────────────────────────────────────── */}
        {tab === 'endereco' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="px-6 py-4" style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="font-bold text-white flex items-center gap-2"><Home size={15} className="text-emerald-400" /> Endereço Principal</h3>
              <p className="text-xs text-gray-500 mt-0.5">Pré-preenchido automaticamente ao solicitar orçamentos</p>
            </div>
            <form onSubmit={addressForm.handleSubmit(onSaveAddress)} className="p-6 space-y-4">
              <Input label="Nome do endereço" placeholder="Ex: Casa, Trabalho" icon={<Home size={16} />}
                error={addressForm.formState.errors.label?.message}
                {...addressForm.register('label')} />

              <div className="relative">
                <Input label="CEP *" placeholder="00000-000" icon={<MapPin size={16} />}
                  error={addressForm.formState.errors.zipCode?.message}
                  {...addressForm.register('zipCode')}
                  onChange={e => addressForm.setValue('zipCode', maskCEP(e.target.value))}
                  onBlur={e => lookupCEP(e.target.value)} />
                {loadingCep && (
                  <span className="absolute right-3 top-9 text-xs text-neon-blue animate-pulse flex items-center gap-1">
                    <span className="w-2.5 h-2.5 border border-neon-blue border-t-transparent rounded-full animate-spin" />
                    Buscando...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Input label="Logradouro *" placeholder="Rua, Av..."
                    error={addressForm.formState.errors.street?.message}
                    {...addressForm.register('street')} />
                </div>
                <Input label="Número *" placeholder="123"
                  error={addressForm.formState.errors.number?.message}
                  {...addressForm.register('number')} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Complemento" placeholder="Apto, Bloco..."
                  {...addressForm.register('complement')} />
                <Input label="Bairro *"
                  error={addressForm.formState.errors.district?.message}
                  {...addressForm.register('district')} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Input label="Cidade *"
                    error={addressForm.formState.errors.city?.message}
                    {...addressForm.register('city')} />
                </div>
                <Input label="UF *" placeholder="SP"
                  error={addressForm.formState.errors.state?.message}
                  {...addressForm.register('state')} />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={addressForm.formState.isSubmitting}>
                  <Check size={15} /> Salvar endereço
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ── Tab: Minha Conta ──────────────────────────────────────────────── */}
        {tab === 'conta' && (
          <div className="space-y-4">
            {/* Account info (read-only) */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="px-6 py-4" style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="font-bold text-white flex items-center gap-2"><User size={15} className="text-gray-400" /> Informações da Conta</h3>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { label: 'E-mail', value: user?.email ?? '-' },
                  { label: 'Tipo de conta', value: roleLabel },
                  { label: 'Status', value: user?.isActive ? 'Ativa' : 'Desativada' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: '#0d0d0d' }}>
                    <span className="text-sm text-gray-400">{label}</span>
                    <span className="text-sm font-semibold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Danger zone */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#111', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="px-6 py-4" style={{ background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
                <h3 className="font-bold text-red-400 flex items-center gap-2"><AlertTriangle size={15} /> Zona de Perigo</h3>
                <p className="text-xs text-gray-500 mt-0.5">Ações irreversíveis — proceda com cuidado</p>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <Trash2 size={18} className="text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white text-sm">Excluir minha conta</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Sua conta será <strong className="text-red-400">excluída permanentemente</strong> do banco de dados. Todos os dados, pedidos e histórico serão removidos. Essa ação <strong className="text-red-400">não pode ser desfeita</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteModal(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-400 rounded-xl transition-all"
                  style={{ border: '1px solid rgba(239,68,68,0.3)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Trash2 size={14} /> Excluir minha conta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Logout confirmation ──────────────────────────────────────────────── */}
      {logoutConfirm && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setLogoutConfirm(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: '#131313', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
                  <LogOut size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Sair da conta?</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Você será desconectado do sistema.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setLogoutConfirm(false)} className="flex-1 btn-secondary">Cancelar</button>
                <button
                  onClick={() => { setLogoutConfirm(false); logout(); navigate('/'); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}
                >
                  <LogOut size={15} /> Sair
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Delete modal ─────────────────────────────────────────────────────── */}
      {deleteModal && (
        <>
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50" onClick={() => setDeleteModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md p-6 rounded-2xl space-y-5" style={{ background: '#131313', border: '1px solid rgba(239,68,68,0.25)' }}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <AlertTriangle size={22} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Excluir conta?</h3>
                  <p className="text-xs text-gray-500">Esta ação é permanente e irreversível</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#999' }}>
                Digite sua <strong className="text-white">senha atual</strong> para confirmar. Sua conta e todos os dados serão <strong className="text-red-400">excluídos permanentemente</strong> do sistema.
              </p>
              <input type="password" placeholder="Sua senha atual" value={deletePass}
                onChange={e => setDeletePass(e.target.value)}
                className="input" autoFocus />
              <div className="flex gap-3">
                <button onClick={() => { setDeleteModal(false); setDeletePass(''); }}
                  className="flex-1 btn-secondary">Cancelar</button>
                <button onClick={handleDeleteAccount}
                  disabled={!deletePass || deletingAcc}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-red-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {deletingAcc ? 'Excluindo...' : <><Trash2 size={14} /> Confirmar exclusão</>}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
