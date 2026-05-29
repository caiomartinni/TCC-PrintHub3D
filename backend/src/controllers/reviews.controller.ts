import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { createNotification } from '../services/notification.service.js';
import { NotificationType } from '@prisma/client';

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, rating, title, comment } = req.body as {
      orderId: string; rating: number; title?: string; comment?: string;
    };

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { maker: true },
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

    const review = await prisma.review.create({
      data: {
        orderId,
        makerId: order.makerId,
        clientId: req.user!.id,
        rating,
        title,
        comment,
      },
    });

    const reviews = await prisma.review.aggregate({
      where: { makerId: order.makerId },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.makerProfile.update({
      where: { id: order.makerId },
      data: {
        rating: reviews._avg.rating || 0,
        totalReviews: reviews._count,
      },
    });

    await createNotification(
      order.maker.userId,
      NotificationType.REVIEW_RECEIVED,
      'Nova avaliação recebida',
      `${req.user!.name} avaliou seu serviço com ${rating} estrelas`
    );

    successResponse(res, review, 'Avaliação enviada', 201);
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao criar avaliação', 500);
  }
};
