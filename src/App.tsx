import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Home from './pages/Home';

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

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

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
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" replace />} />
        <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} />
        <Route path="/reset-password/:token" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/dashboard" replace />} />
        
        {/* Root is now Home (Login) for unauthenticated users */}
        {/* Authenticated users are redirected to dashboard */}
        <Route path="/" element={!isAuthenticated ? <Home /> : <Navigate to="/dashboard" replace />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={isAuthenticated ? <Layout /> : <Navigate to="/" replace />}>
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
          <Route path="risk-management" element={<RiskManagement />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
