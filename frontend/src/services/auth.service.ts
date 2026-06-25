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

  async updateProfile(payload: { name?: string; phone?: string; avatar?: string }) {
    const { data } = await api.put('/auth/profile', payload);
    return data.data as User;
  },

  async uploadAvatar(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/uploads/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (data.data as { url: string }).url;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    await api.put('/auth/password', { currentPassword, newPassword });
  },

  async deleteAccount(password: string) {
    await api.delete('/auth/account', { data: { password } });
  },

  async getAddress() {
    const { data } = await api.get('/auth/address');
    return data.data as {
      id: string; label: string; street: string; number: string;
      complement?: string; district: string; city: string; state: string; zipCode: string;
    } | null;
  },

  async saveAddress(payload: {
    label: string; street: string; number: string; complement?: string;
    district: string; city: string; state: string; zipCode: string;
  }) {
    const { data } = await api.post('/auth/address', payload);
    return data.data;
  },
};
