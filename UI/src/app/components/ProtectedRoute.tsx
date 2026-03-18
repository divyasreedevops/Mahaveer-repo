import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/app/context/AppContext';

interface ProtectedRouteProps {
  allowedRoles: ('patient' | 'admin')[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, userType, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to home if not logged in
    return <Navigate to="/" replace />;
  }

  if (userType && !allowedRoles.includes(userType)) {
    // Redirect to their respective dashboard if they are in the wrong portal
    return <Navigate to={userType === 'admin' ? '/admin/dashboard' : '/patient/dashboard'} replace />;
  }

  return <Outlet />;
}
