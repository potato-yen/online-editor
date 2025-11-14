// frontend/src/components/RegisterPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../services/api';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password.length < 6) {
      setError("密碼長度至少需要 6 個字元");
      return;
    }
    
    try {
      await api.register({ username, password });
      setSuccess('註冊成功！將導向登入頁面...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-neutral-100">
      <form onSubmit={handleSubmit} className="p-8 bg-neutral-800 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-semibold mb-6 text-center">註冊</h2>
        {error && <div className="text-red-400 mb-4 text-center">{error}</div>}
        {success && <div className="text-green-400 mb-4 text-center">{success}</div>}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-300">
            帳號
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full p-2 bg-neutral-700 rounded-md border border-neutral-600 outline-none"
              required
            />
          </label>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-300">
            密碼 (至少 6 個字元)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-2 bg-neutral-700 rounded-md border border-neutral-600 outline-none"
              required
            />
          </label>
        </div>
        <button
          type="submit"
          className="w-full px-3 py-2 rounded-md bg-neutral-100 text-neutral-900 font-semibold hover:bg-white"
        >
          註冊
        </button>
        <p className="mt-4 text-center text-sm text-neutral-400">
          已經有帳號？ <Link to="/login" className="text-neutral-100 hover:underline">登入</Link>
        </p>
      </form>
    </div>
  );
}
