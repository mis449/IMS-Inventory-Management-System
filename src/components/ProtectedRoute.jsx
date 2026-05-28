import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role?.toUpperCase())) {
    return <Navigate to="/create-indent" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;