import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole, allowedRoles, toastMessage, fallbackPath }) => {
  const { user, loading, hasRole, isRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#000', color: '#ff0000',
        fontFamily: 'Orbitron, sans-serif', fontSize: '1.5rem'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !isRole(...allowedRoles)) {
    if (toastMessage) {
      return <Navigate to={fallbackPath || "/unauthorized"} state={{ error: toastMessage }} replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    if (toastMessage) {
      return <Navigate to={fallbackPath || "/unauthorized"} state={{ error: toastMessage }} replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
