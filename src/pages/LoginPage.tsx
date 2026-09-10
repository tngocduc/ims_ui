import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Server, Eye, EyeOff } from 'lucide-react'

function LoginPage() {
  const { login, sessionLogin } = useAuth()
  const [formData, setFormData] = useState({
    tenant_id: '',
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSessionLogin, setIsSessionLogin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isSessionLogin) {
        await sessionLogin(formData.username, formData.password, 'tenant')
      } else {
        await login(formData.username, formData.password, 'tenant')
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base p-4">
      <div className="w-full max-w-md">
        <Card className="bg-bg-surface border-border-subtle">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-12 h-12 rounded-[4px] bg-accent flex items-center justify-center">
              <Server className="h-7 w-7 text-bg-base" />
            </div>
            <CardTitle className="text-xl font-medium">Đăng nhập Tenant</CardTitle>
            <CardDescription>Nhập thông tin đăng nhập để truy cập bảng điều khiển</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="ID Tenant"
                name="tenant_id"
                value={formData.tenant_id}
                onChange={handleChange}
                placeholder="Nhập ID tenant"
                required
                disabled={loading}
                autoComplete="organization"
              />
              <Input
                label="Tên đăng nhập"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Nhập tên đăng nhập"
                required
                disabled={loading}
                autoComplete="username"
              />
              <div className="relative flex items-center">
                <Input
                  label="Mật khẩu"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-text-muted hover:text-text-primary transition-colors"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <div className="p-3 text-sm text-status-fail bg-status-fail/10 border border-status-fail/20 rounded-[4px]" role="alert">
                  {error}
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSessionLogin}
                  onChange={(e) => setIsSessionLogin(e.target.checked)}
                  className="w-4 h-4 accent-accent border-border-subtle rounded-[4px] bg-bg-surface focus:ring-2 focus:ring-accent/20"
                  disabled={loading}
                />
                <span>Đăng nhập phiên (cookie trình duyệt)</span>
              </label>

              <Button type="submit" className="w-full" loading={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage