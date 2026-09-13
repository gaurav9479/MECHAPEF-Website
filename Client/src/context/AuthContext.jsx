import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/services';

const AuthContext = createContext(null);

export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  EVENT_LEAD: 'event-lead',
  MEDIA_LEAD: 'media-lead',
  ENDORSED_VOLUNTEER: 'endorsed-volunteer',
  MEMBER: 'member',
  GENERAL_USER: 'general-user',
};

const ROLE_POWER = {
  'super-admin': 5,
  'event-lead': 4,
  'media-lead': 4,
  'endorsed-volunteer': 3,
  'member': 2,
  'general-user': 1,
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('accessToken'));

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

  const logout = () => {

    localStorage.removeItem('accessToken');
    setUser(null);
    

    authService.logout().catch(error => {
      console.warn("Backend logout failed.", error);
    });
  };


  const hasRole = (requiredRole) => {
    if (!user) return false;
    return (ROLE_POWER[user.role] || 0) >= (ROLE_POWER[requiredRole] || 0);
  };

  const isRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const canEdit = isRole(ROLES.SUPER_ADMIN, ROLES.EVENT_LEAD, ROLES.MEDIA_LEAD);
  const isAdmin = isRole(ROLES.SUPER_ADMIN, ROLES.EVENT_LEAD, ROLES.MEDIA_LEAD);
  const isSuperAdmin = isRole(ROLES.SUPER_ADMIN);

  return (
    <AuthContext.Provider value={{ 
      user, loading, microsoftLogin, logout, hasRole, isRole, canEdit, isAdmin, isSuperAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};