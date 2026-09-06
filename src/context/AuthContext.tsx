'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  checkHasAuthToken,
  getInitialAuthState,
  setClientAuthTokens,
  clearClientAuthTokens,
  InitialAuthState,
} from '@/lib/authClient';

export interface AuthContextType {
  user: any | null;
  hasToken: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  hasToken: false,
  isLoading: false,
  refreshUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<InitialAuthState>(() => getInitialAuthState());

  const refreshUser = useCallback(async () => {
    // Nếu không có token -> Chắc chắn là Guest -> Tắt loading ngay lập tức
    if (!checkHasAuthToken()) {
      setAuthState({ user: null, hasToken: false, isLoading: false });
      return;
    }

    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setAuthState({ user: data.user, hasToken: true, isLoading: false });
          setClientAuthTokens(undefined, data.user);
          return;
        }
      }
      // Hết hạn hoặc lỗi xác thực -> Xóa token và hiển thị nút Đăng nhập
      clearClientAuthTokens();
      setAuthState({ user: null, hasToken: false, isLoading: false });
    } catch {
      // Giữ profile lạc quan nếu mạng tạm gián đoạn
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    clearClientAuthTokens();
    setAuthState({ user: null, hasToken: false, isLoading: false });
    window.dispatchEvent(new CustomEvent('auth-updated', { detail: { user: null } }));
    window.dispatchEvent(new CustomEvent('user-updated', { detail: null }));
  }, []);

  useEffect(() => {
    // Chỉ fetch nếu CÓ token cần verify
    if (authState.hasToken) {
      refreshUser();
    }

    const handleAuthUpdated = (e: any) => {
      const data = e.detail;
      const userObj = data?.user || (data?.id ? data : null);
      if (userObj) {
        setAuthState({ user: userObj, hasToken: true, isLoading: false });
        setClientAuthTokens(undefined, userObj);
      } else if (data?.user === null || data === null) {
        clearClientAuthTokens();
        setAuthState({ user: null, hasToken: false, isLoading: false });
      }
    };

    window.addEventListener('auth-updated', handleAuthUpdated);
    window.addEventListener('user-updated', handleAuthUpdated);

    return () => {
      window.removeEventListener('auth-updated', handleAuthUpdated);
      window.removeEventListener('user-updated', handleAuthUpdated);
    };
  }, [authState.hasToken, refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        hasToken: authState.hasToken,
        isLoading: authState.isLoading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
