import { Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider, { useAuth } from './context/AuthContext';
import CartProvider from './context/CartContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserHomePage from './pages/UserHomePage';
import ShopSearchResultsPage from './pages/ShopSearchResultsPage';
import ShopDetailsPage from './pages/ShopDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OwnerLoginPage from './pages/OwnerLoginPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<UserHomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/search" element={<ShopSearchResultsPage />} />
      <Route path="/shop/:shopId" element={<ShopDetailsPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/my-orders" element={<MyOrdersPage />} />
      <Route path="/owner-login" element={<OwnerLoginPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route
        path="/owner-dashboard"
        element={
          <ProtectedRoute allowedRoles={['SHOP_OWNER']}>
            <OwnerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  );
}
