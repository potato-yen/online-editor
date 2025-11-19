// frontend/src/pages/LoginPage.tsx
import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// 引入我們的新元件
import AuthLayout from '../layouts/AuthLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardFooter } from '../components/ui/Card'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    <AuthLayout 
      title="登入 Online Editor" 
      subtitle="請輸入您的帳號密碼以繼續"
    >
      <Card className="border-border-subtle bg-surface-panel/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit}>
          <CardContent className="pt-6 space-y-4">
            {error && (
              <div className="p-3 text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-content-primary">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="bg-surface-base"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-content-primary">Password</label>
                {/* 未來可加忘記密碼功能 */}
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-surface-base"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              isLoading={loading}
            >
              {loading ? '登入中...' : '登入'}
            </Button>

            <div className="text-center text-sm text-content-secondary">
              還沒有帳號？{' '}
              <Link 
                to="/signup" 
                className="font-medium text-brand-DEFAULT hover:text-brand-hover hover:underline underline-offset-4"
              >
                前往註冊
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  )
}