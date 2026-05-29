import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { createNotification } from '../services/notification.service.js';
import { NotificationType } from '@prisma/client';
import { findNearestMakers } from '../services/geo.service.js';

export const createQuoteRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = req.body as {
      title: string; description: string; width?: number; height?: number;
      depth?: number; material?: string; resistance?: string; quantity?: number;
      fileUrl?: string; imageUrl?: string; budget?: number; deadline?: string;
      latitude?: number; longitude?: number; city?: string; state?: string;
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        ...data,
        clientId: req.user!.id,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
        expiresAt,
      },
    });

    // Notify nearby makers
    if (data.latitude && data.longitude) {
      const makers = await prisma.makerProfile.findMany({
        where: { status: 'ACTIVE', latitude: { not: null }, longitude: { not: null } },
        include: { user: true },
      });

      const nearbyMakers = findNearestMakers(
        { latitude: data.latitude, longitude: data.longitude },
        makers.map((m) => ({
          id: m.id,
          latitude: m.latitude!,
          longitude: m.longitude!,
          userId: m.userId,
        }))
      );

      for (const maker of nearbyMakers) {
        const makerFull = makers.find((m) => m.id === maker.id);
        if (makerFull) {
          await createNotification(
            makerFull.userId,
            NotificationType.QUOTE_RECEIVED,
            'Nova solicitação de orçamento',
            `Nova solicitação: ${data.title} a ${maker.distance.toFixed(1)}km de você`
          );
        }
      }
    }

    successResponse(res, quoteRequest, 'Solicitação enviada', 201);
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao criar solicitação', 500);
  }
};

export const getQuoteRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', status } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where: Record<string, unknown> = {};
    if (req.user!.role === 'CLIENT') where['clientId'] = req.user!.id;
    if (status) where['status'] = status;

    const [quotes, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true, avatar: true } },
          responses: {
            include: {
              maker: { include: { user: { select: { name: true, avatar: true } } } },
            },
          },
          _count: { select: { responses: true } },
        },
      }),
      prisma.quoteRequest.count({ where }),
    ]);

    paginatedResponse(res, quotes, total, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao buscar solicitações', 500);
  }
};

export const getOpenQuotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', latitude, longitude } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [quotes, total] = await Promise.all([
      prisma.quoteRequest.findMany({
        where: { status: 'OPEN', expiresAt: { gt: new Date() } },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true, avatar: true } },
          _count: { select: { responses: true } },
        },
      }),
      prisma.quoteRequest.count({ where: { status: 'OPEN', expiresAt: { gt: new Date() } } }),
    ]);

    void latitude;
    void longitude;
    paginatedResponse(res, quotes, total, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao buscar orçamentos', 500);
  }
};

export const respondToQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { price, shippingPrice, deadline, notes } = req.body as {
      price: number; shippingPrice?: number; deadline: number; notes?: string;
    };

    const makerProfile = await prisma.makerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!makerProfile || makerProfile.status !== 'ACTIVE') {
      errorResponse(res, 'Perfil de maker não ativo', 403);
      return;
    }

    const quoteRequest = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!quoteRequest || quoteRequest.status !== 'OPEN') {
      errorResponse(res, 'Solicitação não disponível', 404);
      return;
    }

    const existing = await prisma.quoteResponse.findFirst({
      where: { quoteRequestId: id, makerId: makerProfile.id },
    });
    if (existing) {
      errorResponse(res, 'Você já enviou uma proposta para esta solicitação', 409);
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);

    const response = await prisma.quoteResponse.create({
      data: {
        quoteRequestId: id,
        makerId: makerProfile.id,
        price,
        shippingPrice: shippingPrice || 0,
        deadline,
        notes,
        expiresAt,
      },
    });

    await createNotification(
      quoteRequest.clientId,
      NotificationType.QUOTE_RECEIVED,
      'Nova proposta recebida',
      `${req.user!.name} enviou uma proposta para sua solicitação`
    );

    successResponse(res, response, 'Proposta enviada', 201);
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao enviar proposta', 500);
  }
};

export const acceptQuoteResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const response = await prisma.quoteResponse.findUnique({
      where: { id },
      include: { quoteRequest: true, maker: { include: { user: true } } },
    });

    if (!response || response.quoteRequest.clientId !== req.user!.id) {
      errorResponse(res, 'Proposta não encontrada', 404);
      return;
    }

    await prisma.$transaction([
      prisma.quoteResponse.update({ where: { id }, data: { status: 'ACCEPTED' } }),
      prisma.quoteRequest.update({ where: { id: response.quoteRequestId }, data: { status: 'ACCEPTED' } }),
      prisma.quoteResponse.updateMany({
        where: { quoteRequestId: response.quoteRequestId, id: { not: id } },
        data: { status: 'REJECTED' },
      }),
    ]);

    await createNotification(
      response.maker.userId,
      NotificationType.QUOTE_ACCEPTED,
      'Proposta aceita!',
      `Sua proposta para "${response.quoteRequest.title}" foi aceita!`
    );

    successResponse(res, response, 'Proposta aceita');
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao aceitar proposta', 500);
  }
};
