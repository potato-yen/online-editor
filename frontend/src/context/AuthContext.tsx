// frontend/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { LoginCredentials } from '../types/auth';
import * as api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { DecodedUser } from '../types/auth';

interface AuthContextType {
  token: string | null;
  user: DecodedUser | null;
  isLoggedIn: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [user, setUser] = useState<DecodedUser | null>(null);

  // 當 token 改變時，自動解碼並設定 user
  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode<DecodedUser>(token);
        setUser(decoded);
      } catch (error) {
        console.error("Invalid token:", error);
        logout(); // Token 無效，強制登出
      }
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (credentials: LoginCredentials) => {
    const data = await api.login(credentials);
    localStorage.setItem('authToken', data.token);
    setToken(data.token);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
  };

  const isLoggedIn = !!token;

  return (
    <AuthContext.Provider value={{ token, user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 建立一個 Hook 方便元件使用
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
