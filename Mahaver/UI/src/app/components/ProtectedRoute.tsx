import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'patient' | 'admin';
}

/**
 * ProtectedRoute component to guard routes that require authentication
 * Redirects to appropriate login page if user is not authenticated
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  
  // Check if user is authenticated (has token)
  const token = localStorage.getItem('auth_token');
  const isAuthenticated = !!token;
  
  // If not authenticated, redirect to appropriate login page
  if (!isAuthenticated) {
    const loginPath = requiredRole === 'admin' ? '/admin/login' : '/patient/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }
  
  // TODO: Add role-based validation if needed
  // For now, we trust the token and route separation
  
  return <>{children}</>;
}

export default ProtectedRoute;
