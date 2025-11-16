// src/pages/SignupPage.tsx

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function SignupPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('') // ⭐ 新增 username 狀態
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // ⭐ 調用 Supabase 帶入 username
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(), // ⭐ 新增的部分
        },
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    // 註冊成功 → 導去登入頁或直接跳到主頁
    navigate('/login')
  }

  return (
    <div className="h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 px-4">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-sm p-6 border border-neutral-800 rounded-lg bg-neutral-900 shadow-lg"
      >
        <h1 className="text-xl font-semibold mb-6 text-center">Create Account</h1>

        {error && (
          <div className="text-red-400 text-sm mb-4">{error}</div>
        )}

        {/* Username */}
        <label className="block mb-4 text-sm">
          Username
          <input
            type="text"
            value={username}
            required
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-950 border border-neutral-700 text-neutral-100 outline-none focus:border-neutral-300"
            placeholder="輸入你的名稱"
          />
        </label>

        {/* Email */}
        <label className="block mb-4 text-sm">
          Email
          <input
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-950 border border-neutral-700 text-neutral-100 outline-none focus:border-neutral-300"
            placeholder="輸入你的 Email"
          />
        </label>

        {/* Password */}
        <label className="block mb-6 text-sm">
          Password
          <input
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-md bg-neutral-950 border border-neutral-700 text-neutral-100 outline-none focus:border-neutral-300"
            placeholder="至少 6 位密碼"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md bg-neutral-100 text-neutral-900 font-medium hover:bg-white disabled:opacity-50"
        >
          {loading ? 'Signing up…' : 'Sign up'}
        </button>

        <p className="text-sm text-neutral-400 text-center mt-4">
          已經有帳號了？
          <Link
            to="/login"
            className="text-neutral-100 underline ml-1"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}