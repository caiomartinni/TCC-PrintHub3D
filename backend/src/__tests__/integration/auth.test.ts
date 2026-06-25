/**
 * Testes de integração — rotas de autenticação
 *
 * Sobe um app Express mínimo com apenas as rotas de auth (sem o server.ts
 * completo, que abre porta + cria tabelas no banco real). Prisma e bcryptjs
 * são substituídos por mocks, então nenhuma query real é executada.
 *
 * Cobertura:
 *   POST /api/auth/register — body válido, e-mail duplicado, campos inválidos
 *   POST /api/auth/login    — credenciais corretas, senha errada, conta inativa,
 *                             campos faltando, e-mail inválido
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ── Mocks declarados ANTES dos imports que dependem deles ──────────────────
// vi.mock é hoistado pelo Vitest, então os módulos abaixo já chegam mockados.

vi.mock('../../utils/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
    makerProfile: {
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash:    vi.fn(),
    compare: vi.fn(),
  },
  // bcryptjs é CJS; com esModuleInterop o controller chama bcrypt.hash,
  // mas Vitest pode expor via default ou top-level — fornecemos os dois.
  hash:    vi.fn(),
  compare: vi.fn(),
}));

// sendPasswordResetEmail só é chamada por forgotPassword, não por
// register/login — mas mockamos para evitar nodemailer tentar conectar
vi.mock('../../services/email.service', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(null),
}));

// ── Imports após os mocks ──────────────────────────────────────────────────
import prisma from '../../utils/prisma';
import bcrypt from 'bcryptjs';
import authRoutes from '../../routes/auth.routes';

// --------------------------------------------------------------------------
// App de teste
// --------------------------------------------------------------------------
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

// --------------------------------------------------------------------------
// Fixtures
// --------------------------------------------------------------------------
const HASHED_PW = '$2b$12$test_hash_qualquer';

const mockUser = {
  id:       'user-uuid-1',
  email:    'joao@example.com',
  password: HASHED_PW,
  name:     'João Silva',
  role:     'CLIENT' as const,
  isActive: true,
  phone:    null,
  avatar:   null,
  createdAt: new Date(),
  updatedAt: new Date(),
  resetPasswordToken:    null,
  resetPasswordExpires:  null,
};

const validRegisterBody = {
  name:     'Maria Souza',
  email:    'maria@example.com',
  password: 'Senha@123',
  role:     'CLIENT',
};

const validLoginBody = {
  email:    'joao@example.com',
  password: 'SenhaCorreta@1',
};

// --------------------------------------------------------------------------
// Reset de mocks antes de cada teste
// --------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
});

// ==========================================================================
// POST /api/auth/register
// ==========================================================================
describe('POST /api/auth/register', () => {

  // ── Caminho feliz ──────────────────────────────────────────────────────
  it('201 — cadastra usuário CLIENT com dados válidos', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.user.create    as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockUser,
      email: validRegisterBody.email,
      name:  validRegisterBody.name,
    });
    (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue(HASHED_PW);

    const res = await request(app)
      .post('/api/auth/register')
      .send(validRegisterBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe(validRegisterBody.email);
  });

  it('201 — cadastra usuário MAKER e cria makerProfile', async () => {
    (prisma.user.findUnique   as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.user.create       as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockUser, role: 'MAKER', email: 'maker@example.com',
    });
    (prisma.makerProfile.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'mp-1', userId: mockUser.id, status: 'PENDING',
    });
    (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue(HASHED_PW);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegisterBody, email: 'maker@example.com', role: 'MAKER' });

    expect(res.status).toBe(201);
    expect(prisma.makerProfile.create).toHaveBeenCalledOnce();
  });

  // ── Validações express-validator (status 400) ──────────────────────────
  it('400 — rejeita quando name está ausente', async () => {
    const { name: _, ...body } = validRegisterBody;
    const res = await request(app).post('/api/auth/register').send(body);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('Nome é obrigatório');
  });

  it('400 — rejeita quando name tem menos de 3 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegisterBody, name: 'Ab' });

    expect(res.status).toBe(400);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('Nome deve ter no mínimo 3 caracteres');
  });

  it('400 — rejeita e-mail inválido', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegisterBody, email: 'nao-e-email' });

    expect(res.status).toBe(400);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('E-mail inválido');
  });

  it('400 — rejeita senha com menos de 8 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegisterBody, password: '123' });

    expect(res.status).toBe(400);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('A senha deve ter no mínimo 8 caracteres');
  });

  it('400 — rejeita CPF inválido quando enviado', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegisterBody, cpf: '000.000.000-00' }); // CPF com dígitos iguais

    expect(res.status).toBe(400);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('CPF inválido');
  });

  it('200 — aceita CPF válido (dígito verificador correto)', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.user.create     as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockUser, email: validRegisterBody.email,
    });
    (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue(HASHED_PW);

    // CPF válido gerado por algoritmo mod-11
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegisterBody, cpf: '529.982.247-25' });

    // Validação passou — status não é 400 por causa do CPF
    expect(res.status).not.toBe(400);
  });

  it('400 — rejeita body completamente vazio', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    // Todos os três campos obrigatórios devem ter erro
    const paths = (res.body.errors as { path: string }[]).map(e => e.path);
    expect(paths).toContain('name');
    expect(paths).toContain('email');
    expect(paths).toContain('password');
  });

  // ── Conflito de e-mail (status 409, lógica do controller) ─────────────
  it('409 — retorna "E-mail já cadastrado" quando e-mail já existe', async () => {
    // Simula que o e-mail já está no banco
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue(HASHED_PW);

    const res = await request(app)
      .post('/api/auth/register')
      .send(validRegisterBody);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('E-mail já cadastrado');
    // NÃO deve ter tentado criar o usuário
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

// ==========================================================================
// POST /api/auth/login
// ==========================================================================
describe('POST /api/auth/login', () => {

  // ── Caminho feliz ──────────────────────────────────────────────────────
  it('200 — retorna token para credenciais corretas', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send(validLoginBody);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe(mockUser.email);
  });

  // ── Credenciais inválidas ──────────────────────────────────────────────
  it('401 — rejeita quando usuário não existe', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send(validLoginBody);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciais inválidas');
  });

  it('401 — rejeita senha incorreta', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ ...validLoginBody, password: 'SenhaErrada@1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciais inválidas');
  });

  it('401 — rejeita conta inativa (isActive: false)', async () => {
    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockUser, isActive: false,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send(validLoginBody);

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('suspensa');
  });

  // ── Validações express-validator (status 400) ──────────────────────────
  it('400 — rejeita body vazio (ambos os campos faltando)', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    const paths = (res.body.errors as { path: string }[]).map(e => e.path);
    expect(paths).toContain('email');
    expect(paths).toContain('password');
  });

  it('400 — rejeita e-mail malformado', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'isto-nao-e-email', password: 'SenhaOk@1' });

    expect(res.status).toBe(400);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('E-mail inválido');
  });

  it('400 — rejeita password vazio', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joao@example.com', password: '' });

    expect(res.status).toBe(400);
    const msgs = (res.body.errors as { msg: string }[]).map(e => e.msg);
    expect(msgs).toContain('Senha é obrigatória');
  });

  it('não chama o banco quando a validação falha (email inválido)', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalido', password: 'Senha@123' });

    // validate() bloqueou antes do controller — Prisma nunca foi chamado
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
