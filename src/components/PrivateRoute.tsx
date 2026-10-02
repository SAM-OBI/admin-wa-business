import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { JSX } from "react";
import PageLoader from "./PageLoader";

interface PrivateRouteProps {
  children: JSX.Element;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  // [ADMIN-BOOT-GATE-1] Wait for checkAuth() to resolve before deciding —
  // otherwise a cookie-authenticated user reopening a protected URL with no
  // sessionStorage hint gets bounced to /login before the auth check even runs.
  if (isLoading) {
    return <PageLoader />;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
