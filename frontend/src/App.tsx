// frontend/src/App.tsx
// (MODIFIED) - This file is now the main router

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import EditorPage from './pages/EditorPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* 登入和註冊頁面 (公開) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* 主編輯器頁面 (受保護) */}
      <Route path="/" element={<ProtectedRoute />}>
        {/* ProtectedRoute 會檢查登入狀態，如果 OK，就顯示 <EditorPage /> */}
        <Route path="/" element={<EditorPage />} />
      </Route>

      {/* 其他所有不存在的路徑都導向登入頁 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
