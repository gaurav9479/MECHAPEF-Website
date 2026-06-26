import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/services';

const AuthContext = createContext(null);


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

  const microsoftLogin = async (code, code_verifier) => {
    const res = await authService.microsoftLogin(code, code_verifier);
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


  const hasRole = (requiredRole) => {
    if (!user) return false;
    return (ROLE_POWER[user.role] || 0) >= (ROLE_POWER[requiredRole] || 0);
  };


  const isRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };


  const canEdit = isRole(ROLES.SUPER_ADMIN, ROLES.EVENT_HEAD, ROLES.PR_TEAM);
  const isAdmin = isRole(ROLES.SUPER_ADMIN, ROLES.EVENT_HEAD);
  const isSuperAdmin = isRole(ROLES.SUPER_ADMIN);

  return (
    <AuthContext.Provider value={{ user, loading, microsoftLogin, logout, hasRole, isRole, canEdit, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
