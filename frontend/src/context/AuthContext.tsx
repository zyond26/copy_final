'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '../api/axiosInstance';

// Định nghĩa cấu trúc User giải mã từ JWT
export interface UserSession {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  must_change_password?: boolean;
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ requiresMfa: boolean; temporaryToken?: string }>;
  verifyMfa: (otpCode: string, tempToken: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otpCode: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<void>;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hàm giải mã JWT an toàn trên Client không cần thư viện ngoài (ISO 27799 compliant)
export function decodeJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Đồng bộ hóa trạng thái phiên làm việc khi load trang
  const refreshSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Kiểm tra xem mật khẩu có bắt buộc đổi hay không
        if (parsedUser?.must_change_password) {
          router.push('/change-password');
        }
      } else {
        setUser(null);
        setToken(null);
      }
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Đăng nhập Bước 1 (Gửi Email & Mật khẩu)
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/api/auth/login', { email, password });
      const data = res.data;

      if (data.status === 'success') {
        if (data.data.requires_mfa) {
          return {
            requiresMfa: true,
            temporaryToken: data.data.temporary_token,
          };
        } else {
          // Lưu token & giải mã thông tin user
          const { access_token, user: loggedUser } = data.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('user', JSON.stringify(loggedUser));
          setToken(access_token);
          setUser(loggedUser);

          if (loggedUser.must_change_password) {
            router.push('/change-password');
          } else {
            router.push('/dashboard');
          }
          return { requiresMfa: false };
        }
      }
      throw new Error(data.message || 'Đăng nhập không thành công.');
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || 'Lỗi hệ thống khi đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  // Đăng nhập Bước 2: Xác thực mã OTP (MFA)
  const verifyMfa = async (otpCode: string, tempToken: string) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post(
        '/api/auth/mfa/verify',
        { otp_code: otpCode },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      const data = res.data;

      if (data.status === 'success') {
        const { access_token, user: loggedUser } = data.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setToken(access_token);
        setUser(loggedUser);

        if (loggedUser.must_change_password) {
          router.push('/change-password');
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error(data.message || 'Mã xác thực OTP không đúng.');
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || 'Lỗi xác thực MFA.');
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất và dọn dẹp phiên (ISO 27799 A.9 Session termination)
  const logout = async () => {
    setLoading(true);
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch (e) {
      console.warn('Lỗi khi gọi API logout:', e);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      setLoading(false);
      router.push('/');
    }
  };

  // Quên mật khẩu
  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/api/auth/forgot-password', { email });
      if (res.data.status !== 'success') {
        throw new Error(res.data.message || 'Không thể gửi mã khôi phục.');
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || 'Lỗi khi gửi yêu cầu quên mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  // Đặt lại mật khẩu bằng mã OTP
  const resetPassword = async (email: string, otpCode: string, newPassword: string) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/api/auth/reset-password', {
        email,
        otp_code: otpCode,
        new_password: newPassword,
      });
      if (res.data.status !== 'success') {
        throw new Error(res.data.message || 'Không thể đặt lại mật khẩu.');
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || 'Đặt lại mật khẩu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  // Đổi mật khẩu bắt buộc
  const changePassword = async (oldPass: string, newPass: string) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/api/auth/change-password', {
        current_password: oldPass,
        new_password: newPass,
      });

      if (res.data.status === 'success') {
        // Cập nhật lại cờ must_change_password trong localStorage và state
        if (user) {
          const updatedUser = { ...user, must_change_password: false };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
        router.push('/dashboard');
      } else {
        throw new Error(res.data.message || 'Không thể đổi mật khẩu.');
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        verifyMfa,
        forgotPassword,
        resetPassword,
        logout,
        changePassword,
        refreshSession,
      }}
    >
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
