import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Edit2, Trash2, X, Search, Package,
  ImageIcon, Check, Eye, EyeOff, AlertTriangle, Upload, XCircle, Info,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { productsService } from '@/services/products.service';
import { formatCurrency } from '@/utils/format';
import type { Product, Category } from '@/types';
import api from '@/services/api';

const MATERIALS = ['PLA', 'ABS', 'PETG', 'Resina', 'TPU', 'Nylon', 'PLA+', 'Outro'];

const schema = z.object({
  name:         z.string().min(3,  'Nome obrigatório'),
  description:  z.string().min(20, 'Mínimo 20 caracteres'),
  price:        z.coerce.number().positive('Preço inválido'),
  comparePrice: z.coerce.number().optional(),
  categoryId:   z.string().min(1,  'Selecione uma categoria'),
  material:     z.string().min(1,  'Selecione um material'),
  color:        z.string().optional(),
  dimensions:   z.string().optional(),
  printTime:    z.coerce.number().optional(),
  stock:        z.coerce.number().min(0, 'Estoque inválido'),
  isFeatured:   z.boolean().default(false),
  isActive:     z.boolean().default(true),
});
type FormData = z.infer<typeof schema>;

function ImageSlot({
  index, url, uploading, onChange, onRemove,
}: {
  index: number;
  url: string;
  uploading: boolean;
  onChange: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative aspect-square rounded-xl overflow-hidden glass border border-white/10 group">
      {url ? (
        <>
          <img src={url} alt={`img ${index + 1}`} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <XCircle size={14} />
          </button>
          {index === 0 && (
            <span className="absolute bottom-1.5 left-1.5 text-[10px] bg-neon-blue/80 text-white px-1.5 py-0.5 rounded-full">
              Principal
            </span>
          )}
        </>
      ) : (
        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]); }} />
          {uploading ? (
            <div className="text-xs text-neon-blue animate-pulse">Enviando...</div>
          ) : (
            <>
              <Upload size={18} className="text-gray-600 mb-1" />
              <span className="text-xs text-gray-600">{index === 0 ? 'Principal' : `Foto ${index + 1}`}</span>
            </>
          )}
        </label>
      )}
    </div>
  );
}

