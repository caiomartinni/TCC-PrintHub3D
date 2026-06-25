/**
 * Testes de integração — rotas de produtos
 *
 * App Express mínimo com apenas as rotas de products. Prisma é mockado;
 * JWT é gerado com a utilidade real (sem mock) para que o middleware
 * authenticate funcione exatamente como em produção.
 *
 * Cobertura:
 *   GET  /api/products   — listagem paginada (rota pública)
 *   POST /api/products   — criação válida, campos faltando, sem autenticação,
 *                          maker sem perfil ativo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Mocks ─────────────────────────────────────────────────────────────────
vi.mock('../../utils/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(), // chamado pelo middleware authenticate
    },
    makerProfile: {
      findUnique: vi.fn(), // chamado por createProduct / updateProduct / deleteProduct
    },
    product: {
      findMany:  vi.fn(), // chamado por getProducts
      count:     vi.fn(), // chamado por getProducts (count para paginação)
      create:    vi.fn(), // chamado por createProduct
      findFirst: vi.fn(), // chamado por updateProduct e deleteProduct (verificação de posse)
      update:    vi.fn(), // chamado por updateProduct (patch) e deleteProduct (soft delete)
    },
  },
}));

// ── Imports após mocks ────────────────────────────────────────────────────
import prisma from '../../utils/prisma';
import productRoutes from '../../routes/products.routes';
import { generateToken } from '../../utils/jwt';

// --------------------------------------------------------------------------
// App de teste
// --------------------------------------------------------------------------
const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);

// --------------------------------------------------------------------------
// Fixtures
// --------------------------------------------------------------------------

// Usuário MAKER válido — utilizado pelo middleware authenticate
const makerPayload = {
  id:    'maker-user-uuid',
  email: 'maker@example.com',
  role:  'MAKER',
  name:  'Maker Teste',
};

// Token JWT real (usa JWT_SECRET da env ou 'fallback-secret')
const makerToken = generateToken(makerPayload);
const authHeader  = `Bearer ${makerToken}`;

// Segundo MAKER — usado nos testes de restrição de propriedade (PUT/DELETE)
const otherMakerToken = generateToken({
  id:    'other-maker-uuid',
  email: 'other@example.com',
  role:  'MAKER',
  name:  'Outro Maker',
});
const otherAuthHeader = `Bearer ${otherMakerToken}`;

// Mock do perfil de maker retornado por prisma.makerProfile.findUnique
const mockMakerProfile = {
  id:     'maker-profile-uuid',
  userId: makerPayload.id,
  status: 'ACTIVE',
};

// Mock do produto retornado por prisma.product.create
const mockProduct = {
  id:          'prod-uuid-1',
  name:        'Suporte de Celular Impresso',
  description: 'Suporte articulado impresso em PLA de alta resistência',
  price:       49.90,
  categoryId:  '550e8400-e29b-41d4-a716-446655440000',
  material:    'PLA',
  stock:       10,
  slug:        'suporte-de-celular-impresso-1234567890',
  makerId:     mockMakerProfile.id,
  isActive:    true,
  createdAt:   new Date().toISOString(),
  updatedAt:   new Date().toISOString(),
};

// Mock da lista de produtos para getProducts
const mockProductList = [
  { ...mockProduct, id: 'prod-1', name: 'Produto A' },
  { ...mockProduct, id: 'prod-2', name: 'Produto B' },
];

// Payload válido para criar produto
const validProductBody = {
  name:        mockProduct.name,
  description: mockProduct.description,
  price:       mockProduct.price,
  categoryId:  mockProduct.categoryId,
  material:    mockProduct.material,
  stock:       mockProduct.stock,
};

// --------------------------------------------------------------------------
// Reset de mocks
// --------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
});

// ==========================================================================
// GET /api/products  (rota pública — sem autenticação)
// ==========================================================================
describe('GET /api/products', () => {

  it('200 — retorna lista paginada de produtos', async () => {
    (prisma.product.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockProductList);
    (prisma.product.count   as ReturnType<typeof vi.fn>).mockResolvedValue(2);

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({
      total: 2,
      page:  1,
      limit: 12,
    });
  });

  it('200 — retorna lista vazia quando não há produtos', async () => {
    (prisma.product.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.product.count   as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it('200 — aceita parâmetros de paginação na query string', async () => {
    (prisma.product.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.product.count   as ReturnType<typeof vi.fn>).mockResolvedValue(50);

    const res = await request(app).get('/api/products?page=3&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.pagination).toMatchObject({ page: 3, limit: 5 });
    // pages = ceil(50/5) = 10
    expect(res.body.pagination.pages).toBe(10);
  });

  it('não exige autenticação', async () => {
    (prisma.product.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.product.count   as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    // Sem header Authorization
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
  });
});

// ==========================================================================
// POST /api/products  (rota protegida — requer MAKER autenticado)
// ==========================================================================
describe('POST /api/products', () => {

  // ── Caminho feliz ──────────────────────────────────────────────────────
  it('201 — cria produto com dados válidos e maker ativo', async () => {
    // authenticate: verifica que o user existe e está ativo
    (prisma.user.findUnique       as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });
    // createProduct: busca perfil de maker
    (prisma.makerProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockMakerProfile);
    // createProduct: persiste o produto
    (prisma.product.create        as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', authHeader)
      .send(validProductBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(mockProduct.name);
    expect(prisma.product.create).toHaveBeenCalledOnce();
  });

  // ── Autenticação ───────────────────────────────────────────────────────
  it('401 — rejeita requisição sem token', async () => {
    const res = await request(app)
      .post('/api/products')
      .send(validProductBody);

    expect(res.status).toBe(401);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it('401 — rejeita token malformado', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', 'Bearer token.invalido.aqui')
      .send(validProductBody);

    expect(res.status).toBe(401);
  });

  it('403 — rejeita maker sem perfil ativo (status PENDING)', async () => {
    (prisma.user.findUnique         as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });
    (prisma.makerProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockMakerProfile, status: 'PENDING',
    });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', authHeader)
      .send(validProductBody);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('maker');
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it('403 — rejeita quando perfil de maker não existe', async () => {
    (prisma.user.findUnique         as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });
    (prisma.makerProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', authHeader)
      .send(validProductBody);

    expect(res.status).toBe(403);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  // ── Validações express-validator ───────────────────────────────────────
  it('400 — rejeita body vazio (campos obrigatórios faltando)', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', authHeader)
      .send({});

    expect(res.status).toBe(400);
    const paths = (res.body.errors as { path: string }[]).map(e => e.path);
    expect(paths).toContain('name');
    expect(paths).toContain('description');
    expect(paths).toContain('price');
    expect(paths).toContain('categoryId');
    expect(paths).toContain('material');
  });

  it('400 — rejeita preço negativo', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', authHeader)
      .send({ ...validProductBody, price: -10 });

    expect(res.status).toBe(400);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('Preço deve ser um número maior que zero');
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it('400 — rejeita preço zero', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', authHeader)
      .send({ ...validProductBody, price: 0 });

    expect(res.status).toBe(400);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('Preço deve ser um número maior que zero');
  });

  it('400 — rejeita categoryId que não é UUID', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', authHeader)
      .send({ ...validProductBody, categoryId: 'nao-e-uuid' });

    expect(res.status).toBe(400);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('Categoria inválida');
  });

  it('400 — rejeita estoque negativo', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', authHeader)
      .send({ ...validProductBody, stock: -5 });

    expect(res.status).toBe(400);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('Estoque deve ser um número inteiro maior ou igual a zero');
  });

  it('201 — aceita estoque ausente (usa default do schema)', async () => {
    (prisma.user.findUnique         as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });
    (prisma.makerProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockMakerProfile);
    (prisma.product.create          as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);

    const { stock: _, ...bodyWithoutStock } = validProductBody;

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', authHeader)
      .send(bodyWithoutStock);

    // stock é opcional — não deve bloquear a criação
    expect(res.status).toBe(201);
  });

  it('400 — rejeita name com menos de 3 caracteres', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', authHeader)
      .send({ ...validProductBody, name: 'AB' });

    expect(res.status).toBe(400);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('Nome deve ter entre 3 e 150 caracteres');
  });

  it('400 — rejeita description com menos de 10 caracteres', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', authHeader)
      .send({ ...validProductBody, description: 'Curta' });

    expect(res.status).toBe(400);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('Descrição deve ter no mínimo 10 caracteres');
  });
});

// ==========================================================================
// PUT /api/products/:id  (rota protegida — requer MAKER dono do produto)
// ==========================================================================
describe('PUT /api/products/:id', () => {

  // ── Caminho feliz ──────────────────────────────────────────────────────
  it('200 — atualiza produto com dados válidos', async () => {
    (prisma.user.findUnique         as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });
    (prisma.makerProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockMakerProfile);
    (prisma.product.findFirst       as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);
    const updatedProduct = { ...mockProduct, price: 99.90 };
    (prisma.product.update          as ReturnType<typeof vi.fn>).mockResolvedValue(updatedProduct);

    const res = await request(app)
      .put(`/api/products/${mockProduct.id}`)
      .set('Authorization', authHeader)
      .send({ price: 99.90 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.price).toBe(99.90);
    expect(prisma.product.update).toHaveBeenCalledOnce();
  });

  // ── Validação de preço ─────────────────────────────────────────────────
  it('400 — rejeita preço negativo', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });

    const res = await request(app)
      .put(`/api/products/${mockProduct.id}`)
      .set('Authorization', authHeader)
      .send({ price: -10 });

    expect(res.status).toBe(400);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('Preço deve ser um número maior que zero');
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  // ── Autenticação ───────────────────────────────────────────────────────
  it('401 — rejeita requisição sem token', async () => {
    const res = await request(app)
      .put(`/api/products/${mockProduct.id}`)
      .send({ price: 99.90 });

    expect(res.status).toBe(401);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  // ── Autorização — outro maker ──────────────────────────────────────────
  it('403 — MAKER não dono do produto não pode atualizar', async () => {
    // Outro maker autenticado com sucesso...
    (prisma.user.findUnique         as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });
    (prisma.makerProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id:     'other-maker-profile-uuid',
      userId: 'other-maker-uuid',
      status: 'ACTIVE',
    });
    // ...mas o produto não pertence ao perfil dele
    (prisma.product.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await request(app)
      .put(`/api/products/${mockProduct.id}`)
      .set('Authorization', otherAuthHeader)
      .send({ price: 99.90 });

    expect(res.status).toBe(403);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });
});

// ==========================================================================
// DELETE /api/products/:id  (rota protegida — requer MAKER dono do produto)
// ==========================================================================
describe('DELETE /api/products/:id', () => {

  // ── Caminho feliz ──────────────────────────────────────────────────────
  it('200 — deleta produto (soft delete) com sucesso', async () => {
    (prisma.user.findUnique         as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });
    (prisma.makerProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockMakerProfile);
    (prisma.product.findFirst       as ReturnType<typeof vi.fn>).mockResolvedValue(mockProduct);
    (prisma.product.update          as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockProduct, isActive: false,
    });

    const res = await request(app)
      .delete(`/api/products/${mockProduct.id}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Garante soft delete — update com isActive: false, não delete físico
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: mockProduct.id },
      data:  { isActive: false },
    });
  });

  // ── Autenticação ───────────────────────────────────────────────────────
  it('401 — rejeita deleção sem token', async () => {
    const res = await request(app)
      .delete(`/api/products/${mockProduct.id}`);

    expect(res.status).toBe(401);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });

  // ── Autorização — outro maker ──────────────────────────────────────────
  it('403 — MAKER não dono do produto não pode deletar', async () => {
    // Outro maker autenticado com sucesso...
    (prisma.user.findUnique         as ReturnType<typeof vi.fn>).mockResolvedValue({ isActive: true });
    (prisma.makerProfile.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id:     'other-maker-profile-uuid',
      userId: 'other-maker-uuid',
      status: 'ACTIVE',
    });
    // ...mas o produto não pertence ao perfil dele
    (prisma.product.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await request(app)
      .delete(`/api/products/${mockProduct.id}`)
      .set('Authorization', otherAuthHeader);

    expect(res.status).toBe(403);
    expect(prisma.product.update).not.toHaveBeenCalled();
  });
});
