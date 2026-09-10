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
  tenant?: { id: number; name: string }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  loginType: 'tenant' | 'admin' | null
  login: (username: string, password: string, type?: 'tenant' | 'admin') => Promise<void>
  sessionLogin: (username: string, password: string, type?: 'tenant' | 'admin') => Promise<void>
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

  const login = async (username: string, password: string, type: 'tenant' | 'admin' = 'tenant') => {
    const response = await authApi.login(username, password)
    const { access, refresh } = response
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    setLoginType(type)
    await fetchUser()
  }

  const sessionLogin = async (username: string, password: string, type: 'tenant' | 'admin' = 'tenant') => {
    await authApi.sessionLogin(username, password)
    setLoginType(type)
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
    setLoginType(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    loginType,
    login,
    sessionLogin,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.is_staff || user?.is_superuser || false,
    isTenantAdmin: loginType === 'tenant',
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