// frontend/src/pages/SignupPage.tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// 引入新元件
import AuthLayout from '../layouts/AuthLayout'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardFooter } from '../components/ui/Card'

export default function SignupPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
        },
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    navigate('/login')
  }

  return (
    <AuthLayout 
      title="建立新帳號" 
      subtitle="加入我們，開始管理您的文檔"
    >
      <Card className="border-border-subtle bg-surface-panel/50 backdrop-blur-sm">
        <form onSubmit={handleSignup}>
          <CardContent className="pt-6 space-y-4">
            {error && (
              <div className="p-3 text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-content-primary">Username</label>
              <Input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="您的暱稱"
                className="bg-surface-base"
              />
            </div>

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
              <label className="text-sm font-medium text-content-primary">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位字元"
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
              {loading ? '註冊中...' : '註冊帳號'}
            </Button>

            <div className="text-center text-sm text-content-secondary">
              已經有帳號了？{' '}
              <Link 
                to="/login" 
                className="font-medium text-brand-DEFAULT hover:text-brand-hover hover:underline underline-offset-4"
              >
                直接登入
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </AuthLayout>
  )
}