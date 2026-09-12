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
  login: (username: string, password: string, type?: 'tenant' | 'admin', rememberMe?: boolean) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isAdmin: boolean
  isTenantAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const response = await authApi.me()
      setUser(response)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (username: string, password: string, type: 'tenant' | 'admin' = 'tenant', rememberMe = false) => {
    const response = await authApi.login(username, password)
    const { access, refresh } = response
    localStorage.setItem('access_token', access)
    // Store refresh token regardless - JWT handles auth
    localStorage.setItem('refresh_token', refresh)
    await fetchUser()
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
  }

  const isAdmin = user?.is_staff || user?.is_superuser || user?.role === 'admin'
  const isTenantAdmin = user?.role === 'tenant_admin'

  const value: AuthContextType = {
    user,
    loading,
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