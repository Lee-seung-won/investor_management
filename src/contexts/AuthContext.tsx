import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

interface User {
  username: string;
  role: string;
  is_active: boolean;
  permissions: {
    access_reports: boolean;
    access_report_collection: boolean;
    collect_fund_news: boolean;
    refresh_all_funds: boolean;
    access_labeling: boolean;
    access_api_docs: boolean;
    access_profile_management: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const userData = response.data;
      
      // 사용자가 비활성화된 경우 로그아웃 처리
      if (!userData.is_active) {
        setUser(null);
        // 세션 쿠키 삭제
        document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // 로그인 페이지로 리다이렉트
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return;
      }
      
      setUser(userData);
    } catch (error: any) {
      // 401 에러인 경우 로그아웃 처리
      if (error.response?.status === 401) {
        setUser(null);
        // 세션 쿠키 삭제
        document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // 로그인 페이지가 아닌 경우에만 리다이렉트
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else {
        // 401 에러가 아닌 경우에만 에러 로그
        console.error('인증 확인 실패:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      await authAPI.login(username, password);
      await checkAuth();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || '로그인에 실패했습니다.');
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

