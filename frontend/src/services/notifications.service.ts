import api from './api';
import type { Notification } from '../types';

export interface NotificationsData {
  notifications: Notification[];
  unread: number;
}

export const notificationsService = {
  async getAll(): Promise<NotificationsData> {
    const { data } = await api.get('/notifications');
    return data.data as NotificationsData;
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get('/notifications/unread-count');
    return (data.data as { count: number }).count;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },
};
