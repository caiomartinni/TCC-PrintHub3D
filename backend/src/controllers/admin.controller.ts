import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';

export const getDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [users, makers, orders, revenue, pendingMakers] = await Promise.all([
      prisma.user.count(),
      prisma.makerProfile.count({ where: { status: 'ACTIVE' } }),
      prisma.order.count(),
      prisma.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { total: true } }),
      prisma.makerProfile.count({ where: { status: 'PENDING' } }),
    ]);

    successResponse(res, {
      users, makers, orders,
      revenue: revenue._sum.total || 0,
      pendingMakers,
    });
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao buscar dashboard', 500);
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, role } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = {};
    if (search) where['OR'] = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];
    if (role) where['role'] = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        omit: { password: true },
        include: { makerProfile: { select: { status: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    paginatedResponse(res, users, total, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao buscar usuários', 500);
  }
};

export const approveMaker = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { action } = req.body as { action: 'approve' | 'reject' };

    const maker = await prisma.makerProfile.update({
      where: { id },
      data: { status: action === 'approve' ? 'ACTIVE' : 'REJECTED' },
      include: { user: true },
    });

    successResponse(res, maker, `Maker ${action === 'approve' ? 'aprovado' : 'rejeitado'}`);
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao atualizar maker', 500);
  }
};

export const toggleUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      errorResponse(res, 'Usuário não encontrado', 404);
      return;
    }
    await prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
    successResponse(res, null, `Usuário ${user.isActive ? 'desativado' : 'ativado'}`);
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao atualizar usuário', 500);
  }
};
