import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { createNotification } from '../services/notification.service.js';
import { OrderStatus, NotificationType } from '@prisma/client';

export const getOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', status } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const isClient = req.user!.role === 'CLIENT';
    const isMaker = req.user!.role === 'MAKER';

    let where: Record<string, unknown> = {};
    if (isClient) where['clientId'] = req.user!.id;
    if (isMaker) {
      const maker = await prisma.makerProfile.findUnique({ where: { userId: req.user!.id } });
      if (maker) where['makerId'] = maker.id;
    }
    if (status) where['status'] = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: { select: { name: true, images: true } } } },
          maker: { include: { user: { select: { name: true, avatar: true } } } },
          client: { select: { name: true, email: true, avatar: true } },
          tracking: { orderBy: { createdAt: 'desc' }, take: 1 },
          payment: { select: { status: true, amount: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    paginatedResponse(res, orders, total, parseInt(page), parseInt(limit));
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao buscar pedidos', 500);
  }
};

export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        maker: { include: { user: { select: { name: true, avatar: true, phone: true } } } },
        client: { select: { name: true, email: true, avatar: true, phone: true } },
        address: true,
        tracking: { orderBy: { createdAt: 'asc' } },
        payment: true,
        review: true,
      },
    });

    if (!order) {
      errorResponse(res, 'Pedido não encontrado', 404);
      return;
    }

    const userId = req.user!.id;
    const makerProfile = await prisma.makerProfile.findUnique({ where: { userId } });
    const isOwner = order.clientId === userId || order.maker.userId === userId || req.user!.role === 'ADMIN';
    if (!isOwner) {
      errorResponse(res, 'Acesso negado', 403);
      return;
    }

    void makerProfile;
    successResponse(res, order);
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao buscar pedido', 500);
  }
};

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { makerId, items, addressId, notes } = req.body as {
      makerId: string;
      items: Array<{ productId: string; quantity: number; material?: string; color?: string; notes?: string }>;
      addressId?: string;
      notes?: string;
    };

    const products = await Promise.all(
      items.map((item) => prisma.product.findUnique({ where: { id: item.productId } }))
    );

    const subtotal = items.reduce((sum, item, i) => {
      const product = products[i];
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const order = await prisma.order.create({
      data: {
        clientId: req.user!.id,
        makerId,
        addressId,
        notes,
        subtotal,
        total: subtotal,
        items: {
          create: items.map((item, i) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: products[i]!.price,
            material: item.material,
            color: item.color,
            notes: item.notes,
          })),
        },
        tracking: {
          create: {
            status: 'PENDING',
            description: 'Pedido criado e aguardando confirmação',
          },
        },
      },
      include: { items: true, tracking: true },
    });

    const makerUser = await prisma.makerProfile.findUnique({
      where: { id: makerId },
      include: { user: true },
    });
    if (makerUser) {
      await createNotification(
        makerUser.userId,
        NotificationType.ORDER_UPDATE,
        'Novo pedido recebido',
        `Você recebeu um novo pedido de ${req.user!.name}`
      );
    }

    successResponse(res, order, 'Pedido criado', 201);
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao criar pedido', 500);
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { status, description, location, trackingCode, carrier } = req.body as {
      status: string; description?: string; location?: string; trackingCode?: string; carrier?: string;
    };

    const order = await prisma.order.findUnique({ where: { id }, include: { maker: true } });
    if (!order) {
      errorResponse(res, 'Pedido não encontrado', 404);
      return;
    }

    const isMaker = order.maker.userId === req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isMaker && !isAdmin) {
      errorResponse(res, 'Acesso negado', 403);
      return;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: status as OrderStatus,
        tracking: {
          create: {
            status,
            description: description || `Status atualizado para ${status}`,
            location,
            trackingCode,
            carrier,
          },
        },
      },
    });

    await createNotification(
      order.clientId,
      NotificationType.ORDER_UPDATE,
      'Pedido atualizado',
      `Seu pedido foi atualizado para: ${status}`
    );

    successResponse(res, updated, 'Status atualizado');
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao atualizar pedido', 500);
  }
};
