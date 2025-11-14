// frontend/src/services/api.ts
import { LoginCredentials, RegisterCredentials } from '../types/auth'; // (我們會在下面建立這個檔案)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * 登入
 */
export const login = async (credentials: LoginCredentials) => {
  const resp = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || 'Login failed');
  }
  return data; // { message, token, username }
};

/**
 * 註冊
 */
export const register = async (credentials: RegisterCredentials) => {
  const resp = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error || 'Registration failed');
  }
  return data; // { message, userId }
};

/**
 * 編譯 LaTeX
 */
export const compileLatex = async (source: string, token: string) => {
  const resp = await fetch(`${API_BASE_URL}/compile-latex`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ source }),
  });

  if (!resp.ok) {
     const err = await resp.json().catch(() => ({ error: 'Unknown compilation error' }));
     throw new Error(err.error || 'Compilation failed');
  }
  return resp.blob(); // 回傳 PDF blob
};
