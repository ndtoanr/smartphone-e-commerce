import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import AdminLayout from './components/Layout/AdminLayout';
import { Toaster } from 'react-hot-toast';

// Pages
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './pages/CheckoutPage';
import OrderDetailPage from './pages/OrderDetailPage';
import PaymentPage from './pages/PaymentPage';

// Admin Pages
import AdminDashboard from './pages/admin/DashboardPage';
import AdminProducts from './pages/admin/ProductManagementPage';
import AdminOrders from './pages/admin/OrderManagementPage';
import AdminUsers from './pages/admin/UserManagementPage';
import AdminChatPage from './pages/admin/AdminChatPage';
import AdminCoupons from './pages/admin/CouponManagementPage';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

import UserRoute from './components/UserRoute';
import FloatingWidget from './components/FloatingWidget';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Admin routes - separate layout */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/chat" element={<AdminChatPage />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
          </Route>
        </Route>

        {/* User routes - shared layout */}
        <Route element={<UserRoute />}>
          <Route
            path="*"
            element={
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto px-4 py-8">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductListPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute />}>
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route path="/order/:id" element={<OrderDetailPage />} />
                      <Route path="/payment/:orderId" element={<PaymentPage />} />
                    </Route>
                  </Routes>
                </main>
                <Footer />
                <FloatingWidget />
              </div>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
