import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'PARENT' | 'CHILD';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // 如果角色不匹配，重定向到对应的仪表板
    if (user?.role === 'PARENT') {
      return <Navigate to="/parent/dashboard" replace />;
    } else {
      return <Navigate to="/child/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
