import api from './api';
import type { PaginatedResponse, Order } from '../types';

export interface AdminUser {
  id:          string;
  name:        string;
  email:       string;
  phone?:      string;
  avatar?:     string;
  role:        'ADMIN' | 'MAKER' | 'CLIENT';
  isActive:    boolean;
  isVerified:  boolean;
  createdAt:   string;
  makerProfile?: { id: string; status: string; companyName?: string; rating: number } | null;
  _count?: { ordersAsClient: number };
}

export interface AdminMaker {
  id:          string;
  userId:      string;
  companyName?: string;
  bio?:        string;
  status:      string;
  rating:      number;
  totalReviews:number;
  totalOrders: number;
  city?:       string;
  state?:      string;
  kycStatus:   string;
  kycNote?:         string;
  documentUrl?:     string;
  documentBackUrl?: string;
  selfieUrl?:       string;
  createdAt:   string;
  user:        { id: string; name: string; email: string; avatar?: string; createdAt: string };
  _count?:     { products: number; ordersAsMaker: number };
}

export interface AdminProduct {
  id:          string;
  name:        string;
  slug:        string;
  price:       number;
  images:      unknown;
  isActive:    boolean;
  isFeatured:  boolean;
  material:    string;
  stock:       number;
  totalSales:  number;
  createdAt:   string;
  maker:       { id: string; companyName?: string; user: { name: string } };
  category?:   { name: string };
  _count?:     { favorites: number };
}

export interface AdminDashboard {
  totalUsers:       number;
  newUsersMonth:    number;
  totalMakers:      number;
  pendingMakers:    number;
  totalOrders:      number;
  ordersMonth:      number;
  totalRevenue:     number;
  revenueMonth:     number;
  totalProducts:    number;
  pendingMakersList: AdminMaker[];
  recentOrders:     Order[];
}

export const adminService = {
  async getDashboard(): Promise<AdminDashboard> {
    const { data } = await api.get('/admin/dashboard');
    return data.data as AdminDashboard;
  },

  async getUsers(params?: { page?: number; limit?: number; search?: string; role?: string }) {
    const { data } = await api.get('/admin/users', { params });
    return data as PaginatedResponse<AdminUser>;
  },
  async toggleUser(id: string) { await api.patch(`/admin/users/${id}/toggle`); },

  async getMakers(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const { data } = await api.get('/admin/makers', { params });
    return data as PaginatedResponse<AdminMaker>;
  },
  async updateMakerStatus(id: string, action: 'approve'|'reject'|'suspend'|'reactivate') {
    await api.patch(`/admin/makers/${id}/status`, { action });
  },

  async requestKycCorrection(id: string, note: string, files: string[] = []) {
    await api.patch(`/admin/makers/${id}/kyc-correction`, { note, files });
  },

  async getOrders(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const { data } = await api.get('/admin/orders', { params });
    return data as PaginatedResponse<Order>;
  },

  async getProducts(params?: { page?: number; limit?: number; search?: string; active?: string }) {
    const { data } = await api.get('/admin/products', { params });
    return data as PaginatedResponse<AdminProduct>;
  },
  async toggleProduct(id: string) { await api.patch(`/admin/products/${id}/toggle`); },

};
