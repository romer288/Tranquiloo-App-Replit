
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ROUTES } from '@/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'patient' | 'therapist';
  requireVerification?: boolean;
}

const ProtectedRoute = ({ children, role, requireVerification = true }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // If no specific role is required but user is a therapist, force therapist dashboard
  if (!role && user.role === 'therapist') {
    return <Navigate to={ROUTES.therapistDashboard} replace />;
  }

  // Email verification enforcement disabled

  // Role-based access control
  if (role && user.role !== role) {
    // Redirect to appropriate dashboard based on user's actual role
    const redirectPath = user.role === 'therapist' ? ROUTES.therapistDashboard : ROUTES.dashboard;
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
