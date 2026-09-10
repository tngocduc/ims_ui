import { useState } from 'react'
import { Link, useLocation, NavLink, Outlet } from 'react-router-dom'
import { ChevronLeft, LayoutDashboard, Users, Server, Activity, BarChart2, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function Layout() {
  const { user, logout, loginType, isAdmin, isTenantAdmin } = useAuth()
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navItems = isAdmin ? [
    { path: '/admin/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Người dùng', icon: Users },
    { path: '/admin/devices', label: 'Thiết bị', icon: Server },
    { path: '/admin/transactions', label: 'Giao dịch', icon: Activity },
    { path: '/admin/reports', label: 'Báo cáo', icon: BarChart2 },
  ] : isTenantAdmin ? [
    { path: '/dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
    { path: '/users', label: 'Người dùng', icon: Users },
    { path: '/devices', label: 'Thiết bị', icon: Server },
    { path: '/transactions', label: 'Giao dịch', icon: Activity },
    { path: '/reports', label: 'Báo cáo', icon: BarChart2 },
  ] : []

  const handleLogout = async () => {
    await logout()
    window.location.href = loginType === 'admin' ? '/admin' : '/'
  }

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-bg-surface border-r border-border-subtle transition-all duration-200 flex flex-col',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
        <div className="flex h-14 items-center justify-between px-3 border-b border-border-subtle">
          {!sidebarCollapsed && (
            <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[4px] bg-accent flex items-center justify-center">
                <Server className="h-5 w-5 text-bg-base" />
              </div>
              <span className="font-medium text-text-primary">IMS Hub</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 rounded-[4px] text-sm font-mono transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent border-l-2 border-accent'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-surface-hover',
                sidebarCollapsed && 'justify-center'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border-subtle">
          {!sidebarCollapsed && user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="text-xs font-medium text-accent">
                  {user.first_name?.[0] || user.username[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">
                  {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                </p>
                <p className="text-[10px] text-text-muted capitalize">
                  {isAdmin ? 'Quản trị viên' : 'Admin Tenant'}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && <span>Đăng xuất</span>}
          </Button>
        </div>
      </aside>

      <main className={cn(
        'flex-1 flex flex-col overflow-hidden transition-all duration-200',
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      )}>
        <header className="h-12 bg-bg-surface border-b border-border-subtle flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-medium text-text-primary">
              {navItems.find(i => i.path === location.pathname)?.label || 'Bảng điều khiển'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 text-xs font-mono bg-accent/10 text-accent border border-accent/20 rounded-[4px]">
              {loginType === 'admin' ? 'Quản trị toàn cục' : `Tenant: ${user?.tenant?.name || 'N/A'}`}
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}