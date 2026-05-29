import api from './api';
import type { QuoteRequest, QuoteResponse, PaginatedResponse } from '../types';

export const quotesService = {
  async getAll(params?: Record<string, string>) {
    const { data } = await api.get('/quotes', { params });
    return data as PaginatedResponse<QuoteRequest>;
  },

  async getOpen(params?: Record<string, string>) {
    const { data } = await api.get('/quotes/open', { params });
    return data as PaginatedResponse<QuoteRequest>;
  },

  async create(payload: Partial<QuoteRequest>) {
    const { data } = await api.post('/quotes', payload);
    return data.data as QuoteRequest;
  },

  async respond(id: string, payload: { price: number; shippingPrice?: number; deadline: number; notes?: string }) {
    const { data } = await api.post(`/quotes/${id}/respond`, payload);
    return data.data as QuoteResponse;
  },

  async acceptResponse(responseId: string) {
    const { data } = await api.post(`/quotes/responses/${responseId}/accept`);
    return data.data as QuoteResponse;
  },
};
