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
import RfidCardsPage from '@/pages/RfidCardsPage'
import ExternalDevicesPage from '@/pages/ExternalDevicesPage'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminTenantsPage from '@/pages/admin/AdminTenantsPage'
import AdminTenantAdminsPage from '@/pages/admin/AdminTenantAdminsPage'
import AdminDevicesPage from '@/pages/admin/AdminDevicesPage'
import AdminExternalDevicesPage from '@/pages/admin/AdminExternalDevicesPage'
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

      {/* Protected tenant admin routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['tenant']} loginPath="/">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/rfid-cards" element={<RfidCardsPage />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/external-devices" element={<ExternalDevicesPage />} />
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
        <Route path="/admin/tenants" element={<AdminTenantsPage />} />
        <Route path="/admin/tenant-admins" element={<AdminTenantAdminsPage />} />
        <Route path="/admin/devices" element={<AdminDevicesPage />} />
        <Route path="/admin/external-devices" element={<AdminExternalDevicesPage />} />
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