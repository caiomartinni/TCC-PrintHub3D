import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, FileUp, Image, Info, MapPin, DollarSign, Calendar, Layers, HelpCircle, X, Leaf, Sparkles, Wrench, Droplet, Microscope, Magnet, Cog, FileText, type LucideIcon } from 'lucide-react';
import CurrencyInput from '@/components/ui/CurrencyInput';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { quotesService } from '@/services/quotes.service';
import api from '@/services/api';

const maskCEP = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d{0,3})/, '$1-$2');

// Minimum deadline: 2 days from today
const minDeadline = () => {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

const schema = z.object({
  title:       z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
  description: z.string().min(20, 'Descreva melhor sua peça (mín. 20 caracteres)'),
  width:       z.preprocess(v => (v === '' || v === undefined || v === null) ? undefined : Number(v), z.number().positive().optional()),
  height:      z.preprocess(v => (v === '' || v === undefined || v === null) ? undefined : Number(v), z.number().positive().optional()),
  depth:       z.preprocess(v => (v === '' || v === undefined || v === null) ? undefined : Number(v), z.number().positive().optional()),
  material:    z.string().optional(),
  resistance:  z.string().min(1, 'Selecione a resistência necessária'),
  quantity:    z.coerce.number().min(1, 'Quantidade mínima é 1'),
  budget:      z.preprocess(v => (v === '' || v === undefined || v === null) ? undefined : Number(v), z.number().positive().optional()),
  deadline:    z.string().optional().refine(
    v => !v || v >= minDeadline(),
    'O prazo deve ser pelo menos 2 dias a partir de hoje'
  ),
  city:        z.string().optional(),
  state:       z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const MATERIALS = ['PLA', 'ABS', 'PETG', 'Resina', 'TPU', 'Nylon', 'PLA+', 'Outro'];
const RESISTANCES = ['Baixa', 'Média', 'Alta', 'Extra Alta'];

const STATES = [
  { code: 'AC', name: 'Acre' }, { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' }, { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' }, { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' }, { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' }, { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' }, { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' }, { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' }, { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' }, { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' }, { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' }, { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' }, { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' }, { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' },
];

const MATERIAL_INFO: Record<string, { desc: string; ideal: string; temp: string; icon: LucideIcon }> = {
  PLA:    { icon: Leaf,       desc: 'Material mais comum e fácil de usar. Biodegradável, derivado de amido de milho. Bom acabamento superficial, mas amolece acima de ~60 °C.', ideal: 'Decoração, protótipos, brinquedos, peças internas.', temp: 'Até ~60 °C' },
  'PLA+': { icon: Sparkles,   desc: 'Versão aprimorada do PLA com maior resistência ao impacto e à temperatura. Mantém o fácil manuseio do PLA comum.', ideal: 'Protótipos funcionais, uso geral com mais durabilidade.', temp: 'Até ~70 °C' },
  ABS:    { icon: Wrench,     desc: 'Plástico resistente a impactos e mais duro que o PLA. Suporta temperaturas mais altas, mas requer impressora fechada e ventilação.', ideal: 'Peças mecânicas leves, cases, objetos de uso frequente.', temp: 'Até ~100 °C' },
  PETG:   { icon: Droplet,    desc: 'Equilíbrio entre PLA e ABS. Resistente à umidade e produtos químicos, com boa flexibilidade e transparência parcial.', ideal: 'Peças externas, recipientes, componentes que precisam de resistência moderada.', temp: 'Até ~80 °C' },
  Resina: { icon: Microscope, desc: 'Alta precisão nos detalhes e superfície extremamente lisa. Frágil e sensível à luz UV após a impressão.', ideal: 'Miniaturas, joias, peças odontológicas, objetos com detalhes muito finos.', temp: 'Até ~50 °C' },
  TPU:    { icon: Magnet,     desc: 'Material borrachoso, flexível e elástico. Resistente à abrasão e impactos. Difícil de imprimir em alta velocidade.', ideal: 'Capas de celular, solas, juntas, peças que precisam de flexibilidade.', temp: 'Até ~90 °C' },
  Nylon:  { icon: Cog,        desc: 'Alta resistência mecânica e ao desgaste. Absorve umidade do ambiente, o que exige armazenamento adequado do filamento.', ideal: 'Engrenagens, peças estruturais, componentes de alta carga e atrito.', temp: 'Até ~120 °C' },
  Outro:  { icon: FileText,   desc: 'Caso você tenha um material específico em mente (como fibra de carbono, madeira, metal composto), descreva-o no campo de descrição da peça.', ideal: 'Aplicações especiais conforme especificado.', temp: 'Variável' },
};

export default function QuoteRequest() {
  const { isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, watch, trigger, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: 1 },
  });

  const [stlFile, setStlFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [step, setStep] = useState(1);
  const [showMaterialInfo, setShowMaterialInfo] = useState(false);
  // Delivery address
  const [deliveryMode, setDeliveryMode] = useState<'saved' | 'new'>('saved');
  const [savedAddress, setSavedAddress] = useState<{
    label: string; zipCode: string; street: string; number: string;
    complement?: string; district: string; city: string; state: string;
  } | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({ cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' });
  const [loadingCep, setLoadingCep] = useState(false);
  // Browser geolocation — used to notify nearby makers
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => {} // silent — works without location (notifies all makers)
      );
    }
  }, []);

  // Fetch saved address from profile
  useEffect(() => {
    setLoadingAddress(true);
    authService.getAddress()
      .then(addr => setSavedAddress(addr))
      .catch(() => {})
      .finally(() => setLoadingAddress(false));
  }, []);

  // Sync city/state into form from selected address (maker matching)
  useEffect(() => {
    if (deliveryMode === 'saved' && savedAddress) {
      setValue('city', savedAddress.city);
      setValue('state', savedAddress.state);
    }
  }, [deliveryMode, savedAddress, setValue]);

  useEffect(() => {
    if (deliveryMode === 'new') {
      setValue('city', newAddr.cidade);
      setValue('state', newAddr.uf);
    }
  }, [deliveryMode, newAddr.cidade, newAddr.uf, setValue]);

  const lookupNewCEP = async (cep: string) => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const d = await r.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (!d.erro) {
        setNewAddr(prev => ({
          ...prev,
          logradouro: d.logradouro || '',
          bairro:     d.bairro     || '',
          cidade:     d.localidade || '',
          uf:         d.uf         || '',
        }));
      }
    } catch { /* silent */ }
    finally { setLoadingCep(false); }
  };

  const handleNext = async () => {
    let valid = true;
    if (step === 1) valid = await trigger(['title', 'description']);
    if (step === 2) valid = await trigger(['resistance']);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: FormData) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/quote/request' } });
      return;
    }
    try {
      // Faz upload dos arquivos antes de criar o orçamento
      let fileUrl:  string | undefined;
      let imageUrl: string | undefined;

      const uploadFile = async (file: File, endpoint: string): Promise<string> => {
        const form = new FormData();
        form.append('file', file);
        const { data: r } = await api.post(`/uploads/${endpoint}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return (r as { data: { url: string } }).data.url;
      };

      if (stlFile)   fileUrl  = await uploadFile(stlFile,   'stl');
      if (imageFile) imageUrl = await uploadFile(imageFile, 'image');

      await quotesService.create({
        title:       data.title,
        description: data.description,
        width:       data.width,
        height:      data.height,
        depth:       data.depth,
        material:    data.material,
        resistance:  data.resistance,
        quantity:    data.quantity,
        budget:      data.budget,
        deadline:    data.deadline,
        city:        data.city,
        state:       data.state,
        fileUrl,
        imageUrl,
        ...(geoCoords ?? {}),
      });
      success(
        'Solicitação enviada!',
        geoCoords
          ? 'Os makers mais próximos de você serão notificados.'
          : 'Os makers serão notificados e enviarão propostas em breve.'
      );
      navigate('/dashboard/client');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Tente novamente em instantes.';
      error('Erro ao enviar', msg);
    }
  };

  // Declarado APÓS onSubmit para evitar referência antes da inicialização
  const handleFormSubmit = handleSubmit(onSubmit, (errs) => {
    console.log('Erros de validação:', errs);
    if (errs.title || errs.description) { setStep(1); return; }
    if (errs.resistance || errs.quantity || errs.width || errs.height || errs.depth) { setStep(2); return; }
    // Erro no step 3 (deadline, city, state) — não redireciona, mostra no mesmo step
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <div className="pt-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple items-center justify-center mb-4">
            <FileUp size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">Solicitar Orçamento</h1>
          <p className="text-gray-400 mt-2">Descreva sua peça e receba propostas dos melhores makers próximos a você</p>
        </div>

        {/* Steps */}
        <div className="flex items-start justify-center mb-10">
          {[
            { num: 1, label: 'Descrição' },
            { num: 2, label: 'Especificações' },
            { num: 3, label: 'Localização' },
          ].map(({ num, label }, index) => (
            <div key={num} className="flex items-start">
              <div className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${num <= step ? 'bg-gradient-to-br from-neon-blue to-neon-purple text-white' : 'glass text-gray-500'}`}>
                  {num}
                </div>
                <span className={`text-xs font-medium transition-colors whitespace-nowrap ${num <= step ? 'text-neon-blue' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
              {index < 2 && (
                <div className={`w-24 h-0.5 mt-4 mx-3 transition-all ${num < step ? 'bg-neon-blue' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
        >
          <div className="glass rounded-2xl p-8 border border-white/10 space-y-6">
            {step === 1 && (
              <>
                <Input label="Título da solicitação *" placeholder="Ex: Braço de reposição para drone DJI" error={errors.title?.message} {...register('title')} />

                <div>
                  <label className="label">Descrição detalhada *</label>
                  <textarea
                    rows={5}
                    placeholder="Descreva sua peça com o máximo de detalhes: função, ambiente de uso, partes encaixadas, etc."
                    className="input resize-none"
                    {...register('description')}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>}
                </div>

                {/* File Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label flex items-center gap-1"><Upload size={14} />Arquivo STL (opcional)</label>
                    <label className="flex flex-col items-center justify-center h-32 glass rounded-xl border-2 border-dashed border-white/10 hover:border-neon-blue/30 cursor-pointer transition-all group">
                      <input type="file" accept=".stl,.obj,.3mf" className="sr-only" onChange={(e) => setStlFile(e.target.files?.[0] || null)} />
                      <FileUp size={24} className="text-gray-500 group-hover:text-neon-blue mb-2 transition-colors" />
                      <span className="text-xs text-gray-500 group-hover:text-gray-300">
                        {stlFile ? stlFile.name : 'STL, OBJ ou 3MF'}
                      </span>
                    </label>
                  </div>
                  <div>
                    <label className="label flex items-center gap-1"><Image size={14} />Imagem de referência</label>
                    <label className="flex flex-col items-center justify-center h-32 glass rounded-xl border-2 border-dashed border-white/10 hover:border-neon-purple/30 cursor-pointer transition-all group">
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                      {imageFile ? (
                        <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <>
                          <Image size={24} className="text-gray-500 group-hover:text-neon-purple mb-2 transition-colors" />
                          <span className="text-xs text-gray-500 group-hover:text-gray-300">JPG, PNG ou WebP</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {/* Material info modal */}
                {showMaterialInfo && (
                  <>
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowMaterialInfo(false)} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                      <div className="glass-dark rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                          <h3 className="text-lg font-bold text-white">Guia de Materiais</h3>
                          <button onClick={() => setShowMaterialInfo(false)} className="btn-ghost !p-1.5 text-gray-400 hover:text-white">
                            <X size={18} />
                          </button>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {MATERIALS.map((m) => {
                            const info = MATERIAL_INFO[m];
                            if (!info) return null;
                            return (
                              <div key={m} className="glass rounded-xl p-4 border border-white/5 space-y-2">
                                <div className="flex items-center gap-2">
                                  <info.icon size={18} className="text-white" strokeWidth={1.5} />
                                  <span className="font-bold text-white">{m}</span>
                                  <span className="ml-auto text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{info.temp}</span>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed">{info.desc}</p>
                                <p className="text-xs text-neon-blue/80">
                                  <span className="text-gray-500">Ideal para: </span>{info.ideal}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Dimensions */}
                <div>
                  <label className="label flex items-center gap-1"><Layers size={14} />Dimensões (mm)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="Largura" type="number" {...register('width')} />
                    <Input placeholder="Altura" type="number" {...register('height')} />
                    <Input placeholder="Profundidade" type="number" {...register('depth')} />
                  </div>
                </div>

                {/* Material */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="label !mb-0">Material preferido</label>
                    <button
                      type="button"
                      onClick={() => setShowMaterialInfo(true)}
                      className="text-gray-500 hover:text-neon-blue transition-colors"
                      title="Saiba mais sobre cada material"
                    >
                      <HelpCircle size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {MATERIALS.map((m) => (
                      <label key={m} className={`flex items-center justify-center py-2 px-3 rounded-xl border cursor-pointer text-sm transition-all ${watch('material') === m ? 'border-neon-purple/50 bg-neon-purple/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                        <input type="radio" value={m} className="sr-only" {...register('material')} />
                        {m}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Resistance */}
                <div>
                  <label className="label">Resistência necessária *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {RESISTANCES.map((r) => (
                      <label key={r} className={`flex items-center justify-center py-2 px-3 rounded-xl border cursor-pointer text-sm transition-all ${watch('resistance') === r ? 'border-neon-blue/50 bg-neon-blue/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                        <input type="radio" value={r} className="sr-only" {...register('resistance')} />
                        {r}
                      </label>
                    ))}
                  </div>
                  {errors.resistance && (
                    <p className="mt-1.5 text-sm text-red-400">{errors.resistance.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Quantidade" type="number" min={1} {...register('quantity')} />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                {/* ── Endereço de entrega ── */}
                <div className="space-y-3">
                  <label className="label flex items-center gap-1">
                    <MapPin size={14} /> Endereço de entrega
                  </label>

                  {/* Radio cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {(['saved', 'new'] as const).map((mode) => {
                      const active = deliveryMode === mode;
                      return (
                        <label
                          key={mode}
                          className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            active
                              ? 'border-neon-blue/40 bg-neon-blue/5 text-white'
                              : 'border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <input
                            type="radio"
                            name="deliveryMode"
                            value={mode}
                            checked={active}
                            onChange={() => setDeliveryMode(mode)}
                            className="sr-only"
                          />
                          {/* Custom radio dot */}
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            active ? 'border-neon-blue' : 'border-gray-500'
                          }`}>
                            {active && <div className="w-2 h-2 rounded-full bg-neon-blue" />}
                          </div>
                          <span className="text-sm font-medium leading-snug">
                            {mode === 'saved' ? 'Utilizar endereço cadastrado' : 'Novo endereço'}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Saved address card */}
                  {deliveryMode === 'saved' && (
                    loadingAddress ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                        <span className="w-3 h-3 border border-neon-blue border-t-transparent rounded-full animate-spin shrink-0" />
                        Carregando endereço...
                      </div>
                    ) : savedAddress ? (
                      <div className="glass rounded-xl p-4 border border-white/10 space-y-1">
                        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-2">{savedAddress.label}</p>
                        <p className="text-sm text-white">
                          {savedAddress.street}, {savedAddress.number}
                          {savedAddress.complement ? <span className="text-gray-400"> — {savedAddress.complement}</span> : null}
                        </p>
                        <p className="text-sm text-gray-400">{savedAddress.district}</p>
                        <p className="text-sm text-gray-300">{savedAddress.city} — {savedAddress.state}</p>
                        <p className="text-xs text-gray-500 mt-1">CEP {savedAddress.zipCode}</p>
                      </div>
                    ) : (
                      <div className="glass rounded-xl p-4 border border-yellow-500/20 bg-yellow-500/5 flex gap-3 items-start">
                        <Info size={15} className="text-yellow-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-yellow-300 font-medium">Nenhum endereço cadastrado</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Cadastre um endereço nas configurações ou selecione "Novo endereço".
                          </p>
                        </div>
                      </div>
                    )
                  )}

                  {/* New address form */}
                  {deliveryMode === 'new' && (
                    <div className="space-y-3">
                      {/* CEP */}
                      <div className="relative">
                        <Input
                          label="CEP *"
                          placeholder="00000-000"
                          icon={<MapPin size={16} />}
                          value={newAddr.cep}
                          onChange={e => setNewAddr(prev => ({ ...prev, cep: maskCEP(e.target.value) }))}
                          onBlur={e => lookupNewCEP(e.target.value)}
                        />
                        {loadingCep && (
                          <span className="absolute right-3 top-9 text-xs text-neon-blue animate-pulse flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 border border-neon-blue border-t-transparent rounded-full animate-spin" />
                            Buscando...
                          </span>
                        )}
                      </div>

                      {/* Logradouro + Número */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <Input
                            label="Logradouro *"
                            placeholder="Rua, Avenida..."
                            value={newAddr.logradouro}
                            onChange={e => setNewAddr(prev => ({ ...prev, logradouro: e.target.value }))}
                          />
                        </div>
                        <Input
                          label="Número *"
                          placeholder="123"
                          value={newAddr.numero}
                          onChange={e => setNewAddr(prev => ({ ...prev, numero: e.target.value }))}
                        />
                      </div>

                      {/* Complemento + Bairro */}
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Complemento"
                          placeholder="Apto, Bloco..."
                          value={newAddr.complemento}
                          onChange={e => setNewAddr(prev => ({ ...prev, complemento: e.target.value }))}
                        />
                        <Input
                          label="Bairro *"
                          placeholder="..."
                          value={newAddr.bairro}
                          onChange={e => setNewAddr(prev => ({ ...prev, bairro: e.target.value }))}
                        />
                      </div>

                      {/* Cidade + UF */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <Input
                            label="Cidade *"
                            placeholder="..."
                            value={newAddr.cidade}
                            onChange={e => setNewAddr(prev => ({ ...prev, cidade: e.target.value }))}
                          />
                        </div>
                        <Input
                          label="UF *"
                          placeholder="SP"
                          value={newAddr.uf}
                          onChange={e => setNewAddr(prev => ({ ...prev, uf: e.target.value.toUpperCase().slice(0, 2) }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <CurrencyInput
                  label="Orçamento máximo (R$)"
                  icon={<DollarSign size={16} />}
                  value={watch('budget') as number | undefined}
                  onChange={v => setValue('budget', v || undefined, { shouldValidate: true })}
                />

                {/* Deadline with min 2 days + shipping notice */}
                <div>
                  <Input
                    label="Prazo desejado"
                    type="date"
                    icon={<Calendar size={16} />}
                    min={minDeadline()}
                    error={errors.deadline?.message}
                    {...register('deadline')}
                  />
                  <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                    <Info size={11} className="text-yellow-400 shrink-0" />
                    <span>Este prazo é para fabricação e <strong className="text-yellow-400">não inclui o tempo de transporte</strong>.</span>
                  </p>
                </div>

                <div className="glass rounded-xl p-4 border border-neon-blue/20 flex gap-3">
                  <Info size={16} className="text-neon-blue shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-400">
                    Os makers serão notificados e poderão enviar suas propostas em até 24h. Você terá 7 dias para aceitar a melhor oferta.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button variant="secondary" type="button" onClick={() => step > 1 && setStep(step - 1)} disabled={step === 1}>
              Anterior
            </Button>
            {step < 3 ? (
              <Button type="button" onClick={handleNext}>Próximo</Button>
            ) : (
              <Button type="button" loading={isSubmitting} onClick={() => handleFormSubmit()}>
                Enviar Solicitação
              </Button>
            )}
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
