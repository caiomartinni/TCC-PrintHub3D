import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, FileUp, Image, Info, MapPin, DollarSign, Calendar, Layers, HelpCircle, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
  description: z.string().min(20, 'Descreva melhor sua peça (mín. 20 caracteres)'),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  depth: z.coerce.number().optional(),
  material: z.string().optional(),
  resistance: z.string().min(1, 'Selecione a resistência necessária'),
  quantity: z.coerce.number().min(1),
  budget: z.coerce.number().optional(),
  deadline: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
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

const MATERIAL_INFO: Record<string, { desc: string; ideal: string; temp: string; icon: string }> = {
  PLA:    { icon: '🌱', desc: 'Material mais comum e fácil de usar. Biodegradável, derivado de amido de milho. Bom acabamento superficial, mas amolece acima de ~60 °C.', ideal: 'Decoração, protótipos, brinquedos, peças internas.', temp: 'Até ~60 °C' },
  'PLA+': { icon: '⭐', desc: 'Versão aprimorada do PLA com maior resistência ao impacto e à temperatura. Mantém o fácil manuseio do PLA comum.', ideal: 'Protótipos funcionais, uso geral com mais durabilidade.', temp: 'Até ~70 °C' },
  ABS:    { icon: '🔩', desc: 'Plástico resistente a impactos e mais duro que o PLA. Suporta temperaturas mais altas, mas requer impressora fechada e ventilação.', ideal: 'Peças mecânicas leves, cases, objetos de uso frequente.', temp: 'Até ~100 °C' },
  PETG:   { icon: '💧', desc: 'Equilíbrio entre PLA e ABS. Resistente à umidade e produtos químicos, com boa flexibilidade e transparência parcial.', ideal: 'Peças externas, recipientes, componentes que precisam de resistência moderada.', temp: 'Até ~80 °C' },
  Resina: { icon: '🔬', desc: 'Alta precisão nos detalhes e superfície extremamente lisa. Frágil e sensível à luz UV após a impressão.', ideal: 'Miniaturas, joias, peças odontológicas, objetos com detalhes muito finos.', temp: 'Até ~50 °C' },
  TPU:    { icon: '🧲', desc: 'Material borrachoso, flexível e elástico. Resistente à abrasão e impactos. Difícil de imprimir em alta velocidade.', ideal: 'Capas de celular, solas, juntas, peças que precisam de flexibilidade.', temp: 'Até ~90 °C' },
  Nylon:  { icon: '⚙️', desc: 'Alta resistência mecânica e ao desgaste. Absorve umidade do ambiente, o que exige armazenamento adequado do filamento.', ideal: 'Engrenagens, peças estruturais, componentes de alta carga e atrito.', temp: 'Até ~120 °C' },
  Outro:  { icon: '📝', desc: 'Caso você tenha um material específico em mente (como fibra de carbono, madeira, metal composto), descreva-o no campo de descrição da peça.', ideal: 'Aplicações especiais conforme especificado.', temp: 'Variável' },
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
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const prefillCityRef = useRef<string | null>(null);

  const watchedState = watch('state');

  // Pre-fill state from user registration address (city fills after cities load)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('printhub_user_location');
      if (stored) {
        const { city, state } = JSON.parse(stored) as { city: string; state: string };
        if (state) setValue('state', state);
        if (city)  prefillCityRef.current = city;
      }
    } catch { /* silent */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setValue('city', '');
    if (!watchedState) { setCityOptions([]); return; }
    setLoadingCities(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${watchedState}/municipios?orderBy=nome`)
      .then((r) => r.json())
      .then((data: { nome: string }[]) => {
        const names = data.map((c) => c.nome);
        setCityOptions(names);
        if (prefillCityRef.current && names.includes(prefillCityRef.current)) {
          setValue('city', prefillCityRef.current);
          prefillCityRef.current = null;
        }
      })
      .catch(() => setCityOptions([]))
      .finally(() => setLoadingCities(false));
  }, [watchedState, setValue]);

  const handleNext = async () => {
    if (step === 1) {
      const valid = await trigger(['title', 'description']);
      if (!valid) return;
    }
    if (step === 2) {
      const valid = await trigger(['resistance']);
      if (!valid) return;
    }
    setStep((s) => s + 1);
  };

  const onSubmit = async (data: FormData) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/quote/request' } });
      return;
    }
    try {
      console.log('Quote request:', { ...data, stlFile, imageFile });
      success('Solicitação enviada!', 'Makers próximos serão notificados.');
      navigate('/dashboard/client/quotes');
    } catch {
      error('Erro ao enviar', 'Tente novamente em instantes.');
    }
  };

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

        <form onSubmit={handleSubmit(onSubmit)}>
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
                                  <span className="text-xl">{info.icon}</span>
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
                <div className="grid grid-cols-2 gap-4">
                  {/* Estado */}
                  <div>
                    <label className="label flex items-center gap-1">
                      <MapPin size={14} />Estado
                    </label>
                    <select className="input" {...register('state')}>
                      <option value="">Selecione o estado...</option>
                      {STATES.map(({ code, name }) => (
                        <option key={code} value={code}>{name} ({code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Cidade — carregada via IBGE */}
                  <div>
                    <label className="label flex items-center gap-1">
                      <MapPin size={14} />Cidade
                    </label>
                    <select
                      className="input disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!watchedState || loadingCities}
                      {...register('city')}
                    >
                      <option value="">
                        {!watchedState
                          ? 'Selecione um estado primeiro'
                          : loadingCities
                          ? 'Carregando cidades...'
                          : 'Selecione a cidade'}
                      </option>
                      {cityOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input label="Orçamento máximo (R$)" type="number" placeholder="Ex: 150" icon={<DollarSign size={16} />} {...register('budget')} />
                <Input label="Prazo desejado" type="date" icon={<Calendar size={16} />} {...register('deadline')} />

                <div className="glass rounded-xl p-4 border border-neon-blue/20 flex gap-3">
                  <Info size={16} className="text-neon-blue shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-400">
                    Os makers mais próximos serão notificados automaticamente e poderão enviar suas propostas em até 24h. Você terá 7 dias para aceitar a melhor oferta.
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
              <Button type="submit" loading={isSubmitting}>
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
