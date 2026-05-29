import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { AuthRequest } from '../types/index.js';
import { markAsRead, markAllAsRead } from '../services/notification.service.js';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unread = notifications.filter((n) => !n.isRead).length;
    successResponse(res, { notifications, unread });
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao buscar notificações', 500);
  }
};

export const readNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    await markAsRead(id, req.user!.id);
    successResponse(res, null, 'Notificação lida');
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao marcar notificação', 500);
  }
};

export const readAllNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await markAllAsRead(req.user!.id);
    successResponse(res, null, 'Todas as notificações lidas');
  } catch (err) {
    console.error(err);
    errorResponse(res, 'Erro ao marcar notificações', 500);
  }
};
