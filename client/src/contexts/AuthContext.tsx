import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 从localStorage恢复认证状态
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    } else if (savedUser && !savedToken) {
      // 如果有用户信息但没有token，清除不完整的登录状态
      console.warn('Found user data without token, clearing incomplete auth state');
      localStorage.removeItem('auth_user');
    } else if (savedToken && !savedUser) {
      // 如果有token但没有用户信息，清除不完整的登录状态
      console.warn('Found token without user data, clearing incomplete auth state');
      localStorage.removeItem('auth_token');
    }

    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login({ username, password });
      const { user: userData, token: userToken } = response.data.data!;

      setUser(userData);
      setToken(userToken);

      // 保存到localStorage
      localStorage.setItem('auth_token', userToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));

      toast.success('登录成功！');
    } catch (error: any) {
      const message = error.response?.data?.message || '登录失败';
      toast.error(message);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await authApi.register({ username, email, password });
      const { user: userData, token: userToken } = response.data.data!;

      setUser(userData);
      setToken(userToken);

      // 保存到localStorage
      localStorage.setItem('auth_token', userToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));

      toast.success('注册成功！');
    } catch (error: any) {
      const message = error.response?.data?.message || '注册失败';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    toast.success('已退出登录');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}