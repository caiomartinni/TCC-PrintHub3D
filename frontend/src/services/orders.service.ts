import api from './api';
import type { Order, PaginatedResponse } from '../types';

export const ordersService = {
  async getAll(params?: Record<string, string>) {
    const { data } = await api.get('/orders', { params });
    return data as PaginatedResponse<Order>;
  },

  async getById(id: string) {
    const { data } = await api.get(`/orders/${id}`);
    return data.data as Order;
  },

  async create(payload: { makerId: string; items: unknown[]; addressId?: string; notes?: string }) {
    const { data } = await api.post('/orders', payload);
    return data.data as Order;
  },

  async updateStatus(id: string, payload: { status: string; description?: string; trackingCode?: string }) {
    const { data } = await api.patch(`/orders/${id}/status`, payload);
    return data.data as Order;
  },
};
