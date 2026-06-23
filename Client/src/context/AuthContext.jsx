import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/services';

const AuthContext = createContext(null);

// Role hierarchy mapping — matches backend constants
export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  EVENT_HEAD: 'EventHead',
  PR_TEAM: 'PRTeam',
  ALUMNI: 'Alumni',
  GENERAL_USER: 'GeneralUser',
};

const ROLE_POWER = {
  SuperAdmin: 5,
  EventHead: 4,
  PRTeam: 3,
  Alumni: 2,
  GeneralUser: 1,
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authService.getMe()
        .then((res) => setUser(res.data.data.user))
        .catch(() => localStorage.removeItem('accessToken'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const { accessToken, user: userData } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  // Check if current user has at least this role level
  const hasRole = (requiredRole) => {
    if (!user) return false;
    return (ROLE_POWER[user.role] || 0) >= (ROLE_POWER[requiredRole] || 0);
  };

  // Check exact role membership
  const isRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Can the user edit content? (EventHead and above)
  const canEdit = isRole(ROLES.SUPER_ADMIN, ROLES.EVENT_HEAD, ROLES.PR_TEAM);
  const isAdmin = isRole(ROLES.SUPER_ADMIN, ROLES.EVENT_HEAD);
  const isSuperAdmin = isRole(ROLES.SUPER_ADMIN);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isRole, canEdit, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
