import api from './api';
import type { Chat, ChatMessage } from '../types';

export const chatService = {
  async getOrCreate(orderId: string): Promise<Chat> {
    const { data } = await api.post(`/chats/orders/${orderId}`);
    return data.data as Chat;
  },

  async getMessages(chatId: string): Promise<{ messages: ChatMessage[]; unread: number }> {
    const { data } = await api.get(`/chats/${chatId}/messages`);
    return data.data as { messages: ChatMessage[]; unread: number };
  },

  async sendMessage(chatId: string, content: string): Promise<ChatMessage> {
    const { data } = await api.post(`/chats/${chatId}/messages`, { content });
    return data.data as ChatMessage;
  },

  async markAsRead(chatId: string): Promise<void> {
    await api.patch(`/chats/${chatId}/read`);
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get('/chats/unread-count');
    return (data.data as { count: number }).count;
  },
};
