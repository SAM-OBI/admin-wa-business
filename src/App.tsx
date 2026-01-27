import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TwoFactorAuth from './pages/TwoFactorAuth';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
// Import Home from current directory (src/Home.tsx)
import Home from './Home';
import PrivateRoute from './components/PrivateRoute';

import Products from './pages/Products';
import Users from './pages/Users';
import Vendors from './pages/Vendors';
import Orders from './pages/Orders';
import Complaints from './pages/Complaints';
import CourtCases from './pages/CourtCases';
import Reviews from './pages/Reviews';
import RiskManagement from './pages/RiskManagement';
import AuditLogs from './pages/AuditLogs';
import SettingsPage from './pages/SettingsPage';
import VendorDetails from './pages/VendorDetails';
import UserDetails from './pages/UserDetails';
import ProductDetails from './pages/ProductDetails';
import Marketing from './pages/Marketing';
import PlatformFeedback from './pages/PlatformFeedback';
import SecurityDashboard from './pages/SecurityDashboard';

function App() {
  const { isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/auth/2fa" element={<TwoFactorAuth />} />
        
        {/* Root should redirect to login explicitly */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Dashboard Routes */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductDetails />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetails />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="vendors/:id" element={<VendorDetails />} />
          <Route path="orders" element={<Orders />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="court-cases" element={<CourtCases />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="feedback" element={<PlatformFeedback />} />
          <Route path="risk-management" element={<RiskManagement />} />
          <Route path="security" element={<SecurityDashboard />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch all: Redirect any unknown routes to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
