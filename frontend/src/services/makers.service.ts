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
};
