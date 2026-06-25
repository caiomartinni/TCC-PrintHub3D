import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { createNotification } from '../services/notification.service.js';
import { NotificationType } from '@prisma/client';
import logger from '../utils/logger.js';

// valida acesso ao pedido e resolve o userId do maker
async function resolveChat(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { maker: { select: { userId: true } } },
  });
  if (!order) return null;

  const makerUserId = order.maker.userId;
  const isParticipant = order.clientId === userId || makerUserId === userId;
  if (!isParticipant) return null;

  return { order, makerUserId };
}

export const getOrCreateChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params as { orderId: string };
    const userId = req.user!.id;

    const ctx = await resolveChat(orderId, userId);
    if (!ctx) {
      errorResponse(res, 'Pedido não encontrado ou acesso negado', 403);
      return;
    }

    // upsert garante atomicidade e evita race condition na primeira abertura do chat
    const includeShape = {
      messages: {
        include: { sender: { select: { id: true, name: true, avatar: true, role: true } } },
        orderBy: { createdAt: 'asc' as const },
      },
      order: {
        include: {
          client: { select: { id: true, name: true, avatar: true } },
          maker:  { include: { user: { select: { id: true, name: true, avatar: true } } } },
          items:  { select: { id: true, quantity: true, product: { select: { name: true } } }, take: 1 },
        },
      },
    };

    const chat = await prisma.chat.upsert({
      where:  { orderId },
      update: {},
      create: { orderId },
      include: includeShape,
    });

    await prisma.message.updateMany({
      where: { chatId: chat.id, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    successResponse(res, chat);
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao abrir conversa', 500);
  }
};

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params as { chatId: string };
    const userId = req.user!.id;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { order: { include: { maker: { select: { userId: true } } } } },
    });
    if (!chat) { errorResponse(res, 'Conversa não encontrada', 404); return; }

    const makerUserId = chat.order.maker.userId;
    if (chat.order.clientId !== userId && makerUserId !== userId) {
      errorResponse(res, 'Acesso negado', 403);
      return;
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: { sender: { select: { id: true, name: true, avatar: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });

    await prisma.message.updateMany({
      where: { chatId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    const unread = await prisma.message.count({
      where: { chatId, senderId: { not: userId }, isRead: false },
    });

    successResponse(res, { messages, unread });
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar mensagens', 500);
  }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params as { chatId: string };
    const { content } = req.body as { content: string };
    const userId = req.user!.id;

    if (!content?.trim()) {
      errorResponse(res, 'Mensagem não pode estar vazia', 400);
      return;
    }

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        order: {
          include: {
            maker: { select: { userId: true } },
            client: { select: { name: true } },
          },
        },
      },
    });
    if (!chat) { errorResponse(res, 'Conversa não encontrada', 404); return; }

    const makerUserId = chat.order.maker.userId;
    if (chat.order.clientId !== userId && makerUserId !== userId) {
      errorResponse(res, 'Acesso negado', 403);
      return;
    }

    const message = await prisma.message.create({
      data: { chatId, senderId: userId, content: content.trim() },
      include: { sender: { select: { id: true, name: true, avatar: true, role: true } } },
    });

    const recipientId = userId === chat.order.clientId ? makerUserId : chat.order.clientId;
    const shortId = chat.order.id.slice(-8).toUpperCase();
    const senderName = req.user!.name;

    await createNotification(
      recipientId,
      NotificationType.NEW_MESSAGE,
      'Nova mensagem recebida',
      `${senderName} enviou uma mensagem referente ao Pedido #${shortId}`,
      { orderId: chat.order.id }
    );

    successResponse(res, message, 'Mensagem enviada', 201);
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao enviar mensagem', 500);
  }
};

export const markMessagesAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { chatId } = req.params as { chatId: string };
    const userId = req.user!.id;

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { order: { include: { maker: { select: { userId: true } } } } },
    });
    if (!chat) { errorResponse(res, 'Conversa não encontrada', 404); return; }

    const makerUserId = chat.order.maker.userId;
    if (chat.order.clientId !== userId && makerUserId !== userId) {
      errorResponse(res, 'Acesso negado', 403);
      return;
    }

    const { count } = await prisma.message.updateMany({
      where: { chatId, senderId: { not: userId }, isRead: false },
      data: { isRead: true },
    });

    successResponse(res, { marked: count }, 'Mensagens marcadas como lidas');
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao marcar mensagens', 500);
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const userOrders = await prisma.order.findMany({
      where: {
        OR: [
          { clientId: userId },
          { maker: { userId } },
        ],
      },
      select: { id: true },
    });

    const orderIds = userOrders.map(o => o.id);
    if (orderIds.length === 0) {
      successResponse(res, { count: 0 });
      return;
    }

    const count = await prisma.message.count({
      where: {
        chat: { orderId: { in: orderIds } },
        senderId: { not: userId },
        isRead: false,
      },
    });

    successResponse(res, { count });
  } catch (err) {
    logger.error(err);
    errorResponse(res, 'Erro ao buscar contagem', 500);
  }
};
