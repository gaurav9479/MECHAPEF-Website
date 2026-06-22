import { useAuth } from '../context/AuthContext';

// Returns true if user can edit content (EventHead level and above)
export const useCanEdit = () => {
  const { canEdit } = useAuth();
  return canEdit;
};

// Returns true if user is SuperAdmin or EventHead
export const useIsAdmin = () => {
  const { isAdmin } = useAuth();
  return isAdmin;
};

// Returns true if user is SuperAdmin only
export const useIsSuperAdmin = () => {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin;
};

export default useCanEdit;
