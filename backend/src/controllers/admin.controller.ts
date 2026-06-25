import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import logger from '../utils/logger.js';

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const getDashboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers, newUsersMonth,
      totalMakers, pendingMakers,
      totalOrders, ordersMonth,
      revenueResult, revenueMonthResult,
      totalProducts,
      pendingMakersList,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.makerProfile.count({ where: { status: 'ACTIVE' } }),
      prisma.makerProfile.count({ where: { status: 'PENDING' } }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'PAID', createdAt: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.product.count({ where: { isActive: true } }),
      // Pending makers with user info
      prisma.makerProfile.findMany({
        where: { status: 'PENDING' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
      }),
      // Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true } },
          maker:  { include: { user: { select: { name: true } } } },
          items:  { take: 1, include: { product: { select: { name: true } } } },
        },
      }),
    ]);

    successResponse(res, {
      totalUsers, newUsersMonth,
      totalMakers, pendingMakers,
      totalOrders, ordersMonth,
      totalRevenue:      revenueResult._sum.amount || 0,
      revenueMonth:      revenueMonthResult._sum.amount || 0,
      totalProducts,
      pendingMakersList,
      recentOrders,
    });
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar dashboard', 500);
  }
};

// ── USERS ─────────────────────────────────────────────────────────────────────
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, role } = req.query as Record<string, string>;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};
    if (search) where['OR'] = [{ name: { contains: search } }, { email: { contains: search } }];
    if (role)   where['role'] = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
        omit: { password: true },
        include: {
          makerProfile: { select: { id: true, status: true, companyName: true, rating: true } },
          _count: { select: { ordersAsClient: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);
    paginatedResponse(res, users, total, parseInt(page), parseInt(limit));
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar usuários', 500);
  }
};

export const toggleUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) { errorResponse(res, 'Usuário não encontrado', 404); return; }
    await prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
    successResponse(res, null, `Usuário ${user.isActive ? 'desativado' : 'ativado'}`);
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao atualizar usuário', 500);
  }
};

// ── MAKERS ────────────────────────────────────────────────────────────────────
export const getMakers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', status, search } = req.query as Record<string, string>;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (search) where['OR'] = [
      { companyName: { contains: search } },
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } },
    ];

    const [makers, total] = await Promise.all([
      prisma.makerProfile.findMany({
        where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
          _count: { select: { products: true, ordersAsMaker: true } },
        },
      }),
      prisma.makerProfile.count({ where }),
    ]);

    // Fetch documentBackUrl via raw query (field added after Prisma client generation)
    const makerIds = makers.map(m => m.id);
    let backUrls: Record<string, string> = {};
    if (makerIds.length > 0) {
      type RawRow = { id: string; documentBackUrl: string | null };
      const rows = await prisma.$queryRawUnsafe<RawRow[]>(
        `SELECT id, documentBackUrl FROM maker_profiles WHERE id IN (${makerIds.map(() => '?').join(',')})`,
        ...makerIds
      );
      backUrls = Object.fromEntries(rows.map(r => [r.id, r.documentBackUrl ?? '']));
    }

    const enriched = makers.map(m => ({ ...m, documentBackUrl: backUrls[m.id] || null }));

    paginatedResponse(res, enriched, total, parseInt(page), parseInt(limit));
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar makers', 500);
  }
};

export const updateMakerStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { action } = req.body as { action: 'approve' | 'reject' | 'suspend' | 'reactivate' };

    const statusMap: Record<string, 'ACTIVE' | 'REJECTED' | 'SUSPENDED'> = {
      approve:    'ACTIVE',
      reject:     'REJECTED',
      suspend:    'SUSPENDED',
      reactivate: 'ACTIVE',
    };
    const newMakerStatus = statusMap[action];
    if (!newMakerStatus) { errorResponse(res, 'Ação inválida', 400); return; }

    // Determine whether the USER account should be active
    // suspend  → block the user immediately (isActive = false)
    // reject   → block the user (isActive = false)
    // approve / reactivate → restore access (isActive = true)
    const userShouldBeActive = action === 'approve' || action === 'reactivate';

    // Find maker to get userId
    const makerProfile = await prisma.makerProfile.findUnique({ where: { id }, select: { userId: true } });
    if (!makerProfile) { errorResponse(res, 'Maker não encontrado', 404); return; }

    // Map maker status to kycStatus
    const kycMap: Record<string, string> = {
      approve:    'APPROVED',
      reject:     'REJECTED',
      suspend:    'PENDING',   // keep pending when suspended
      reactivate: 'PENDING',  // back to pending when reactivated
    };

    // Update both MakerProfile and User in a single transaction
    const [maker] = await prisma.$transaction([
      prisma.makerProfile.update({
        where: { id },
        data:  { status: newMakerStatus, kycStatus: kycMap[action] ?? 'PENDING', kycNote: null },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.user.update({
        where: { id: makerProfile.userId },
        data:  { isActive: userShouldBeActive },
      }),
    ]);

    const messages: Record<string, string> = {
      approve:    'Maker aprovado — conta ativada',
      reject:     'Maker rejeitado — conta bloqueada',
      suspend:    'Maker suspenso — acesso bloqueado imediatamente',
      reactivate: 'Maker reativado — acesso restaurado',
    };

    successResponse(res, maker, messages[action] ?? 'Status atualizado');
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao atualizar maker', 500);
  }
};

// ── ORDERS ────────────────────────────────────────────────────────────────────
export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', status, search } = req.query as Record<string, string>;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (search) where['OR'] = [
      { client: { name: { contains: search } } },
      { client: { email: { contains: search } } },
      { notes: { contains: search } },
    ];

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true, email: true, avatar: true } },
          maker:  { include: { user: { select: { name: true } } } },
          items:  { take: 1, include: { product: { select: { name: true } } } },
          payment: { select: { status: true, amount: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);
    paginatedResponse(res, orders, total, parseInt(page), parseInt(limit));
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar pedidos', 500);
  }
};

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, active } = req.query as Record<string, string>;
    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = {};
    if (search) where['OR'] = [{ name: { contains: search } }, { description: { contains: search } }];
    if (active !== undefined) where['isActive'] = active === 'true';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
        include: {
          maker:    { include: { user: { select: { name: true } } } },
          category: { select: { name: true } },
          _count:   { select: { favorites: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);
    paginatedResponse(res, products, total, parseInt(page), parseInt(limit));
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar produtos', 500);
  }
};

export const toggleProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const prod = await prisma.product.findUnique({ where: { id }, select: { isActive: true, name: true } });
    if (!prod) { errorResponse(res, 'Produto não encontrado', 404); return; }
    await prisma.product.update({ where: { id }, data: { isActive: !prod.isActive } });
    successResponse(res, null, `Produto "${prod.name}" ${prod.isActive ? 'ocultado' : 'reativado'}`);
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao atualizar produto', 500);
  }
};

// ── REQUEST KYC CORRECTION ────────────────────────────────────────────────────
export const requestKycCorrection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id }   = req.params as { id: string };
    const { note, files } = req.body as { note: string; files?: string[] };

    if (!note?.trim()) { errorResponse(res, 'Informe o que precisa ser corrigido', 400); return; }

    // Store note + required files as JSON so the maker UI can parse which uploads to show
    const kycNote = JSON.stringify({ note: note.trim(), files: files ?? [] });

    await prisma.makerProfile.update({
      where: { id },
      data:  { kycStatus: 'CORRECTION_NEEDED', kycNote },
    });

    successResponse(res, null, 'Solicitação de correção enviada ao maker');
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao solicitar correção', 500);
  }
};

// Keep backward compat
export const approveMaker = updateMakerStatus;
