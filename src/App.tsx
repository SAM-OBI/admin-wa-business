import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import PageLoader from './components/PageLoader';

// Shared Components
const Layout = lazy(() => import('./components/Layout'));
const PrivateRoute = lazy(() => import('./components/PrivateRoute'));

// Auth Pages
const Login = lazy(() => import(/* webpackChunkName: "auth" */ './pages/Login'));
const Signup = lazy(() => import(/* webpackChunkName: "auth" */ './pages/Signup'));
const ForgotPassword = lazy(() => import(/* webpackChunkName: "auth" */ './pages/ForgotPassword'));
const ResetPassword = lazy(() => import(/* webpackChunkName: "auth" */ './pages/ResetPassword'));
const TwoFactorAuth = lazy(() => import(/* webpackChunkName: "auth" */ './pages/TwoFactorAuth'));

// Tier 1: High-Priority Admin Routes (Prefetched)
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ './pages/Dashboard'));
const FinancialAudit = lazy(() => import(/* webpackChunkName: "finance" */ './pages/FinancialAudit'));
const Orders = lazy(() => import(/* webpackChunkName: "orders" */ './pages/Orders'));
const EscrowManagement = lazy(() => import(/* webpackChunkName: "finance" */ './pages/EscrowManagement'));
const AccountConsolidations = lazy(() => import(/* webpackChunkName: "management" */ './pages/AccountConsolidations'));

// Tier 2: Operational Governance
const Products = lazy(() => import(/* webpackChunkName: "inventory" */ './pages/Products'));
const Users = lazy(() => import(/* webpackChunkName: "management" */ './pages/Users'));
const Vendors = lazy(() => import(/* webpackChunkName: "management" */ './pages/Vendors'));
const ProductModeration = lazy(() => import(/* webpackChunkName: "governance" */ './pages/ProductModeration'));
const Disputes = lazy(() => import(/* webpackChunkName: "governance" */ './pages/Disputes'));
const Reviews = lazy(() => import(/* webpackChunkName: "governance" */ './pages/Reviews'));

// Tier 3: Support & Logs
const Complaints = lazy(() => import(/* webpackChunkName: "support" */ './pages/Complaints'));
const CourtCases = lazy(() => import(/* webpackChunkName: "support" */ './pages/CourtCases'));
const PlatformFeedback = lazy(() => import(/* webpackChunkName: "support" */ './pages/PlatformFeedback'));
const ErrorLogs = lazy(() => import(/* webpackChunkName: "diagnostics" */ './pages/ErrorLogs'));
const DeadLetterQueue = lazy(() => import(/* webpackChunkName: "diagnostics" */ './pages/DeadLetterQueue'));
const AuditLogs = lazy(() => import(/* webpackChunkName: "diagnostics" */ './pages/AuditLogs'));

// Tier 4: Utility & Detail Views
const SettingsPage = lazy(() => import(/* webpackChunkName: "util" */ './pages/SettingsPage'));
const Newsletter = lazy(() => import(/* webpackChunkName: "marketing" */ './pages/Newsletter'));
const Marketing = lazy(() => import(/* webpackChunkName: "marketing" */ './pages/Marketing'));
const CorporateSecurity = lazy(() => import(/* webpackChunkName: "security" */ './pages/SecurityDashboard'));
const PromoHub = lazy(() => import(/* webpackChunkName: "marketing" */ './pages/AdminPromoHub'));
const RiskManagement = lazy(() => import(/* webpackChunkName: "security" */ './pages/RiskManagement'));

// Dynamic Detail Views
const VendorDetails = lazy(() => import(/* webpackChunkName: "details" */ './pages/VendorDetails'));
const UserDetails = lazy(() => import(/* webpackChunkName: "details" */ './pages/UserDetails'));
const ProductDetails = lazy(() => import(/* webpackChunkName: "details" */ './pages/ProductDetails'));

// Prefetch Priority Modules on Idle
const prefetchPriorityRoutes = () => {
    // We can't use webpack's magic comments easily with Vite during runtime logic, 
    // but the dynamic import itself will trigger the browser to start fetching.
    import('./pages/Dashboard');
    import('./pages/FinancialAudit');
    import('./pages/Orders');
};

function App() {
  const { isLoading, checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
        // Prefetch high-priority modules when idle
        if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(prefetchPriorityRoutes);
        } else {
            setTimeout(prefetchPriorityRoutes, 2000);
        }
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <BrowserRouter 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
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
            <Route path="security" element={<CorporateSecurity />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="promo-hub" element={<PromoHub />} />
            <Route path="financial-audit" element={<FinancialAudit />} />
            <Route path="escrow" element={<EscrowManagement />} />
            <Route path="disputes" element={<Disputes />} />
            <Route path="consolidations" element={<AccountConsolidations />} />
            <Route path="error-logs" element={<ErrorLogs />} />
            <Route path="dlq" element={<DeadLetterQueue />} />
            <Route path="newsletter" element={<Newsletter />} />
            <Route path="product-moderation" element={<ProductModeration />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch all: Redirect any unknown routes to Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
