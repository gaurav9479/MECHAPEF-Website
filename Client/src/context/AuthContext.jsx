import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/services';

const AuthContext = createContext(null);

// 1. Updated to match your new 5-tier hyphenated roles
export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  CONTENT_LEAD: 'content-lead',
  MEDIA_LEAD: 'media-lead',
  MEMBER: 'member',
  GENERAL_USER: 'general-user',
};

// 2. Updated hierarchy in case you still use hasRole() anywhere
// Note: Content and Media leads are put on the same tier here (4)
const ROLE_POWER = {
  'super-admin': 5,
  'content-lead': 4,
  'media-lead': 4,
  'member': 2,
  'general-user': 1,
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Only start in a loading state if we actually have a token to verify
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

  const logout = async () => {
    try {
      await authService.logout(); 
    } catch (error) {
      console.warn("Backend logout failed, forcing local logout.", error);
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      // No global loading state here, avoids avatar circle flashing
    }
  };

  // Evaluates hierarchy (e.g., "are they AT LEAST a content-lead?")
  const hasRole = (requiredRole) => {
    if (!user) return false;
    return (ROLE_POWER[user.role] || 0) >= (ROLE_POWER[requiredRole] || 0);
  };

  // Evaluates exact matches (This powers the new ProtectedRoute logic)
  const isRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // 3. Updated convenience variables
  const canEdit = isRole(ROLES.SUPER_ADMIN, ROLES.CONTENT_LEAD, ROLES.MEDIA_LEAD);
  const isAdmin = isRole(ROLES.SUPER_ADMIN, ROLES.CONTENT_LEAD, ROLES.MEDIA_LEAD);
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