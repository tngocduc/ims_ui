import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { authApi } from '@/lib/api'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_superuser: boolean
  role: string
  tenant?: { id: number; name: string; address: string; extra_info: Record<string, unknown>; is_active: boolean; created_at: string; updated_at: string }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  loginType: 'tenant' | 'admin' | null
  login: (username: string, password: string, type?: 'tenant' | 'admin', rememberMe?: boolean, tenantId?: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
  isTenantAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginType, setLoginType] = useState<'tenant' | 'admin' | null>(null)

  const fetchUser = useCallback(async (): Promise<User | null> => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      console.log('No access token in localStorage')
      setLoading(false)
      return null
    }
    try {
      console.log('Fetching user with token...')
      const response = await authApi.me()
      console.log('User response:', response)
      setUser(response)
      return response
    } catch (err) {
      console.error('Failed to fetch user:', err)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (username: string, password: string, type: 'tenant' | 'admin' = 'tenant', _rememberMe = false, tenantId?: string) => {
    console.log('Login called with:', { username, type, tenantId })
    
    if (type === 'tenant' && tenantId) {
      // For tenant admin, first establish session with tenant context
      const sessionResponse = await authApi.sessionLogin(username, password, tenantId)
      console.log('Session login response:', sessionResponse)
      // Then get JWT tokens
      const tokenResponse = await authApi.login(username, password, tenantId)
      console.log('Token login response:', tokenResponse)
      const { access, refresh } = tokenResponse
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      setLoginType(type)
      // sessionResponse already has user with tenant, but let's use fetchUser for consistency
      const userData = await fetchUser()
      
      // Prevent platform admin login via tenant login page
      if (userData && (userData.is_staff || userData.is_superuser || userData.role === 'admin')) {
        await logout()
        throw new Error('Quản trị viên nền tảng không được phép đăng nhập qua trang Tenant. Vui lòng sử dụng trang đăng nhập Quản trị.')
      }
    } else {
      // Admin login - just get tokens
      const response = await authApi.login(username, password, tenantId)
      console.log('Login response:', response)
      const { access, refresh } = response
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      setLoginType(type)
      await fetchUser()
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setLoginType(null)
  }

  const isAdmin = user?.is_staff || user?.is_superuser || user?.role === 'admin'
  const isTenantAdmin = user?.role === 'tenant_admin'

  const value: AuthContextType = {
    user,
    loading,
    loginType,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin,
    isTenantAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}