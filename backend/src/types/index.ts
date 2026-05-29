import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}
