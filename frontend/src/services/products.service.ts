import api from './api';
import type { Product, PaginatedResponse } from '../types';

export const productsService = {
  async getAll(params?: Record<string, string | number | boolean>) {
    const { data } = await api.get('/products', { params });
    return data as PaginatedResponse<Product>;
  },

  async getBySlug(slug: string) {
    const { data } = await api.get(`/products/${slug}`);
    return data.data as Product;
  },

  async create(payload: Partial<Product>) {
    const { data } = await api.post('/products', payload);
    return data.data as Product;
  },

  async update(id: string, payload: Partial<Product>) {
    const { data } = await api.put(`/products/${id}`, payload);
    return data.data as Product;
  },

  async delete(id: string) {
    await api.delete(`/products/${id}`);
  },

  async toggleFavorite(id: string) {
    const { data } = await api.post(`/products/${id}/favorite`);
    return data.data as { favorited: boolean };
  },
};
