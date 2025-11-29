import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // 어드민은 모든 권한을 가짐
    if (user.role === 'admin') return true;
    // 권한이 없으면 false
    return user.permissions?.[permission as keyof typeof user.permissions] || false;
  };
  
  return { hasPermission };
};

