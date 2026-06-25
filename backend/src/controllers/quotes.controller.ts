import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { createNotification } from '../services/notification.service.js';
import { NotificationType } from '@prisma/client';
import { findNearestMakers } from '../services/geo.service.js';
import logger from '../utils/logger.js';

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

    // notifica makers próximos se coordenadas foram informadas, ou todos os ativos caso contrário
    if (data.latitude && data.longitude) {
      const makers = await prisma.makerProfile.findMany({
        where: { status: 'ACTIVE', latitude: { not: null }, longitude: { not: null } },
        include: { user: true },
      });
      const nearbyMakers = findNearestMakers(
        { latitude: data.latitude, longitude: data.longitude },
        makers.map((m) => ({ id: m.id, latitude: m.latitude!, longitude: m.longitude!, userId: m.userId }))
      );
      for (const maker of nearbyMakers) {
        const full = makers.find((m) => m.id === maker.id);
        if (full) {
          await createNotification(
            full.userId,
            NotificationType.QUOTE_RECEIVED,
            'Nova solicitação de orçamento',
            `Nova solicitação: ${data.title} a ${maker.distance.toFixed(1)}km de você`
          );
        }
      }
    } else {
      const allMakers = await prisma.makerProfile.findMany({
        where: { status: 'ACTIVE' },
        select: { userId: true },
      });
      const location = data.city ? `${data.city}${data.state ? ` - ${data.state}` : ''}` : 'localização não informada';
      for (const maker of allMakers) {
        await createNotification(
          maker.userId,
          NotificationType.QUOTE_RECEIVED,
          'Nova solicitação de orçamento',
          `Nova solicitação: "${data.title}" — ${location}`
        );
      }
    }

    successResponse(res, quoteRequest, 'Solicitação enviada', 201);
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao criar solicitação', 500);
  }
};

export const getQuoteRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', status } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: Record<string, unknown> = { clientId: req.user!.id };
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
            include: { maker: { include: { user: { select: { name: true, avatar: true } } } } },
          },
          _count: { select: { responses: true } },
        },
      }),
      prisma.quoteRequest.count({ where }),
    ]);

    paginatedResponse(res, quotes, total, parseInt(page), parseInt(limit));
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar solicitações', 500);
  }
};

export const getMakerQuotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const makerProfile = await prisma.makerProfile.findUnique({ where: { userId: req.user!.id } });
    if (!makerProfile) {
      errorResponse(res, 'Perfil de maker não encontrado', 404);
      return;
    }

    const myResponses = await prisma.quoteResponse.findMany({
      where: { makerId: makerProfile.id },
      orderBy: { createdAt: 'desc' },
      include: {
        quoteRequest: {
          include: { client: { select: { name: true, email: true, avatar: true } } },
        },
      },
    });

    const respondedIds = myResponses.map((r) => r.quoteRequestId);

    // exclui solicitações que este maker já respondeu
    const openWhere: Record<string, unknown> = {
      status: 'OPEN',
      expiresAt: { gt: new Date() },
    };
    if (respondedIds.length > 0) {
      openWhere['id'] = { notIn: respondedIds };
    }

    const openRequests = await prisma.quoteRequest.findMany({
      where: openWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true, email: true, avatar: true } },
        _count: { select: { responses: true } },
      },
    });

    successResponse(res, { open: openRequests, responded: myResponses });
  } catch (err) {
    logger.error(err);
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
      errorResponse(res, 'Você já respondeu a esta solicitação', 409);
      return;
    }

    if (!deadline || deadline < 2) {
      errorResponse(res, 'O prazo mínimo de entrega é de 2 dias', 422);
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
        status: 'PENDING',
        expiresAt,
      },
    });

    await createNotification(
      quoteRequest.clientId,
      NotificationType.QUOTE_RECEIVED,
      'Nova proposta recebida',
      `${req.user!.name} enviou uma proposta para "${quoteRequest.title}"`
    );

    successResponse(res, response, 'Proposta enviada com sucesso', 201);
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao enviar proposta', 500);
  }
};

