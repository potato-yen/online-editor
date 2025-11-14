// frontend/src/types/auth.ts

// 登入用的資料
export interface LoginCredentials {
  username: string;
  password: string;
}

// 註冊用的資料
export interface RegisterCredentials extends LoginCredentials {}

// 從 Token 解碼出來的使用者資訊
export interface DecodedUser {
  id: number;
  username: string;
  iat: number; // Issued At
  exp: number; // Expires At
}
