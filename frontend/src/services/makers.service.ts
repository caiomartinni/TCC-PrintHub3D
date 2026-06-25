import api from './api';
import type { MakerProfile, PaginatedResponse } from '../types';

export const makersService = {
  async getAll(params?: Record<string, string | number>) {
    const { data } = await api.get('/makers', { params });
    return data as PaginatedResponse<MakerProfile>;
  },

  async getById(id: string) {
    const { data } = await api.get(`/makers/${id}`);
    return data.data as MakerProfile;
  },

  async updateProfile(payload: Partial<MakerProfile>) {
    const { data } = await api.put('/makers/profile', payload);
    return data.data as MakerProfile;
  },

  async getDashboard() {
    const { data } = await api.get('/makers/dashboard');
    return data.data;
  },

  async getReviews(params?: { page?: number; limit?: number }) {
    const { data } = await api.get('/makers/reviews', { params });
    return data as {
      data: {
        id: string;
        rating: number;
        title?: string;
        comment?: string;
        createdAt: string;
        client: { name: string; avatar?: string };
        product?: { name: string } | null;
      }[];
      pagination: { total: number; page: number; limit: number; pages: number };
      summary: { rating: number; totalReviews: number; ratingCounts: Record<number, number> };
    };
  },

  async getWithdrawals() {
    const { data } = await api.get('/makers/withdrawals');
    return data.data as {
      balanceAvail: number;
      balancePending: number;
      history: { id: string; amount: number; pixKey: string; pixKeyType: string; status: string; createdAt: string }[];
    };
  },

  async requestWithdrawal(payload: { amount: number; pixKey: string; pixKeyType: string }) {
    const { data } = await api.post('/makers/withdraw', payload);
    return data;
  },
};
