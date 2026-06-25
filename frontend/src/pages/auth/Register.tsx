import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Printer, Mail, Lock, Eye, EyeOff, Phone, User, Building2,
  FileText, MapPin, Camera, Shield, Upload, ChevronRight, Check, X,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/utils/cn';

// ── Masks ────────────────────────────────────────────────────────────────────
const maskCPF    = (v: string) => v.replace(/\D/g,'').slice(0,11).replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/,'$1.$2.$3-$4');
const maskCNPJ   = (v: string) => v.replace(/\D/g,'').slice(0,14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,'$1.$2.$3/$4-$5');
const maskPhone  = (v: string) => { const d=v.replace(/\D/g,'').slice(0,11); return d.length<=10?d.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3'):d.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3'); };
const maskCEP    = (v: string) => v.replace(/\D/g,'').slice(0,8).replace(/(\d{5})(\d{0,3})/,'$1-$2');

// ── CPF / CNPJ validators (check digits) ────────────────────────────────────
function isValidCPF(raw: string): boolean {
  const d = raw.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += +d[i] * (len + 1 - i);
    const r = (s * 10) % 11;
    return r >= 10 ? 0 : r;
  };
  return calc(9) === +d[9] && calc(10) === +d[10];
}

function isValidCNPJ(raw: string): boolean {
  const d = raw.replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number) => {
    let s = 0, pos = len - 7;
    for (let i = len; i >= 1; i--) {
      s += +d[len - i] * pos--;
      if (pos < 2) pos = 9;
    }
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === +d[12] && calc(13) === +d[13];
}

