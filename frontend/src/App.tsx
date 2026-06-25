import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ToastProvider } from '@/components/ui/Toast';
import CartDrawer from '@/components/shared/CartDrawer';
import ScrollToTop from '@/components/layout/ScrollToTop';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

import Landing from '@/pages/Landing';
import Login          from '@/pages/auth/Login';
import Register        from '@/pages/auth/Register';
import ForgotPassword  from '@/pages/auth/ForgotPassword';
import ResetPassword   from '@/pages/auth/ResetPassword';
import Marketplace from '@/pages/marketplace/Marketplace';
import ProductDetail from '@/pages/marketplace/ProductDetail';
import MakersList from '@/pages/marketplace/MakersList';
import MakerProfile from '@/pages/marketplace/MakerProfile';
import QuoteRequest from '@/pages/marketplace/QuoteRequest';
// QuoteComparison: página com dados mockados (mockResponses), sem nenhum fluxo real
// que navegue até ela. Rota desativada para não ficar acessível via URL direta
// durante a apresentação. Ver frontend/src/pages/marketplace/QuoteComparison.tsx.
// import QuoteComparison from '@/pages/marketplace/QuoteComparison';
import ClientDashboard from '@/pages/dashboard/ClientDashboard';
import MakerDashboard from '@/pages/dashboard/MakerDashboard';
import OrderTracking from '@/pages/dashboard/OrderTracking';
import OrderDetail   from '@/pages/dashboard/OrderDetail';
import Settings from '@/pages/dashboard/Settings';
import MakerProducts from '@/pages/dashboard/MakerProducts';
import MakerQuotes from '@/pages/dashboard/MakerQuotes';
import MakerProfileEdit from '@/pages/dashboard/MakerProfileEdit';
import ClientOrders from '@/pages/dashboard/ClientOrders';
import MakerOrders from '@/pages/dashboard/MakerOrders';
import MakerReviews from '@/pages/dashboard/MakerReviews';
import MakerFinanceiro from '@/pages/dashboard/MakerFinanceiro';
import ClientQuotes from '@/pages/dashboard/ClientQuotes';
import ClientFavorites from '@/pages/dashboard/ClientFavorites';
import OrderChat from '@/pages/dashboard/OrderChat';
import Checkout from '@/pages/payment/Checkout';
import TermosDeUso from '@/pages/static/TermosDeUso';
import Privacidade from '@/pages/static/Privacidade';
import CentralDeAjuda from '@/pages/static/CentralDeAjuda';
import Contato from '@/pages/static/Contato';
import ComoFunciona from '@/pages/static/ComoFunciona';
import PaymentStatus from '@/pages/payment/PaymentStatus';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminMakers from '@/pages/admin/AdminMakers';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminProducts from '@/pages/admin/AdminProducts';
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
      {/* Desativada: nenhum lugar do app navega para /quote/compare; a tela usa
          dados mockados (mockResponses) e o botão "Aceitar" não conclui nenhum
          fluxo real — ver comentário acima sobre QuoteComparison. */}
      {/* <Route path="/quote/compare" element={<QuoteComparison />} /> */}

      {/* Auth */}
      <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register"        element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword  />} />

      {/* Client Dashboard */}
      <Route path="/dashboard/client" element={<ProtectedRoute roles={['CLIENT']}><ClientDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/client/orders" element={<ProtectedRoute><ClientOrders /></ProtectedRoute>} />
      <Route path="/dashboard/client/quotes" element={<ProtectedRoute><ClientQuotes /></ProtectedRoute>} />
      <Route path="/dashboard/client/favorites" element={<ProtectedRoute><ClientFavorites /></ProtectedRoute>} />
      <Route path="/dashboard/client/notifications" element={<ProtectedRoute roles={['CLIENT']}><ClientDashboard /></ProtectedRoute>} />

      {/* Maker Dashboard */}
      <Route path="/dashboard/maker" element={<ProtectedRoute roles={['MAKER']}><MakerDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/maker/profile"  element={<ProtectedRoute roles={['MAKER']}><MakerProfileEdit /></ProtectedRoute>} />
      <Route path="/dashboard/maker/products" element={<ProtectedRoute roles={['MAKER']}><MakerProducts /></ProtectedRoute>} />
      <Route path="/dashboard/maker/orders" element={<ProtectedRoute roles={['MAKER']}><MakerOrders /></ProtectedRoute>} />
      <Route path="/dashboard/maker/quotes" element={<ProtectedRoute roles={['MAKER']}><MakerQuotes /></ProtectedRoute>} />
      <Route path="/dashboard/maker/reviews" element={<ProtectedRoute roles={['MAKER']}><MakerReviews /></ProtectedRoute>} />
      <Route path="/dashboard/maker/financeiro" element={<ProtectedRoute roles={['MAKER']}><MakerFinanceiro /></ProtectedRoute>} />
      <Route path="/dashboard/maker/notifications" element={<ProtectedRoute roles={['MAKER']}><MakerDashboard /></ProtectedRoute>} />

      {/* Order */}
      <Route path="/order/:id"          element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
      <Route path="/order/:id/tracking" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
      <Route path="/order/:id/detail"   element={<ProtectedRoute><OrderDetail   /></ProtectedRoute>} />
      <Route path="/order/:id/chat"     element={<ProtectedRoute><OrderChat /></ProtectedRoute>} />

      {/* Payment */}
      <Route path="/checkout"         element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/payment/status"   element={<ProtectedRoute><PaymentStatus /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin"            element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard  /></ProtectedRoute>} />
      <Route path="/admin/users"       element={<ProtectedRoute roles={['ADMIN']}><AdminUsers      /></ProtectedRoute>} />
      <Route path="/admin/makers"      element={<ProtectedRoute roles={['ADMIN']}><AdminMakers     /></ProtectedRoute>} />
      <Route path="/admin/orders"      element={<ProtectedRoute roles={['ADMIN']}><AdminOrders     /></ProtectedRoute>} />
      <Route path="/admin/reports"     element={<ProtectedRoute roles={['ADMIN']}><AdminProducts   /></ProtectedRoute>} />

      {/* Settings / Profile */}
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/profile"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      {/* Static pages */}
      <Route path="/termos"    element={<TermosDeUso />} />
      <Route path="/privacidade" element={<Privacidade />} />
      <Route path="/ajuda"     element={<CentralDeAjuda />} />
      <Route path="/contato"   element={<Contato />} />
      <Route path="/como-funciona" element={<ComoFunciona />} />

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
            <FavoritesProvider>
            <NotificationsProvider>
              <div className="dark">
                <ScrollToTop />
                <CartDrawer />
                <AppRoutes />
              </div>
            </NotificationsProvider>
            </FavoritesProvider>
          </CartProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