function ProductModal({
  product, categories, onClose, onSaved,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { success, error } = useToast();
  const isEdit = !!product;

  const existingImages = isEdit ? (product.images as string[]) : [];
  const [imageUrls,   setImageUrls]   = useState<string[]>(existingImages.slice(0, 3).concat(['', '', '']).slice(0, 3));
  const [uploading,   setUploading]   = useState([false, false, false]);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit ? {
      name:         product.name,
      description:  product.description,
      price:        +(product.price / 1.10).toFixed(2), // converte de volta para preço base
      comparePrice: product.comparePrice,
      categoryId:   product.categoryId,
      material:     product.material,
      color:        product.color,
      dimensions:   product.dimensions,
      printTime:    product.printTime,
      stock:        product.stock,
      isFeatured:   product.isFeatured,
      isActive:     product.isActive,
    } : { stock: 1, isFeatured: false, isActive: true },
  });

  const handleImageFile = async (file: File, index: number) => {
    setUploading((prev) => { const n = [...prev]; n[index] = true; return n; });
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post<{ data: { url: string } }>('/uploads/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrls((prev) => { const n = [...prev]; n[index] = res.data.data.url; return n; });
    } catch {
      error('Erro no upload', 'Não foi possível enviar a imagem.');
    } finally {
      setUploading((prev) => { const n = [...prev]; n[index] = false; return n; });
    }
  };

  const removeImage = (index: number) =>
    setImageUrls((prev) => { const n = [...prev]; n[index] = ''; return n; });

  const onSubmit = async (data: FormData) => {
    const images = imageUrls.filter(Boolean);
    try {
      // preço de venda = preço base + 10% de comissão da plataforma
      const salePrice = +(data.price * 1.10).toFixed(2);
      const payload = { ...data, price: salePrice, images, comparePrice: data.comparePrice || undefined };
      if (isEdit) {
        await productsService.update(product.id, payload);
        success('Produto atualizado!', `"${data.name}" foi salvo.`);
      } else {
        await productsService.create(payload);
        success('Produto criado!', `"${data.name}" está disponível.`);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erro ao salvar produto.';
      error('Erro', msg);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="glass-dark rounded-2xl border border-white/10 w-full max-w-3xl my-4 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">
              {isEdit ? `Editar — ${product.name}` : 'Novo Produto'}
            </h2>
            <button onClick={onClose} className="btn-ghost !p-1.5"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x md:divide-white/5">

              {/* Left: images + toggles */}
              <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <ImageIcon size={14} /> Fotos do produto
                </h3>
                <p className="text-xs text-gray-500">Clique em cada quadro para escolher uma foto do seu computador (máx. 10 MB por imagem)</p>

                <div className="grid grid-cols-1 gap-2">
                  {/* Big main slot */}
                  <ImageSlot
                    index={0}
                    url={imageUrls[0] ?? ''}
                    uploading={uploading[0] ?? false}
                    onChange={(f) => handleImageFile(f, 0)}
                    onRemove={() => removeImage(0)}
                  />
                  {/* Two smaller slots */}
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2].map((i) => (
                      <ImageSlot
                        key={i}
                        index={i}
                        url={imageUrls[i] ?? ''}
                        uploading={uploading[i] ?? false}
                        onChange={(f) => handleImageFile(f, i)}
                        onRemove={() => removeImage(i)}
                      />
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  {([
                    { field: 'isActive'   as const, label: 'Produto ativo',  desc: 'Visível no marketplace' },
                    { field: 'isFeatured' as const, label: 'Em destaque',    desc: 'Aparece na home' },
                  ]).map(({ field, label, desc }) => (
                    <div key={field} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                      <div>
                        <div className="text-sm font-medium text-white">{label}</div>
                        <div className="text-xs text-gray-500">{desc}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setValue(field, !watch(field))}
                        className={`w-10 h-5 rounded-full transition-colors relative ${watch(field) ? 'bg-neon-blue' : 'bg-white/10'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${watch(field) ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: product details */}
              <div className="col-span-2 p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Input label="Nome do produto *" placeholder="Ex: Engrenagem Industrial 42mm"
                      error={errors.name?.message} {...register('name')} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Descrição *</label>
                    <textarea rows={3} placeholder="Descreva o produto em detalhes..."
                      className={`input resize-none ${errors.description ? 'border-red-500/50' : ''}`}
                      {...register('description')} />
                    {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description.message}</p>}
                  </div>
                  {/* ── Preço com painel de comissão ─────────────────── */}
                  <div className="space-y-3">
                    <CurrencyInput
                      label="Seu preço base (o que você quer receber) *"
                      value={watch('price')}
                      onChange={v => setValue('price', v, { shouldValidate: true })}
                      error={errors.price?.message}
                    />

                    {/* Painel de comissão */}
                    {(watch('price') ?? 0) > 0 && (() => {
                      const COMMISSION = 0.10;
                      const base       = watch('price') ?? 0;
                      const fee        = base * COMMISSION;
                      const salePrice  = base + fee;
                      return (
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
                          {/* Header */}
                          <div className="flex items-center gap-2 px-4 py-2.5"
                            style={{ background: 'rgba(0,212,255,0.08)', borderBottom: '1px solid rgba(0,212,255,0.15)' }}>
                            <Info size={13} className="text-neon-blue shrink-0" />
                            <span className="text-xs font-semibold text-neon-blue">Simulação de preço — Comissão da plataforma: 10%</span>
                          </div>
                          {/* Breakdown */}
                          <div className="px-4 py-3 space-y-2" style={{ background: 'rgba(0,0,0,0.25)' }}>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Seu preço base</span>
                              <span className="font-semibold text-white">{formatCurrency(base)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400 flex items-center gap-1">
                                <span className="text-red-400 font-bold">+</span> Comissão da plataforma (10%)
                              </span>
                              <span className="font-semibold text-red-400">+ {formatCurrency(fee)}</span>
                            </div>
                            <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                              <span className="text-sm font-bold text-white">Preço de venda ao cliente</span>
                              <span className="text-lg font-black text-emerald-400">{formatCurrency(salePrice)}</span>
                            </div>
                          </div>
                          {/* Footer note */}
                          <div className="px-4 py-2" style={{ background: 'rgba(16,185,129,0.06)', borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                              <Check size={13} strokeWidth={3} className="shrink-0" />Você receberá <strong>{formatCurrency(base)}</strong> após a venda ser concluída
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="label">Categoria *</label>
                    <select className={`input ${errors.categoryId ? 'border-red-500/50' : ''}`} {...register('categoryId')}>
                      <option value="">Selecione...</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.categoryId && <p className="mt-1 text-xs text-red-400">{errors.categoryId.message}</p>}
                  </div>
                  <div>
                    <label className="label">Material *</label>
                    <select className={`input ${errors.material ? 'border-red-500/50' : ''}`} {...register('material')}>
                      <option value="">Selecione...</option>
                      {MATERIALS.map((m) => <option key={m}>{m}</option>)}
                    </select>
                    {errors.material && <p className="mt-1 text-xs text-red-400">{errors.material.message}</p>}
                  </div>
                  <Input label="Estoque *" type="number" min={0}
                    error={errors.stock?.message} {...register('stock')} />
                  <Input label="Cor" placeholder="Ex: Azul, Preto"
                    {...register('color')} />
                  <Input label="Dimensões" placeholder="Ex: 10x8x5 cm"
                    {...register('dimensions')} />
                  <Input label="Tempo de impressão (h)" type="number" step="0.5"
                    {...register('printTime')} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
              <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
              <Button type="submit" loading={isSubmitting}>
                <Check size={16} /> {isEdit ? 'Salvar alterações' : 'Criar produto'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function PendingBanner() {
  return (
    <div className="mb-6 rounded-2xl p-5 flex items-start gap-4"
      style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.3)' }}>
      <AlertTriangle size={22} className="text-yellow-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-white">Conta pendente de aprovação</p>
        <p className="text-sm text-gray-400 mt-1">
          Seu perfil está aguardando verificação pelo administrador. Após a aprovação, você poderá
          cadastrar produtos e responder orçamentos. Isso pode levar até 48 horas.
        </p>
      </div>
    </div>
  );
}

export default function MakerProducts() {
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();
  const makerStatus = (user?.makerProfile as { status?: string })?.status ?? 'PENDING';
  const isActive    = makerStatus === 'ACTIVE';
  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editProduct,  setEditProduct]  = useState<Product | null | 'new'>(null);
  const [deleteId,    setDeleteId]    = useState<string | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsService.getMine();
      setProducts(res.data);
    } catch { error('Erro', 'Não foi possível carregar os produtos.'); }
    finally { setLoading(false); }
  }, [error]);

  useEffect(() => {
    refreshUser(); // garante status atualizado do DB (ex: após aprovação pelo admin)
    loadProducts();
    api.get('/categories').then((r) => setCategories((r.data as { data: Category[] }).data)).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProducts]);

  const handleToggleActive = async () => {
    if (!deleteId) return;
    const product = products.find(p => p.id === deleteId);
    if (!product) return;
    setDeleting(true);
    try {
      if (product.isActive) {
        await productsService.delete(deleteId);
        success('Produto desativado', `"${product.name}" foi removido do marketplace.`);
      } else {
        await productsService.update(deleteId, { isActive: true });
        success('Produto reativado!', `"${product.name}" está visível no marketplace novamente.`);
      }
      setDeleteId(null);
      loadProducts();
    } catch { error('Erro', 'Não foi possível atualizar o produto.'); }
    finally { setDeleting(false); }
  };

  const filtered = products.filter((p) => {
    if (statusFilter === 'active'   && !p.isActive) return false;
    if (statusFilter === 'inactive' &&  p.isActive) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount   = products.filter((p) => p.isActive).length;
  const inactiveCount = products.filter((p) => !p.isActive).length;

  return (
    <DashboardLayout>
      {!isActive && <PendingBanner />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Meus Produtos</h1>
          <p className="text-gray-400 mt-1">{products.length} produto(s) cadastrado(s)</p>
        </div>
        {isActive && (
          <Button onClick={() => setEditProduct('new')}>
            <Plus size={18} /> Novo Produto
          </Button>
        )}
      </div>

      {/* Stats — clicáveis como filtro */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {([
          { key: 'all'      as const, label: 'Total',    value: products.length, color: 'text-white',       activeBorder: 'border-white/30'          },
          { key: 'active'   as const, label: 'Ativos',   value: activeCount,     color: 'text-emerald-400', activeBorder: 'border-emerald-400/50'     },
          { key: 'inactive' as const, label: 'Inativos', value: inactiveCount,   color: 'text-gray-400',    activeBorder: 'border-white/30'           },
        ]).map(({ key, label, value, color, activeBorder }) => {
          const isSelected = statusFilter === key;
          return (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`glass rounded-xl p-4 border text-left transition-all hover:scale-[1.02] ${
                isSelected ? `${activeBorder} bg-white/5` : 'border-white/5 hover:border-white/10'
              }`}
            >
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className={`text-xs mt-0.5 flex items-center gap-1 ${isSelected ? 'text-white font-semibold' : 'text-gray-400'}`}>
                {label} {isSelected && <Check size={12} strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome..."
          className="input pl-10"
        />
      </div>

      {/* Product list */}
      {loading ? (
        <div className="text-center py-20 text-gray-500">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            {search ? 'Nenhum produto encontrado' : 'Você ainda não tem produtos'}
          </h3>
          <p className="text-gray-400 mb-6 text-sm">
            {search ? 'Tente outro termo de busca.' : 'Crie seu primeiro produto e comece a vender!'}
          </p>
          {!search && isActive && <Button onClick={() => setEditProduct('new')}><Plus size={16} /> Criar primeiro produto</Button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => {
            const images = product.images as string[];
            return (
              <div key={product.id}
                className="glass rounded-xl border border-white/5 hover:border-white/10 transition-all p-4 flex gap-4 items-center">
                {/* Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-dark-700 shrink-0">
                  {images[0] ? (
                    <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm truncate">{product.name}</span>
                    {product.isFeatured && <Badge variant="blue" className="text-xs">Destaque</Badge>}
                    {product.isActive
                      ? <span className="flex items-center gap-1 text-xs text-emerald-400"><Eye size={10} />Ativo</span>
                      : <span className="flex items-center gap-1 text-xs text-gray-500"><EyeOff size={10} />Inativo</span>
                    }
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {product.category && <span className="text-xs text-gray-500">{product.category.name}</span>}
                    <Badge variant="purple" className="text-xs">{product.material}</Badge>
                    <span className="text-xs text-gray-500">Estoque: {product.stock}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0 hidden sm:block">
                  {product.comparePrice && (
                    <div className="text-xs text-gray-500 line-through">{formatCurrency(product.comparePrice)}</div>
                  )}
                  <div className="font-bold text-white">{formatCurrency(product.price)}</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {isActive && (
                  <button
                    onClick={() => setEditProduct(product)}
                    className="w-8 h-8 glass rounded-lg flex items-center justify-center text-gray-400 hover:text-neon-blue hover:border-neon-blue/30 transition-all"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  )}
                  {/* Toggle active/inactive */}
                  <button
                    onClick={() => setDeleteId(product.id)}
                    className={`w-8 h-8 glass rounded-lg flex items-center justify-center transition-all ${
                      product.isActive
                        ? 'text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30'
                        : 'text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30'
                    }`}
                    title={product.isActive ? 'Desativar anúncio' : 'Reativar anúncio'}
                  >
                    {product.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product modal */}
      {editProduct !== null && (
        <ProductModal
          product={editProduct === 'new' ? null : editProduct}
          categories={categories}
          onClose={() => setEditProduct(null)}
          onSaved={loadProducts}
        />
      )}

      {/* Toggle active/inactive confirm modal */}
      {deleteId && (() => {
        const product = products.find(p => p.id === deleteId);
        const isActive = product?.isActive ?? true;
        return (
          <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setDeleteId(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="glass-dark rounded-2xl w-full max-w-sm p-6 space-y-4"
                style={{ border: `1px solid ${isActive ? 'rgba(251,191,36,0.25)' : 'rgba(16,185,129,0.25)'}` }}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-yellow-400/15' : 'bg-emerald-500/15'}`}>
                    {isActive ? <EyeOff size={20} className="text-yellow-400" /> : <Eye size={20} className="text-emerald-400" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{isActive ? 'Desativar produto?' : 'Reativar produto?'}</h3>
                    <p className="text-xs text-gray-400 max-w-[200px] truncate">{product?.name}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  {isActive
                    ? 'O produto ficará invisível no marketplace. Você pode reativá-lo a qualquer momento.'
                    : 'O produto voltará a aparecer no marketplace para os clientes.'
                  }
                </p>
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancelar</Button>
                  <button
                    onClick={handleToggleActive}
                    disabled={deleting}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 ${
                      isActive
                        ? 'bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/25'
                        : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                    }`}
                  >
                    {deleting
                      ? 'Salvando...'
                      : isActive
                        ? <><EyeOff size={14} /> Desativar</>
                        : <><Eye size={14} /> Reativar</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </DashboardLayout>
  );
}