// ── Password strength helpers ─────────────────────────────────────────────────
export const PWD_RULES = [
  { key: 'length',    label: 'Mínimo 8 caracteres',      test: (p: string) => p.length >= 8 },
  { key: 'upper',     label: 'Letra maiúscula (A-Z)',     test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower',     label: 'Letra minúscula (a-z)',     test: (p: string) => /[a-z]/.test(p) },
  { key: 'number',    label: 'Número (0-9)',              test: (p: string) => /\d/.test(p) },
  { key: 'special',   label: 'Caractere especial (!@#...)',test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  const passed = PWD_RULES.filter(r => r.test(password)).length;
  const colors = ['#ef4444','#f97316','#eab308','#84cc16','#22c55e'];
  const color  = colors[passed - 1] ?? '#374151';
  const labels = ['','Muito fraca','Fraca','Razoável','Boa','Forte'];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      {/* Bar */}
      <div className="flex gap-1 h-1.5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= passed ? color : '#1f2937' }} />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium" style={{ color }}>{labels[passed]}</span>
      </div>
      {/* Requirements */}
      <div className="grid grid-cols-1 gap-1 mt-1">
        {PWD_RULES.map(r => {
          const ok = r.test(password);
          return (
            <span key={r.key} className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: ok ? '#22c55e' : '#6b7280' }}>
              {ok ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
              {r.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Schemas ──────────────────────────────────────────────────────────────────
const infoSchema = z.object({
  entityType:          z.enum(['PF','PJ']),
  fullName:            z.string().optional(),
  cpf:                 z.string().optional(),
  companyName:         z.string().optional(),
  cnpj:                z.string().optional(),
  representativeName:  z.string().optional(),
  phone:               z.string().min(14,'Celular inválido'),
  email:               z.string().email('E-mail inválido'),
  password:            z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter letra maiúscula')
    .regex(/[a-z]/, 'Deve conter letra minúscula')
    .regex(/\d/,    'Deve conter número')
    .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Deve conter caractere especial (!@#...)'),
  confirmPassword:     z.string(),
}).superRefine((d, ctx) => {
  if (d.entityType === 'PF') {
    if (!d.fullName || d.fullName.trim().length < 3)
      ctx.addIssue({ code:'custom', message:'Nome completo obrigatório', path:['fullName'] });
    if (!d.cpf || !isValidCPF(d.cpf))
      ctx.addIssue({ code:'custom', message:'CPF inválido — verifique os dígitos', path:['cpf'] });
  }
  if (d.entityType === 'PJ') {
    if (!d.companyName || d.companyName.trim().length < 3)
      ctx.addIssue({ code:'custom', message:'Razão social obrigatória', path:['companyName'] });
    if (!d.cnpj || !isValidCNPJ(d.cnpj))
      ctx.addIssue({ code:'custom', message:'CNPJ inválido — verifique os dígitos', path:['cnpj'] });
    if (!d.representativeName || d.representativeName.trim().length < 3)
      ctx.addIssue({ code:'custom', message:'Nome do representante obrigatório', path:['representativeName'] });
  }
}).refine(d => d.password === d.confirmPassword, { message:'Senhas não conferem', path:['confirmPassword'] });

const addressSchema = z.object({
  cep:         z.string().min(9,'CEP inválido'),
  logradouro:  z.string().min(3,'Logradouro obrigatório'),
  numero:      z.string().min(1,'Número obrigatório'),
  complemento: z.string().optional(),
  bairro:      z.string().min(2,'Bairro obrigatório'),
  city:        z.string().min(2,'Cidade obrigatória'),
  state:       z.string().min(2,'Estado obrigatório'),
});

type InfoData    = z.infer<typeof infoSchema>;
type AddressData = z.infer<typeof addressSchema>;

// ── Stepper helper ────────────────────────────────────────────────────────────
const STEPS_CLIENT = ['Conta','Pessoa','Informações','Endereço'];
const STEPS_MAKER  = ['Conta','Pessoa','Informações','Endereço','Verificação'];

function Stepper({ step, isMaker }: { step: number; isMaker: boolean }) {
  const labels = isMaker ? STEPS_MAKER : STEPS_CLIENT;
  return (
    <div className="flex items-start justify-center mb-8">
      {labels.map((label, i) => {
        const num = i + 1;
        const done = num < step;
        const active = num === step;
        return (
          <div key={label} className="flex items-start">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                done   ? 'bg-neon-blue text-[#0a0a0a]' :
                active ? 'bg-gradient-to-br from-neon-blue to-neon-purple text-white' :
                         'glass text-gray-600'
              )}>
                {done ? <Check size={12} /> : num}
              </div>
              <span className={cn('text-[10px] font-medium whitespace-nowrap transition-colors',
                active ? 'text-neon-blue' : done ? 'text-gray-400' : 'text-gray-600'
              )}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={cn('w-14 h-0.5 mt-3.5 mx-1.5 transition-all', done ? 'bg-neon-blue' : 'bg-white/10')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Register() {
  const { register: authRegister } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [step,       setStep]       = useState(1);
  const [role,       setRole]       = useState<'CLIENT'|'MAKER'|null>(null);
  const [entityType, setEntityType] = useState<'PF'|'PJ'|null>(null);
  const [showPass,   setShowPass]   = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [kycAgreed,  setKycAgreed]  = useState(false);
  const [selfie,     setSelfie]     = useState<File|null>(null);
  const [docFront,   setDocFront]   = useState<File|null>(null);
  const [docBack,    setDocBack]    = useState<File|null>(null);

  const infoForm = useForm<InfoData>({ resolver: zodResolver(infoSchema) });
  const addrForm = useForm<AddressData>({ resolver: zodResolver(addressSchema) });

  // Keep entityType in sync with form value
  useEffect(() => {
    if (entityType) infoForm.setValue('entityType', entityType);
  }, [entityType, infoForm]);

  // ── CEP lookup ──────────────────────────────────────────────────────────────
  const lookupCEP = async (cep: string) => {
    const digits = cep.replace(/\D/g,'');
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const d = await r.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (!d.erro) {
        addrForm.setValue('logradouro', d.logradouro || '');
        addrForm.setValue('bairro',     d.bairro     || '');
        addrForm.setValue('city',       d.localidade || '');
        addrForm.setValue('state',      d.uf         || '');
      }
    } catch { /* silent */ }
    finally { setLoadingCep(false); }
  };

  // ── Step 4 handler: MAKER → step 5 KYC; CLIENT → register ──────────────────
  const handleAddressSubmit = (addrData: AddressData) => {
    if (role === 'MAKER') {
      setStep(5);
    } else {
      doRegister(addrData);
    }
  };

  // ── Final submit ────────────────────────────────────────────────────────────
  const doRegister = async (addrData: AddressData) => {
    const info = infoForm.getValues();
    setSubmitting(true);
    try {
      const name = entityType === 'PJ' ? (info.companyName || '') : (info.fullName || '');
      await authRegister({ email: info.email, password: info.password, name, phone: info.phone, role: role! });
      localStorage.setItem('printhub_user_location', JSON.stringify({ city: addrData.city, state: addrData.state }));

      // Persist the address informed during registration as the profile's main address
      const { authService: auth } = await import('@/services/auth.service');
      await auth.saveAddress({
        label:      'Casa',
        zipCode:    addrData.cep,
        street:     addrData.logradouro,
        number:     addrData.numero,
        complement: addrData.complemento,
        district:   addrData.bairro,
        city:       addrData.city,
        state:      addrData.state,
      }).catch(() => {});

      // For makers: save city/state and upload documents (token available now)
      if (role === 'MAKER') {
        const { makersService: ms } = await import('@/services/makers.service');

        const profileUpdate: Record<string, unknown> = {
          city: addrData.city,
          state: addrData.state,
        };

        // Upload documents if provided
        try {
          if (selfie)    profileUpdate['selfieUrl']        = await auth.uploadAvatar(selfie);
          if (docFront)  profileUpdate['documentUrl']      = await auth.uploadAvatar(docFront);
          if (docBack)   profileUpdate['documentBackUrl']  = await auth.uploadAvatar(docBack);
        } catch { /* silent */ }

        await ms.updateProfile(profileUpdate as never).catch(() => {});
      }

      success('Cadastro realizado!', 'Bem-vindo ao PrintHub3D!');
      navigate(role === 'MAKER' ? '/dashboard/maker' : '/dashboard/client');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao cadastrar';
      error('Erro no cadastro', msg);
    } finally { setSubmitting(false); }
  };

  // ── Logo ────────────────────────────────────────────────────────────────────
  const Logo = () => (
    <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
        <Printer size={16} className="text-white" />
      </div>
      <span className="font-bold text-white text-xl">Print<span className="gradient-text">Hub3D</span></span>
    </Link>
  );

  // ── Step 1: Role ─────────────────────────────────────────────────────────────
  if (step === 1) return (
    <div key="step-1" className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Logo />
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white">Como você quer usar o PrintHub3D?</h2>
          <p className="text-gray-400 mt-2">Escolha seu perfil para começar</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {([
            { value:'CLIENT', icon: ShoppingCart, title:'Sou Cliente', desc:'Quero comprar peças prontas ou solicitar orçamentos personalizados' },
            { value:'MAKER',  icon: Printer,      title:'Sou Maker',  desc:'Tenho impressoras 3D e quero vender meus produtos e serviços' },
          ] as const).map(({ value, icon: RoleIcon, title, desc }) => (
            <button key={value} onClick={() => { setRole(value); setStep(2); }}
              className="group flex flex-col items-center gap-3 p-6 glass rounded-2xl border border-white/10 hover:border-neon-blue/40 hover:bg-neon-blue/5 transition-all duration-200 text-center">
              <RoleIcon size={40} className="text-white" />
              <span className="font-bold text-white text-lg group-hover:text-neon-blue transition-colors">{title}</span>
              <span className="text-xs text-gray-400 leading-relaxed">{desc}</span>
              <span className="mt-1 text-neon-blue opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-sm">
                Continuar <ChevronRight size={14} />
              </span>
            </button>
          ))}
        </div>
        <p className="text-center text-gray-500 text-sm mt-8">
          Já tem conta? <Link to="/login" className="text-neon-blue hover:underline font-medium">Entrar</Link>
        </p>
      </div>
    </div>
  );

  // ── Step 2: Entity type ───────────────────────────────────────────────────────
  if (step === 2) return (
    <div key="step-2" className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Logo />
        <Stepper step={2} isMaker={role === 'MAKER'} />
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white">Qual tipo de cadastro?</h2>
          <p className="text-gray-400 mt-1.5">Escolha como deseja se identificar</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {([
            { value:'PF', icon:<User size={28} />, title:'Pessoa Física', sub:'CPF', desc:'Cadastro individual com seus dados pessoais' },
            { value:'PJ', icon:<Building2 size={28} />, title:'Pessoa Jurídica', sub:'CNPJ', desc:'Cadastro empresarial com razão social' },
          ] as const).map(({ value, icon, title, sub, desc }) => (
            <button key={value} onClick={() => { setEntityType(value); setStep(3); }}
              className="group flex flex-col items-center gap-3 p-6 glass rounded-2xl border border-white/10 hover:border-neon-purple/40 hover:bg-neon-purple/5 transition-all duration-200 text-center">
              <span className="text-neon-purple group-hover:scale-110 transition-transform">{icon}</span>
              <div>
                <div className="font-bold text-white">{title}</div>
                <div className="text-xs text-neon-purple/80 mt-0.5">{sub}</div>
              </div>
              <span className="text-xs text-gray-400 leading-relaxed">{desc}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setStep(1)} className="w-full text-center text-sm text-gray-500 hover:text-gray-300 transition-colors mt-6">
          ← Voltar
        </button>
      </div>
    </div>
  );

  // ── Step 3: Info form ─────────────────────────────────────────────────────────
  if (step === 3) return (
    <div key="step-3" className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Logo />
        <Stepper step={3} isMaker={role === 'MAKER'} />
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white">Suas informações</h2>
          <p className="text-gray-400 mt-1.5">{entityType === 'PJ' ? 'Dados da empresa' : 'Dados pessoais'}</p>
        </div>

        <form onSubmit={infoForm.handleSubmit(() => setStep(4))} autoComplete="off" className="glass rounded-2xl p-6 border border-white/10 space-y-4">
          {entityType === 'PF' ? (
            <>
              <Input label="Nome completo *" placeholder="João da Silva" icon={<User size={16} />}
                autoComplete="name"
                error={infoForm.formState.errors.fullName?.message}
                {...infoForm.register('fullName')} />
              <Input label="CPF *" placeholder="000.000.000-00" icon={<FileText size={16} />}
                autoComplete="off"
                error={infoForm.formState.errors.cpf?.message}
                {...infoForm.register('cpf')}
                onChange={(e) => infoForm.setValue('cpf', maskCPF(e.target.value), { shouldValidate: true })} />
            </>
          ) : (
            <>
              <Input label="Razão Social *" placeholder="Empresa Ltda." icon={<Building2 size={16} />}
                autoComplete="organization"
                error={infoForm.formState.errors.companyName?.message}
                {...infoForm.register('companyName')} />
              <Input label="CNPJ *" placeholder="00.000.000/0000-00" icon={<FileText size={16} />}
                autoComplete="off"
                error={infoForm.formState.errors.cnpj?.message}
                {...infoForm.register('cnpj')}
                onChange={(e) => infoForm.setValue('cnpj', maskCNPJ(e.target.value), { shouldValidate: true })} />
              <Input label="Nome do representante *" placeholder="Maria Souza" icon={<User size={16} />}
                autoComplete="off"
                error={infoForm.formState.errors.representativeName?.message}
                {...infoForm.register('representativeName')} />
            </>
          )}

          <Input label="Celular *" placeholder="(11) 99999-9999" icon={<Phone size={16} />}
            autoComplete="tel"
            error={infoForm.formState.errors.phone?.message}
            {...infoForm.register('phone')}
            onChange={(e) => infoForm.setValue('phone', maskPhone(e.target.value), { shouldValidate: true })} />
          <Input label="E-mail *" type="email" placeholder="seu@email.com" icon={<Mail size={16} />}
            autoComplete="email"
            error={infoForm.formState.errors.email?.message}
            {...infoForm.register('email')} />

          <div>
            <Input label="Senha *" type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" icon={<Lock size={16} />}
              autoComplete="new-password"
              rightIcon={<button type="button" onClick={() => setShowPass(!showPass)} className="hover:text-white">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button>}
              error={infoForm.formState.errors.password?.message}
              {...infoForm.register('password')} />
            <PasswordStrength password={infoForm.watch('password') ?? ''} />
          </div>
          <Input label="Confirmar senha *" type={showPass ? 'text' : 'password'} placeholder="Repita a senha" icon={<Lock size={16} />}
            autoComplete="new-password"
            error={infoForm.formState.errors.confirmPassword?.message}
            {...infoForm.register('confirmPassword')} />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(2)}>Voltar</Button>
            <Button type="submit" className="flex-1">Próximo</Button>
          </div>
        </form>
      </div>
    </div>
  );

  // ── Step 4: Address ───────────────────────────────────────────────────────────
  if (step === 4) return (
    <div key="step-4" className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Logo />
        <Stepper step={4} isMaker={role === 'MAKER'} />
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white">Endereço</h2>
          <p className="text-gray-400 mt-1.5">Usado para encontrar makers próximos a você</p>
        </div>

        <form onSubmit={addrForm.handleSubmit(handleAddressSubmit)} autoComplete="off"
          className="glass rounded-2xl p-6 border border-white/10 space-y-4">

          {/* CEP */}
          <div className="relative">
            <Input label="CEP *" placeholder="00000-000" icon={<MapPin size={16} />}
              autoComplete="postal-code"
              error={addrForm.formState.errors.cep?.message}
              {...addrForm.register('cep')}
              onChange={(e) => { const v = maskCEP(e.target.value); addrForm.setValue('cep', v); }}
              onBlur={(e) => lookupCEP(e.target.value)} />
            {loadingCep && <span className="absolute right-3 top-9 text-xs text-neon-blue animate-pulse">Buscando...</span>}
          </div>

          {/* Logradouro + Número */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input label="Logradouro *" placeholder="Rua, Avenida..."
                autoComplete="address-line1"
                error={addrForm.formState.errors.logradouro?.message}
                {...addrForm.register('logradouro')} />
            </div>
            <Input label="Número *" placeholder="123"
              autoComplete="off"
              error={addrForm.formState.errors.numero?.message}
              {...addrForm.register('numero')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Complemento" placeholder="Apto, Bloco..."
              autoComplete="address-line2"
              {...addrForm.register('complemento')} />
            <Input label="Bairro *" placeholder="Bairro"
              autoComplete="off"
              error={addrForm.formState.errors.bairro?.message}
              {...addrForm.register('bairro')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Cidade *" placeholder="São Paulo"
              autoComplete="address-level2"
              error={addrForm.formState.errors.city?.message}
              {...addrForm.register('city')} />
            <Input label="Estado *" placeholder="SP"
              autoComplete="address-level1"
              error={addrForm.formState.errors.state?.message}
              {...addrForm.register('state')} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(3)}>Voltar</Button>
            <Button type="submit" className="flex-1" loading={submitting}>
              {role === 'MAKER' ? 'Próximo' : 'Criar conta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  // ── Step 5: KYC (MAKER only) ──────────────────────────────────────────────────
  return (
    <div key="step-5" className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Logo />
        <Stepper step={5} isMaker={true} />
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white">Verificação de identidade</h2>
          <p className="text-gray-400 mt-1.5">Necessária para ativar sua conta como Maker</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/10 space-y-5">
          <div className="glass rounded-xl p-4 border border-neon-blue/20 flex gap-3">
            <Shield size={18} className="text-neon-blue shrink-0 mt-0.5" />
            <p className="text-sm text-gray-400">
              Os 3 documentos abaixo são <strong className="text-white">obrigatórios</strong> para criar sua conta como Maker.
              A análise é feita em até <strong className="text-white">48 horas</strong> e, enquanto isso, sua conta fica com acesso limitado.
            </p>
          </div>

          {/* Upload areas */}
          {([
            { label:'Selfie segurando o documento', icon:<Camera size={20} />, state:selfie,   setState:setSelfie,   key:'selfie' },
            { label:'Documento oficial — frente',   icon:<FileText size={20}/>, state:docFront, setState:setDocFront, key:'front'  },
            { label:'Documento oficial — verso',    icon:<FileText size={20}/>, state:docBack,  setState:setDocBack,  key:'back'   },
          ] as { label:string; icon:React.ReactNode; state:File|null; setState:(f:File|null)=>void; key:string }[]).map(({ label, icon, state, setState, key }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <label className="flex items-center gap-3 h-16 glass rounded-xl border-2 border-dashed border-white/10 hover:border-neon-blue/30 cursor-pointer transition-all px-4 group">
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => setState(e.target.files?.[0] || null)} />
                <span className="text-gray-500 group-hover:text-neon-blue transition-colors">{icon}</span>
                {state
                  ? <span className="text-sm text-white truncate">{state.name}</span>
                  : <span className="text-sm text-gray-500 group-hover:text-gray-300">Clique para enviar imagem</span>
                }
                {state && <Check size={16} className="text-emerald-400 ml-auto shrink-0" />}
              </label>
            </div>
          ))}

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={kycAgreed} onChange={(e) => setKycAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-white/20 bg-white/5 text-neon-blue shrink-0" />
            <span className="text-sm text-gray-400">
              Entendo que minha conta passará por verificação e concordo com os{' '}
              <Link to="#" className="text-neon-blue hover:underline">Termos de Uso para Makers</Link>.
            </span>
          </label>

          {(!selfie || !docFront || !docBack) && (
            <p className="text-xs text-yellow-400/80 flex items-center gap-1.5 -mt-1">
              <Shield size={12} className="shrink-0" />
              Envie os 3 documentos para habilitar o botão "Criar conta".
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setStep(4)}>Voltar</Button>
            <Button type="button" className="flex-1" loading={submitting}
              disabled={!kycAgreed || !selfie || !docFront || !docBack}
              onClick={() => addrForm.handleSubmit(doRegister)()}>
              <Upload size={16} />
              Criar conta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
