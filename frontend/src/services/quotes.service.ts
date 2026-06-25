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
  // CLIENT: list own quote requests
  async getAll(params?: Record<string, string>) {
    const { data } = await api.get('/quotes', { params });
    return data as PaginatedResponse<QuoteRequest>;
  },

  // MAKER: open quote feed
  async getOpen(params?: Record<string, string>) {
    const { data } = await api.get('/quotes/open', { params });
    return data as PaginatedResponse<QuoteRequest>;
  },

  // MAKER: own queue (open requests + own responses)
  async getMakerQuotes() {
    const { data } = await api.get('/quotes/maker');
    return data.data as MakerQuoteData;
  },

  // CLIENT: create a new quote request
  async create(payload: Partial<QuoteRequest>) {
    const { data } = await api.post('/quotes', payload);
    return data.data as QuoteRequest;
  },

  // MAKER: submit a price proposal
  async respond(id: string, payload: { price: number; shippingPrice?: number; deadline: number; notes?: string }) {
    const { data } = await api.post(`/quotes/${id}/respond`, payload);
    return data.data as QuoteResponse;
  },

  // CLIENT: update files of an existing quote
  async updateFiles(id: string, payload: { fileUrl?: string; imageUrl?: string }) {
    const { data } = await api.patch(`/quotes/${id}/files`, payload);
    return data.data as QuoteRequest;
  },

  // MAKER: decline a quote request
  async reject(id: string) {
    const { data } = await api.post(`/quotes/${id}/reject`);
    return data;
  },

  // CLIENT: accept a maker's proposal
  async acceptResponse(responseId: string) {
    const { data } = await api.post(`/quotes/responses/${responseId}/accept`);
    return data.data as QuoteResponse;
  },
};
