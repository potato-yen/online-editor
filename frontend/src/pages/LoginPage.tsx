import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 如果已經登入，就直接丟去 /projects
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate('/projects', { replace: true })
      }
    })
  }, [navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/projects', { replace: true })
  }

  return (
    <div className="h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
      <div className="w-full max-w-md border border-neutral-800 rounded-xl p-6 bg-neutral-900/70 shadow-lg">
        <h1 className="text-xl font-semibold mb-2">登入 Online Editor</h1>
        <p className="text-xs text-neutral-400 mb-6">
          使用 email / password 登入，登入後可以管理你的文檔。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-neutral-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-neutral-950 border border-neutral-700 text-sm outline-none focus:border-neutral-300"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-neutral-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-neutral-950 border border-neutral-700 text-sm outline-none focus:border-neutral-300"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 px-3 py-2 rounded-md bg-neutral-100 text-neutral-900 text-sm font-medium hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? '登入中…' : '登入'}
          </button>
        </form>

        <div className="mt-4 text-xs text-neutral-400 flex justify-between">
          <span>還沒有帳號？</span>
          <Link to="/signup" className="text-neutral-200 hover:underline">
            前往註冊
          </Link>
        </div>
      </div>
    </div>
  )
}