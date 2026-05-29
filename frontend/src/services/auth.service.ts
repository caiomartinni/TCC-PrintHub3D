import api from './api';
import type { User } from '../types';

export const authService = {
  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    return data.data as { token: string; refreshToken: string; user: User };
  },

  async register(payload: { email: string; password: string; name: string; phone?: string; role?: string }) {
    const { data } = await api.post('/auth/register', payload);
    return data.data as { token: string; refreshToken: string; user: User };
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return data.data as User;
  },

  async updateProfile(payload: { name?: string; phone?: string }) {
    const { data } = await api.put('/auth/profile', payload);
    return data.data as User;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await api.put('/auth/password', { currentPassword, newPassword });
  },
};
