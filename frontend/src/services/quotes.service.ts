import api from './api';
import type { QuoteRequest, QuoteResponse, PaginatedResponse } from '../types';

export interface MakerQuoteOpen extends QuoteRequest {
  client: { name: string; email: string; avatar?: string };
  _count?: { responses: number };
}

export interface MakerQuoteResponded extends QuoteResponse {
  quoteRequest: QuoteRequest & {
    client: { name: string; email: string; avatar?: string };
  };
}

export interface MakerQuoteData {
  open: MakerQuoteOpen[];
  responded: MakerQuoteResponded[];
}

export const quotesService = {
  async getAll(params?: Record<string, string>) {
    const { data } = await api.get('/quotes', { params });
    return data as PaginatedResponse<QuoteRequest>;
  },

  async getOpen(params?: Record<string, string>) {
    const { data } = await api.get('/quotes/open', { params });
    return data as PaginatedResponse<QuoteRequest>;
  },

  async getMakerQuotes() {
    const { data } = await api.get('/quotes/maker');
    return data.data as MakerQuoteData;
  },

  async create(payload: Partial<QuoteRequest>) {
    const { data } = await api.post('/quotes', payload);
    return data.data as QuoteRequest;
  },

  async respond(id: string, payload: { price: number; shippingPrice?: number; deadline: number; notes?: string }) {
    const { data } = await api.post(`/quotes/${id}/respond`, payload);
    return data.data as QuoteResponse;
  },

  async updateFiles(id: string, payload: { fileUrl?: string; imageUrl?: string }) {
    const { data } = await api.patch(`/quotes/${id}/files`, payload);
    return data.data as QuoteRequest;
  },

  async reject(id: string) {
    const { data } = await api.post(`/quotes/${id}/reject`);
    return data;
  },

  async acceptResponse(responseId: string) {
    const { data } = await api.post(`/quotes/responses/${responseId}/accept`);
    return data.data as QuoteResponse;
  },
};
