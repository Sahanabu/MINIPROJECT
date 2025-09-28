import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { RootState } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'officer' | 'admin';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!token) {
      // Redirect to login if no token
      window.location.href = '/login';
    }
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user && user.role !== requiredRole && user.role !== 'admin') {
    // If role is required and user doesn't have it (and isn't admin), redirect
    return <Navigate to="/assets?type=capital" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
