import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { findNearestMakers } from '../services/geo.service.js';
import logger from '../utils/logger.js';

export const getMakers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1', limit = '12', search, city, state,
      latitude, longitude, sortBy = 'rating', order = 'desc',
    } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: Record<string, unknown> = { status: 'ACTIVE' };

    if (search) where['OR'] = [
      { user: { name: { contains: search } } },
      { companyName: { contains: search } },
    ];
    if (city) where['city'] = { contains: city };
    if (state) where['state'] = state;

    if (latitude && longitude) {
      const allMakers = await prisma.makerProfile.findMany({
        where: { status: 'ACTIVE', latitude: { not: null }, longitude: { not: null } },
        include: { user: { select: { name: true, avatar: true, email: true } } },
      });

      const withDistance = findNearestMakers(
        { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
        allMakers.map((m) => ({ ...m, latitude: m.latitude!, longitude: m.longitude! }))
      );

      const total = withDistance.length;
      const paginated = withDistance.slice(skip, skip + parseInt(limit));
      paginatedResponse(res, paginated, total, parseInt(page), parseInt(limit));
      return;
    }

    const [makers, total] = await Promise.all([
      prisma.makerProfile.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
        include: { user: { select: { name: true, avatar: true } } },
      }),
      prisma.makerProfile.count({ where }),
    ]);

    paginatedResponse(res, makers, total, parseInt(page), parseInt(limit));
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar makers', 500);
  }
};

export const getMaker = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const maker = await prisma.makerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, avatar: true, createdAt: true } },
        products: {
          where: { isActive: true },
          take: 8,
          orderBy: { totalSales: 'desc' },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { client: { select: { name: true, avatar: true } } },
        },
        _count: { select: { products: true, reviews: true, ordersAsMaker: true } },
      },
    });

    if (!maker || maker.status !== 'ACTIVE') {
      errorResponse(res, 'Maker não encontrado', 404);
      return;
    }

    successResponse(res, maker);
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar maker', 500);
  }
};

export const updateMakerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      companyName, bio, website, instagram,
      city, state, printers, materials, maxBuildVolume,
      latitude, longitude, selfieUrl, documentUrl, documentBackUrl,
    } = req.body as Record<string, unknown>;

    const data: Record<string, unknown> = {};
    if (companyName   !== undefined) data['companyName']   = companyName;
    if (bio           !== undefined) data['bio']           = bio;
    if (website       !== undefined) data['website']       = website;
    if (instagram     !== undefined) data['instagram']     = instagram;
    if (city          !== undefined) data['city']          = city;
    if (state         !== undefined) data['state']         = state;
    if (printers      !== undefined) data['printers']      = printers;
    if (materials     !== undefined) data['materials']     = materials;
    if (maxBuildVolume!== undefined) data['maxBuildVolume']= maxBuildVolume;
    if (latitude      !== undefined) data['latitude']      = latitude;
    if (longitude     !== undefined) data['longitude']     = longitude;
    if (selfieUrl        !== undefined) data['selfieUrl']        = selfieUrl;
    if (documentUrl      !== undefined) data['documentUrl']      = documentUrl;
    if (documentBackUrl  !== undefined) data['documentBackUrl']  = documentBackUrl;
    // reenvio de documentos volta o kycStatus para PENDING e limpa a nota de correção
    if (selfieUrl || documentUrl || documentBackUrl) {
      data['kycStatus'] = 'PENDING';
      data['kycNote']   = null;
    }

    const maker = await prisma.makerProfile.update({
      where: { userId: req.user!.id },
      data,
    });

    successResponse(res, maker, 'Perfil atualizado');
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao atualizar perfil', 500);
  }
};

export const getMakerDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const maker = await prisma.makerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!maker) {
      errorResponse(res, 'Perfil não encontrado', 404);
      return;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [orders, pendingOrders, monthRevenue, products, openQuotes, recentReviews] = await Promise.all([
      prisma.order.count({ where: { makerId: maker.id } }),
      prisma.order.count({ where: { makerId: maker.id, status: { in: ['PENDING', 'CONFIRMED', 'PRINTING'] } } }),
      prisma.order.aggregate({
        where: { makerId: maker.id, status: 'DELIVERED', createdAt: { gte: thirtyDaysAgo } },
        _sum: { total: true },
      }),
      prisma.product.count({ where: { makerId: maker.id, isActive: true } }),
      prisma.quoteRequest.count({ where: { status: 'OPEN', expiresAt: { gt: now } } }),
      prisma.review.findMany({
        where: { makerId: maker.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { name: true, avatar: true } } },
      }),
    ]);

    successResponse(res, {
      stats: {
        totalOrders: orders,
        pendingOrders,
        monthRevenue: monthRevenue._sum.total || 0,
        totalProducts: products,
        openQuotes,
        rating: maker.rating,
        totalReviews: maker.totalReviews,
        balance: maker.balanceAvail,
      },
      recentReviews,
    });
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar dashboard', 500);
  }
};

export const getMakerReviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const maker = await prisma.makerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!maker) {
      errorResponse(res, 'Perfil não encontrado', 404);
      return;
    }

    const [reviews, total, distribution] = await Promise.all([
      prisma.review.findMany({
        where: { makerId: maker.id },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          client:  { select: { name: true, avatar: true } },
          product: { select: { name: true } },
        },
      }),
      prisma.review.count({ where: { makerId: maker.id } }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { makerId: maker.id },
        _count: { rating: true },
      }),
    ]);

    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => { ratingCounts[d.rating] = d._count.rating; });

    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
      summary: {
        rating: maker.rating,
        totalReviews: maker.totalReviews,
        ratingCounts,
      },
    });
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar avaliações', 500);
  }
};
