import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

function AdminLoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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
      await login(formData.username, formData.password, 'admin', rememberMe)
      navigate('/admin/dashboard')
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
            <div className="mx-auto mb-4 w-12 h-12 rounded-[4px] bg-bg-base border border-border-subtle flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-text-primary" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-auto mb-4 text-[10px] font-mono font-medium uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 rounded-[4px]">
              Quản trị
            </div>
            <CardTitle className="text-xl font-medium">Đăng nhập</CardTitle>
            <CardDescription>Truy cập bảng điều khiển quản trị</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Tên đăng nhập"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Nhập tên đăng nhập admin"
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
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-accent border-border-subtle rounded-[4px] bg-bg-surface focus:ring-2 focus:ring-accent/20"
                  disabled={loading}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <Button type="submit" className="w-full" loading={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>

              <div className="mt-6 text-center">
                <a href="/" className="text-sm font-mono text-text-muted hover:text-accent transition-colors flex items-center justify-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại đăng nhập Tenant
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminLoginPage