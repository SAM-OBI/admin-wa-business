import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
// Login component is now effectively Home.tsx
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
// Import Home from current directory (src/Home.tsx) since user moved it
import Home from './Home';

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
        <Route path="/login" element={!isAuthenticated ? <Home /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" replace />} />
        <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} />
        <Route path="/reset-password/:token" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/dashboard" replace />} />
        
        {/* User requested: remove path update.
            However, we MUST serve Home.tsx at /.
            If they meant "remove path update" as in "go back to original", original was redirect.
            BUT they said "move login out... rename Home.tsx... fix error... remove path update".
            It sounds like they want / to be Home.
            AND they said "it takes you to .../dashboard" complainingly. 
            So / should NOT redirect to dashboard if unauthenticated.
            
            If authenticated, it SHOULD go to dashboard? Or stay on Home (which is Login)?
            Login page usually redirects if already logged in.
            
            Let's interpret "remove the path update you did" as "fix the import path error".
            But also "this is the original link... click on it... takes to dashboard".
            This implies they want / to stay on / (Home).
         */}
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

        {/* Catch all: Redirect any unknown routes to Home (Login) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
