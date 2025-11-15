// src/pages/AuthPage.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('') // signup 用
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setUsername('')
    setError(null)
  }

  const handleSwitchMode = (next: Mode) => {
    setMode(next)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        if (!username.trim()) {
          setError('請輸入用戶名稱')
          setLoading(false)
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
            },
          },
        })

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        // 視你的 Supabase 設定:
        // - 如果有開 email confirm，可能不會立刻有 session
        // - 這裡先簡單處理：註冊成功後導向 /projects
        if (data.session) {
          navigate('/projects')
        } else {
          // 沒有立即登入就提醒一下
          alert('註冊成功，請至信箱確認後再登入。')
          setMode('login')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        if (data.session) {
          navigate('/projects')
        }
      }
    } catch (err: any) {
      console.error(err)
      setError('發生錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
        {/* 切換 Login / Signup */}
        <div className="flex mb-6 border-b border-neutral-800">
          <button
            className={`flex-1 py-2 text-sm ${
              mode === 'login'
                ? 'text-neutral-100 border-b border-neutral-100'
                : 'text-neutral-500'
            }`}
            onClick={() => handleSwitchMode('login')}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 text-sm ${
              mode === 'signup'
                ? 'text-neutral-100 border-b border-neutral-100'
                : 'text-neutral-500'
            }`}
            onClick={() => handleSwitchMode('signup')}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-400">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-sm px-3 py-2 rounded-md bg-neutral-950 border border-neutral-700 text-neutral-100 outline-none focus:border-neutral-300"
                placeholder="你的用戶名稱"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-sm px-3 py-2 rounded-md bg-neutral-950 border border-neutral-700 text-neutral-100 outline-none focus:border-neutral-300"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400">Password</label>
            <input
              type="password"
              autoComplete={
                mode === 'signup' ? 'new-password' : 'current-password'
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-sm px-3 py-2 rounded-md bg-neutral-950 border border-neutral-700 text-neutral-100 outline-none focus:border-neutral-300"
              placeholder="至少 6 位數字或字母"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 whitespace-pre-line">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-full bg-neutral-100 text-neutral-900 text-sm font-medium border border-neutral-300 hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? mode === 'signup'
                ? 'Signing up...'
                : 'Logging in...'
              : mode === 'signup'
              ? 'Sign up'
              : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}