import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { createNotification } from '../services/notification.service.js';
import { NotificationType } from '@prisma/client';
import logger from '../utils/logger.js';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, rating, title, comment } = req.body as {
      orderId: string; rating: number; title?: string; comment?: string;
    };

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        maker: true,
        items: { take: 1, include: { product: { select: { id: true } } } },
      },
    });

    if (!order || order.clientId !== req.user!.id || order.status !== 'DELIVERED') {
      errorResponse(res, 'Pedido não disponível para avaliação', 400);
      return;
    }

    const existing = await prisma.review.findUnique({ where: { orderId } });
    if (existing) {
      errorResponse(res, 'Pedido já avaliado', 409);
      return;
    }

    // Pega o produto do primeiro item do pedido (se existir)
    const productId = order.items[0]?.product?.id ?? null;

    const review = await prisma.review.create({
      data: {
        orderId,
        makerId:   order.makerId,
        clientId:  req.user!.id,
        productId: productId ?? undefined,
        rating,
        title,
        comment,
      },
    });

    // Atualiza rating do maker
    const makerAgg = await prisma.review.aggregate({
      where: { makerId: order.makerId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.makerProfile.update({
      where: { id: order.makerId },
      data: {
        rating:       makerAgg._avg.rating || 0,
        totalReviews: makerAgg._count,
      },
    });

    // Atualiza rating do produto (se tiver productId)
    if (productId) {
      const productAgg = await prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: true,
      });

      await prisma.product.update({
        where: { id: productId },
        data: {
          rating:       productAgg._avg.rating || 0,
          totalReviews: productAgg._count,
        },
      });
    }

    await createNotification(
      order.maker.userId,
      NotificationType.REVIEW_RECEIVED,
      'Nova avaliação recebida',
      `${req.user!.name} avaliou seu serviço com ${rating} estrelas`
    );

    successResponse(res, review, 'Avaliação enviada', 201);
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao criar avaliação', 500);
  }
};
