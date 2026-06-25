/**
 * Testes unitários — helpers de response.ts
 *
 * Não precisa de banco, servidor nem rede. Cria um objeto Response mock
 * com os métodos que os helpers chamam (.status, .json) e verifica que
 * os payloads e status codes seguem o contrato da API.
 */

import { describe, it, expect, vi } from 'vitest';
import type { Response } from 'express';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/response';

// --------------------------------------------------------------------------
// Helper: cria um mock mínimo de Response compatível com os helpers
// --------------------------------------------------------------------------
function makeMockRes(): Response {
  const res = {
    status: vi.fn(),
    json:   vi.fn(),
  } as unknown as Response;
  // .status() precisa retornar o próprio res para o chain .status(x).json(y)
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res;
}

// ==========================================================================
// successResponse
// ==========================================================================
describe('successResponse', () => {
  it('retorna status 200 e success:true por padrão', () => {
    const res = makeMockRes();
    successResponse(res, { id: '1' });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Success',
      data: { id: '1' },
    });
  });

  it('aceita mensagem e status personalizados', () => {
    const res = makeMockRes();
    successResponse(res, null, 'Criado com sucesso', 201);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Criado com sucesso',
      data: null,
    });
  });

  it('aceita arrays como data', () => {
    const res = makeMockRes();
    successResponse(res, [1, 2, 3], 'Lista');

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: [1, 2, 3] }),
    );
  });
});

// ==========================================================================
// errorResponse
// ==========================================================================
describe('errorResponse', () => {
  it('retorna status 400 e success:false por padrão', () => {
    const res = makeMockRes();
    errorResponse(res, 'Dados inválidos');

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Dados inválidos',
      errors: null,
    });
  });

  it('errors é null quando não fornecido', () => {
    const res = makeMockRes();
    errorResponse(res, 'Erro');
    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload.errors).toBeNull();
  });

  it('inclui o array de errors quando fornecido', () => {
    const res = makeMockRes();
    const erros = [{ path: 'email', msg: 'E-mail inválido' }];
    errorResponse(res, 'Inválido', 422, erros);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Inválido',
      errors: erros,
    });
  });

  it('aceita status 401 (não autenticado)', () => {
    const res = makeMockRes();
    errorResponse(res, 'Token expirado', 401);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('aceita status 409 (conflito)', () => {
    const res = makeMockRes();
    errorResponse(res, 'E-mail já cadastrado', 409);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

// ==========================================================================
// paginatedResponse
// ==========================================================================
describe('paginatedResponse', () => {
  it('retorna sempre status 200', () => {
    const res = makeMockRes();
    paginatedResponse(res, [], 0, 1, 10);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('inclui os campos de paginação corretos', () => {
    const res = makeMockRes();
    paginatedResponse(res, [{ id: 1 }], 100, 2, 10);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Success',
      data: [{ id: 1 }],
      pagination: { total: 100, page: 2, limit: 10, pages: 10 },
    });
  });

  it('calcula pages com divisão de teto (ceil)', () => {
    const res = makeMockRes();
    paginatedResponse(res, [], 25, 1, 10);

    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload.pagination.pages).toBe(3); // ceil(25/10) = 3
  });

  it('retorna pages:0 quando total é 0', () => {
    const res = makeMockRes();
    paginatedResponse(res, [], 0, 1, 10);

    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload.pagination.pages).toBe(0);
  });

  it('aceita mensagem personalizada', () => {
    const res = makeMockRes();
    paginatedResponse(res, [], 0, 1, 10, 'Produtos encontrados');

    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload.message).toBe('Produtos encontrados');
  });
});
