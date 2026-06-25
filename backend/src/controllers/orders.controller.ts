import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { createNotification } from '../services/notification.service.js';
import { OrderStatus, NotificationType } from '@prisma/client';
import logger from '../utils/logger.js';

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
          items:    { include: { product: { select: { name: true, images: true } } } },
          maker:    { include: { user: { select: { name: true, avatar: true } } } },
          client:   { select: { name: true, email: true, avatar: true } },
          tracking: { orderBy: { createdAt: 'desc' }, take: 1 },
          payment:  { select: { status: true, amount: true } },
          review:   { select: { id: true, rating: true } },
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
    logger.error(err);
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

    const missing = items.filter((_, i) => !products[i]);
    if (missing.length > 0) {
      errorResponse(res, `Produto não encontrado no banco de dados. Atualize o carrinho e tente novamente.`, 422);
      return;
    }

    const outOfStock = items.filter((item, i) => {
      const p = products[i];
      return p && p.stock < item.quantity;
    });
    if (outOfStock.length > 0) {
      errorResponse(res, 'Um ou mais produtos não têm estoque suficiente.', 422);
      return;
    }

    const makerProfile = await prisma.makerProfile.findUnique({ where: { id: makerId } });
    if (!makerProfile) {
      errorResponse(res, 'Maker não encontrado. Atualize o carrinho e tente novamente.', 422);
      return;
    }

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

    await Promise.all(
      items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      )
    );

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
    logger.error(err);
    errorResponse(res, 'Erro ao criar pedido', 500);
  }
};

const STATUS_PT: Record<string, string> = {
  PENDING:       'Aguardando pagamento',
  CONFIRMED:     'Confirmado',
  PRINTING:      'Em impressão',
  QUALITY_CHECK: 'Controle de qualidade',
  SHIPPED:       'Enviado',
  DELIVERED:     'Entregue',
  CANCELLED:     'Cancelado',
  REFUNDED:      'Reembolsado',
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { status, description, location, trackingCode, carrier } = req.body as {
      status: string; description?: string; location?: string; trackingCode?: string; carrier?: string;
    };

    const order = await prisma.order.findUnique({
      where: { id },
      include: { maker: true, payment: { select: { status: true } } },
    });
    if (!order) {
      errorResponse(res, 'Pedido não encontrado', 404);
      return;
    }

    const isMaker  = order.maker.userId === req.user!.id;
    const isClient = order.clientId === req.user!.id;
    const isAdmin  = req.user!.role === 'ADMIN';

    // cliente só pode confirmar recebimento (DELIVERED)
    if (isClient && status !== 'DELIVERED') {
      errorResponse(res, 'Acesso negado', 403);
      return;
    }
    // maker não pode confirmar entrega — essa ação é exclusiva do cliente
    if (isMaker && status === 'DELIVERED') {
      errorResponse(res, 'Apenas o cliente pode confirmar o recebimento do pedido', 403);
      return;
    }
    if (!isMaker && !isClient && !isAdmin) {
      errorResponse(res, 'Acesso negado', 403);
      return;
    }

    // maker não pode avançar o status sem pagamento confirmado (exceto cancelamento)
    const progressStatuses = ['CONFIRMED', 'PRINTING', 'QUALITY_CHECK', 'SHIPPED'];
    if (isMaker && progressStatuses.includes(status)) {
      const paymentPaid = order.payment?.status === 'PAID';
      if (!paymentPaid) {
        errorResponse(
          res,
          'Pagamento pendente. Aguarde a confirmação do pagamento do cliente antes de prosseguir com o pedido.',
          402
        );
        return;
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: status as OrderStatus,
        deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
        tracking: {
          create: {
            status,
            description: description || `Status atualizado para: ${STATUS_PT[status] ?? status}`,
            location,
            trackingCode,
            carrier,
          },
        },
      },
      include: { items: true },
    });

    if (status === 'DELIVERED') {
      // maker recebe 90% do pedido; plataforma retém 10%
      const makerAmount = parseFloat((order.total * 0.90).toFixed(2));
      await Promise.all([
        ...updated.items.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: { totalSales: { increment: item.quantity } },
          })
        ),
        prisma.makerProfile.update({
          where: { id: order.makerId },
          data: {
            totalOrders:  { increment: 1 },
            balanceAvail: { increment: makerAmount },
          },
        }),
      ]);
    }

    // cancelamento ou reembolso devolve o estoque dos produtos
    if (status === 'CANCELLED' || status === 'REFUNDED') {
      await Promise.all(
        updated.items.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        )
      );
    }

    if (isClient) {
      const makerUserId = order.maker.userId;
      const shortId = order.id.slice(-8).toUpperCase();
      await createNotification(
        makerUserId,
        NotificationType.ORDER_UPDATE,
        'Entrega confirmada',
        `O cliente confirmou o recebimento do Pedido #${shortId}`
      );
    } else {
      await createNotification(
        order.clientId,
        NotificationType.ORDER_UPDATE,
        'Pedido atualizado',
        `Seu pedido foi atualizado para: ${STATUS_PT[status] ?? status}`
      );
    }

    successResponse(res, updated, 'Status atualizado');
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao atualizar pedido', 500);
  }
};