export const rejectQuoteRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

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
      errorResponse(res, 'Você já respondeu a esta solicitação', 409);
      return;
    }

    await prisma.quoteResponse.create({
      data: {
        quoteRequestId: id,
        makerId: makerProfile.id,
        price: 0,
        shippingPrice: 0,
        deadline: 0,
        notes: 'Solicitação recusada',
        status: 'REJECTED',
        expiresAt: new Date(),
      },
    });

    const makerUser = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
    await createNotification(
      quoteRequest.clientId,
      NotificationType.SYSTEM,
      'Maker recusou sua solicitação',
      `${makerUser?.name ?? 'Um maker'} não poderá atender sua solicitação "${quoteRequest.title}".`
    );

    successResponse(res, null, 'Solicitação recusada');
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao recusar solicitação', 500);
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

    // impede aceitação dupla da mesma proposta
    const existingOrder = await prisma.order.findUnique({
      where: { quoteId: response.quoteRequestId },
    });
    if (existingOrder) {
      errorResponse(res, 'Já existe um pedido para esta solicitação', 409);
      return;
    }

    // atualiza status da proposta aceita e rejeita as demais em transação atômica
    await prisma.$transaction([
      prisma.quoteResponse.update({ where: { id }, data: { status: 'ACCEPTED' } }),
      prisma.quoteRequest.update({ where: { id: response.quoteRequestId }, data: { status: 'ACCEPTED' } }),
      prisma.quoteResponse.updateMany({
        where: { quoteRequestId: response.quoteRequestId, id: { not: id } },
        data: { status: 'REJECTED' },
      }),
    ]);

    const estimatedAt = new Date();
    estimatedAt.setDate(estimatedAt.getDate() + (response.deadline || 7));

    const order = await prisma.order.create({
      data: {
        clientId:   req.user!.id,
        makerId:    response.makerId,
        quoteId:    response.quoteRequestId,
        subtotal:   response.price,
        shipping:   response.shippingPrice,
        total:      response.price + response.shippingPrice,
        notes:      response.quoteRequest.title,
        estimatedAt,
        status:     'PENDING',
        tracking: {
          create: {
            status:      'PENDING',
            description: `Pedido criado a partir do orçamento "${response.quoteRequest.title}"`,
          },
        },
      },
      select: { id: true, status: true, total: true, createdAt: true },
    });

    await createNotification(
      response.maker.userId,
      NotificationType.QUOTE_ACCEPTED,
      'Proposta aceita — Pedido criado! 🎉',
      `Sua proposta para "${response.quoteRequest.title}" foi aceita. Um pedido foi gerado automaticamente.`
    );

    const rejectedResponses = await prisma.quoteResponse.findMany({
      where: { quoteRequestId: response.quoteRequestId, id: { not: id }, status: 'REJECTED' },
      include: { maker: { select: { userId: true } } },
    });
    for (const r of rejectedResponses) {
      await createNotification(
        r.maker.userId,
        NotificationType.SYSTEM,
        'Proposta não selecionada',
        `O cliente escolheu outra proposta para "${response.quoteRequest.title}". Obrigado por participar!`
      );
    }

    successResponse(res, { response, orderId: order.id }, 'Proposta aceita e pedido criado');
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao aceitar proposta', 500);
  }
};

export const getOpenQuotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10' } = req.query as Record<string, string>;
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

    paginatedResponse(res, quotes, total, parseInt(page), parseInt(limit));
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar orçamentos', 500);
  }
};

export const updateQuoteFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { fileUrl, imageUrl } = req.body as { fileUrl?: string; imageUrl?: string };

    const quote = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!quote || quote.clientId !== req.user!.id) {
      errorResponse(res, 'Orçamento não encontrado', 404); return;
    }
    if (quote.status !== 'OPEN') {
      errorResponse(res, 'Só é possível editar arquivos de orçamentos abertos', 400); return;
    }

    const data: Record<string, string | null> = {};
    if (fileUrl  !== undefined) data['fileUrl']  = fileUrl  || null;
    if (imageUrl !== undefined) data['imageUrl'] = imageUrl || null;

    const updated = await prisma.quoteRequest.update({ where: { id }, data });
    successResponse(res, updated, 'Arquivos atualizados');
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao atualizar arquivos', 500);
  }
};

