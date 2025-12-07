import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import type { UserResponse, LoginRequest, RegisterRequest } from '../types';
import { toast } from '../hooks/use-toast';
import { UserRole } from '../types';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

 
  const refreshUser = useCallback(async () => {
   
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await userService.getProfile();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } else {
        throw new Error(res.message);
      }
    } catch (error) {
     
      console.error("Failed to refresh user, logging out.", error);
      authService.logout({ token: localStorage.getItem('accessToken') || '' });
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      if (authService.isAuthenticated()) {
        const localUser = authService.getCurrentUser() as UserResponse;
        if(localUser) setUser(localUser);
       
        await refreshUser(); 
      }
      setLoading(false);
    };
    checkAuth();
  }, [refreshUser]);

  const login = async (data: LoginRequest): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authService.login(data);
      if (response.success && response.data) {
       
        setUser(response.data.user as UserResponse);
        
       
        await refreshUser(); 

        toast({
          title: "Đăng nhập thành công",
          description: `Chào mừng trở lại!`,
        });
        setLoading(false);
        return true;
      }
      throw new Error(response.message);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Đăng nhập thất bại",
        description: error.message || "Email hoặc mật khẩu không đúng",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (data: RegisterRequest): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authService.register(data);
     
      if (response.success) {
        toast({
          title: "Đăng ký thành công",
          description: "Mã OTP đã được gửi đến email của bạn.",
        });
        setLoading(false);
        return true;
      }
      throw new Error(response.message);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Đăng ký thất bại",
        description: error.message || "Email đã tồn tại",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    const token = localStorage.getItem('accessToken') || '';
    authService.logout({ token });
    setUser(null);
    toast({
      title: "Đăng xuất thành công",
    });
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === UserRole.ADMIN,
    login,
    register,
    logout,
    loading,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};