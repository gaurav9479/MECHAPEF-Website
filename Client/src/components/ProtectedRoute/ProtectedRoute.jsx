import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({
  children,
  allowedRoles,
  toastMessage,
  fallbackPath = "/unauthorized"
}) => {
  const { user, loading, isRole } = useAuth();
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
    const destination = location.pathname.startsWith('/admin') ? '/' : '/login';
    return <Navigate to={destination} state={{ from: location }} replace />;
  }


  if (allowedRoles && allowedRoles.length > 0) {
    if (!isRole(...allowedRoles)) {
      return (
        <Navigate
          to={fallbackPath}
          state={toastMessage ? { error: toastMessage } : null}
          replace
        />
      );
    }
  }

  // 3. If authenticated and authorized, render the route
  return children;
};

export default ProtectedRoute;