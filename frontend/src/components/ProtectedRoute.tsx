// frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    // 使用者未登入，導向 /login
    return <Navigate to="/login" replace />;
  }

  // 使用者已登入，顯示子路由 (即 <EditorPage />)
  return <Outlet />;
}
