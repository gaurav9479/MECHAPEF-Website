import { useAuth } from '../context/AuthContext';


export const useCanEdit = () => {
  const { canEdit } = useAuth();
  return canEdit;
};


export const useIsAdmin = () => {
  const { isAdmin } = useAuth();
  return isAdmin;
};


export const useIsSuperAdmin = () => {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin;
};

export default useCanEdit;
