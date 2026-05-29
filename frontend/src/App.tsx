import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ToastProvider } from '@/components/ui/Toast';
import CartDrawer from '@/components/shared/CartDrawer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import Landing from '@/pages/Landing';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Marketplace from '@/pages/marketplace/Marketplace';
import ProductDetail from '@/pages/marketplace/ProductDetail';
import MakersList from '@/pages/marketplace/MakersList';
import MakerProfile from '@/pages/marketplace/MakerProfile';
import QuoteRequest from '@/pages/marketplace/QuoteRequest';
import QuoteComparison from '@/pages/marketplace/QuoteComparison';
import ClientDashboard from '@/pages/dashboard/ClientDashboard';
import MakerDashboard from '@/pages/dashboard/MakerDashboard';
import OrderTracking from '@/pages/dashboard/OrderTracking';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import type { ReactNode } from 'react';

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner fullScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/product/:slug" element={<ProductDetail />} />
      <Route path="/makers" element={<MakersList />} />
      <Route path="/maker/:id" element={<MakerProfile />} />
      <Route path="/quote/request" element={<ProtectedRoute><QuoteRequest /></ProtectedRoute>} />
      <Route path="/quote/compare" element={<QuoteComparison />} />

      {/* Auth */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Client Dashboard */}
      <Route path="/dashboard/client" element={<ProtectedRoute roles={['CLIENT']}><ClientDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/client/orders" element={<ProtectedRoute roles={['CLIENT']}><ClientDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/client/quotes" element={<ProtectedRoute roles={['CLIENT']}><ClientDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/client/favorites" element={<ProtectedRoute roles={['CLIENT']}><ClientDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/client/notifications" element={<ProtectedRoute roles={['CLIENT']}><ClientDashboard /></ProtectedRoute>} />

      {/* Maker Dashboard */}
      <Route path="/dashboard/maker" element={<ProtectedRoute roles={['MAKER']}><MakerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/maker/products" element={<ProtectedRoute roles={['MAKER']}><MakerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/maker/orders" element={<ProtectedRoute roles={['MAKER']}><MakerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/maker/quotes" element={<ProtectedRoute roles={['MAKER']}><MakerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/maker/reviews" element={<ProtectedRoute roles={['MAKER']}><MakerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/maker/financeiro" element={<ProtectedRoute roles={['MAKER']}><MakerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/maker/notifications" element={<ProtectedRoute roles={['MAKER']}><MakerDashboard /></ProtectedRoute>} />

      {/* Order */}
      <Route path="/order/:id" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/makers" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />

      {/* Misc */}
      <Route path="/settings" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CartProvider>
            <div className="dark">
              <CartDrawer />
              <AppRoutes />
            </div>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
