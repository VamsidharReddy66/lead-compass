import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'venture_admin' | 'agent' | 'any';
}

const ProtectedRoute = ({ children, requiredRole = 'any' }: ProtectedRouteProps) => {
  const { user, loading, isVentureAdmin, isAgent, userRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Auto-redirect based on role for dashboard routes
  if (location.pathname === '/dashboard' && isVentureAdmin) {
    return <Navigate to="/venture-dashboard" replace />;
  }

  // Check role-based access
  if (requiredRole === 'venture_admin' && !isVentureAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredRole === 'agent' && !isAgent) {
    return <Navigate to="/venture-dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
