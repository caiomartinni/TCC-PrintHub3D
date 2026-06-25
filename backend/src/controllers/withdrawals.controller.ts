import { Response } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import logger from '../utils/logger.js';

// ── Solicitar saque ───────────────────────────────────────────────────────────
export const requestWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, pixKey, pixKeyType } = req.body as {
      amount: number;
      pixKey: string;
      pixKeyType: string;
    };

    if (!pixKey?.trim() || !pixKeyType) {
      errorResponse(res, 'Informe a chave PIX e o tipo.', 400); return;
    }
    if (!amount || amount <= 0) {
      errorResponse(res, 'Informe um valor válido para o saque.', 400); return;
    }

    const maker = await prisma.makerProfile.findUnique({
      where: { userId: req.user!.id },
      select: { id: true, balanceAvail: true },
    });

    if (!maker) { errorResponse(res, 'Perfil de maker não encontrado.', 404); return; }

    if (amount > maker.balanceAvail) {
      errorResponse(
        res,
        `Saldo insuficiente. Seu saldo disponível é R$ ${maker.balanceAvail.toFixed(2).replace('.', ',')}.`,
        400
      );
      return;
    }

    const id = randomUUID();

    // Cria a solicitação e debita o saldo em transação
    await prisma.$transaction([
      prisma.$queryRawUnsafe(
        `INSERT INTO withdrawal_requests (id, makerId, amount, pixKey, pixKeyType, status)
         VALUES (?, ?, ?, ?, ?, 'PENDING')`,
        id, maker.id, amount, pixKey.trim(), pixKeyType
      ) as never,
      prisma.makerProfile.update({
        where: { id: maker.id },
        data: {
          balanceAvail:   { decrement: amount },
          balancePending: { increment: amount },
        },
      }),
    ]);

    successResponse(res, { id }, 'Solicitação de saque registrada! Processaremos em até 2 dias úteis.');
  } catch (err) {
    logger.error(err, '[requestWithdrawal]');
    errorResponse(res, 'Erro ao solicitar saque. Tente novamente.', 500);
  }
};

// ── Histórico de saques do maker ─────────────────────────────────────────────
export const getWithdrawals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const maker = await prisma.makerProfile.findUnique({
      where: { userId: req.user!.id },
      select: { id: true, balanceAvail: true, balancePending: true },
    });
    if (!maker) { errorResponse(res, 'Perfil não encontrado.', 404); return; }

    type WRow = {
      id: string; amount: number; pixKey: string;
      pixKeyType: string; status: string; createdAt: Date;
    };
    const history = await prisma.$queryRawUnsafe<WRow[]>(
      'SELECT id, amount, pixKey, pixKeyType, status, createdAt FROM withdrawal_requests WHERE makerId = ? ORDER BY createdAt DESC LIMIT 10',
      maker.id
    );

    successResponse(res, {
      balanceAvail:   maker.balanceAvail,
      balancePending: maker.balancePending,
      history,
    });
  } catch (err) {
    logger.error(err, '[getWithdrawals]');
    errorResponse(res, 'Erro ao buscar saques.', 500);
  }
};
