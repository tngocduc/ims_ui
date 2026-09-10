import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import AdminLoginPage from '@/pages/AdminLoginPage'
import Dashboard from '@/pages/Dashboard'
import UsersPage from '@/pages/UsersPage'
import DevicesPage from '@/pages/DevicesPage'
import TransactionsPage from '@/pages/TransactionsPage'
import ReportsPage from '@/pages/ReportsPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminDevicesPage from '@/pages/admin/AdminDevicesPage'
import AdminTransactionsPage from '@/pages/admin/AdminTransactionsPage'
import AdminReportsPage from '@/pages/admin/AdminReportsPage'

function ProtectedRoute({ children, allowedRoles, loginPath }: { children: React.ReactNode; allowedRoles: ('admin' | 'tenant')[]; loginPath: string }) {
  const { isAuthenticated, isAdmin, isTenantAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />
  }

  if (allowedRoles.includes('admin') && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (allowedRoles.includes('tenant') && !isTenantAdmin) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isTenantAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isAuthenticated) {
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />
    }
    if (isTenantAdmin) {
      return <Navigate to="/dashboard" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PublicRoute>
            <AdminLoginPage />
          </PublicRoute>
        }
      />

      {/* Protected tenant routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['tenant']} loginPath="/">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      {/* Protected admin routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']} loginPath="/admin">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/devices" element={<AdminDevicesPage />} />
        <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
      </Route>

      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App