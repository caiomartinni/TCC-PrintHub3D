export type UserRole = 'ADMIN' | 'MAKER' | 'CLIENT';

export type OrderStatus =
  | 'PENDING' | 'CONFIRMED' | 'PRINTING'
  | 'QUALITY_CHECK' | 'SHIPPED' | 'DELIVERED'
  | 'CANCELLED' | 'REFUNDED';

export type QuoteStatus = 'OPEN' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type MakerStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  makerProfile?: MakerProfile;
}

export interface MakerProfile {
  id: string;
  userId: string;
  companyName?: string;
  bio?: string;
  website?: string;
  instagram?: string;
  status: MakerStatus;
  rating: number;
  totalReviews: number;
  totalOrders: number;
  responseTime: number;
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  printers: string[];
  materials: string[];
  maxBuildVolume?: string;
  kycStatus: string;
  commissionRate: number;
  balanceAvail: number;
  balancePending: number;
  user?: Pick<User, 'name' | 'avatar'>;
  distance?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  makerId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  modelFileUrl?: string;
  material: string;
  color?: string;
  weight?: number;
  dimensions?: string;
  printTime?: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  rating: number;
  totalReviews: number;
  totalSales: number;
  createdAt: string;
  category?: Category;
  maker?: MakerProfile & { user?: Pick<User, 'name' | 'avatar'> };
  _count?: { favorites: number };
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  material?: string;
  color?: string;
  notes?: string;
  product?: Pick<Product, 'name' | 'images'>;
}

export interface TrackingEntry {
  id: string;
  status: string;
  description: string;
  location?: string;
  trackingCode?: string;
  carrier?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  clientId: string;
  makerId: string;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  notes?: string;
  estimatedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  items: OrderItem[];
  maker?: MakerProfile & { user?: Pick<User, 'name' | 'avatar'> };
  client?: Pick<User, 'name' | 'email' | 'avatar'>;
  tracking?: TrackingEntry[];
  payment?: { status: PaymentStatus; amount: number };
}

export interface QuoteRequest {
  id: string;
  clientId: string;
  title: string;
  description: string;
  width?: number;
  height?: number;
  depth?: number;
  material?: string;
  resistance?: string;
  quantity: number;
  fileUrl?: string;
  imageUrl?: string;
  budget?: number;
  deadline?: string;
  status: QuoteStatus;
  city?: string;
  state?: string;
  expiresAt?: string;
  createdAt: string;
  client?: Pick<User, 'name' | 'avatar'>;
  responses?: QuoteResponse[];
  _count?: { responses: number };
}

export interface QuoteResponse {
  id: string;
  quoteRequestId: string;
  makerId: string;
  price: number;
  shippingPrice: number;
  deadline: number;
  notes?: string;
  status: QuoteStatus;
  expiresAt?: string;
  createdAt: string;
  maker?: MakerProfile & { user?: Pick<User, 'name' | 'avatar'> };
}

export interface Review {
  id: string;
  makerId: string;
  clientId: string;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  client?: Pick<User, 'name' | 'avatar'>;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
