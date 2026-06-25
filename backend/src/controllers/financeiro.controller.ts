import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import logger from '../utils/logger.js';

// ── Resumo financeiro ────────────────────────────────────────────────────────
export const getResumo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const maker = await prisma.makerProfile.findUnique({
      where: { userId: req.user!.id },
      select: { id: true, balanceAvail: true },
    });
    if (!maker) { errorResponse(res, 'Perfil de maker não encontrado.', 404); return; }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [receitaMes, totalSacado] = await Promise.all([
      prisma.order.aggregate({
        where: { makerId: maker.id, status: 'DELIVERED', createdAt: { gte: thirtyDaysAgo } },
        _sum: { total: true },
      }),
      prisma.saque.aggregate({
        where: { makerId: maker.id, status: 'CONCLUIDO' },
        _sum: { valor: true },
      }),
    ]);

    successResponse(res, {
      saldoDisponivel: maker.balanceAvail,
      receitaMes: receitaMes._sum.total || 0,
      totalSacado: totalSacado._sum.valor || 0,
    });
  } catch (err) {
    logger.error(err, '[getResumo]');
    errorResponse(res, 'Erro ao buscar resumo financeiro.', 500);
  }
};

// ── Histórico de saques concluídos ───────────────────────────────────────────
export const getSaques = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const maker = await prisma.makerProfile.findUnique({
      where: { userId: req.user!.id },
      select: { id: true },
    });
    if (!maker) { errorResponse(res, 'Perfil de maker não encontrado.', 404); return; }

    const { page = '1', limit = '5' } = req.query as Record<string, string>;
    const where = { makerId: maker.id, status: 'CONCLUIDO' as const };

    const [saques, total] = await Promise.all([
      prisma.saque.findMany({
        where,
        orderBy: { dataConclusao: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        select: {
          id: true,
          banco: true,
          ultimosDigitos: true,
          valor: true,
          dataConclusao: true,
          status: true,
        },
      }),
      prisma.saque.count({ where }),
    ]);

    paginatedResponse(res, saques, total, parseInt(page), parseInt(limit));
  } catch (err) {
    logger.error(err, '[getSaques]');
    errorResponse(res, 'Erro ao buscar saques.', 500);
  }
};
