import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { tenantApi, tenantUserApi, deviceApi, externalDeviceApi } from '@/lib/api'
import { MetricCard } from '@/components/ui/metric-card'
import { Button } from '@/components/ui/button'
import { Plus, Server, BarChart2, ShieldCheck, FileText, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionLabel } from '@/components/ui/card'

function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalTenantAdmins: 0,
    totalDevices: 0,
    onlineDevices: 0,
    totalExternalDevices: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [tenantsRes, adminsRes, devicesRes, externalDevicesRes] = await Promise.all([
        tenantApi.list({ pageSize: 1 }),
        tenantApi.listAllAdmins({ pageSize: 1 }),
        deviceApi.listStatus({ pageSize: 1 }),
        externalDeviceApi.list({ pageSize: 1 }),
      ])
      
      setStats({
        totalTenants: tenantsRes.count || 0,
        totalTenantAdmins: adminsRes.count || 0,
        totalDevices: devicesRes.count || 0,
        onlineDevices: devicesRes.items?.filter((d: { status: string }) => d.status === 'online').length || 0,
        totalExternalDevices: externalDevicesRes.count || 0,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Bảng điều khiển Admin</h1>
          <p className="text-sm text-text-muted mt-1">Tổng quan toàn hệ thống</p>
        </div>
      </div>

      <SectionLabel>thống kê</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard value={stats.totalTenants} label="Tổng tenant" />
        <MetricCard value={stats.totalTenantAdmins} label="Admin Tenant" />
        <MetricCard value={stats.totalDevices} label="Thiết bị" />
        <MetricCard value={stats.onlineDevices} label="Thiết bị trực tuyến" />
        <MetricCard value={stats.totalExternalDevices} label="Thiết bị ngoại vi" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button variant="primary" className="h-auto py-4 flex flex-col items-center gap-2">
                <Plus className="h-6 w-6" />
                <span className="text-sm font-mono">Tạo tenant</span>
              </Button>
              <Button variant="secondary" className="h-auto py-4 flex flex-col items-center gap-2">
                <ShieldCheck className="h-6 w-6" />
                <span className="text-sm font-mono">Tạo admin tenant</span>
              </Button>
              <Button variant="secondary" className="h-auto py-4 flex flex-col items-center gap-2">
                <Server className="h-6 w-6" />
                <span className="text-sm font-mono">Đăng ký thiết bị</span>
              </Button>
              <Button variant="secondary" className="h-auto py-4 flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm font-mono">Thiết bị ngoại vi</span>
              </Button>
              <Button variant="secondary" className="h-auto py-4 flex flex-col items-center gap-2">
                <BarChart2 className="h-6 w-6" />
                <span className="text-sm font-mono">Xem tất cả báo cáo</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tổng quan hệ thống</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-bg-base border border-border-subtle rounded-[4px]">
                <p className="text-xs font-mono text-text-muted uppercase tracking-wider">Người dùng Admin</p>
                <p className="text-sm font-medium text-text-primary">{user?.username || 'N/A'}</p>
              </div>
              <div className="p-3 bg-bg-base border border-border-subtle rounded-[4px]">
                <p className="text-xs font-mono text-text-muted uppercase tracking-wider">Email</p>
                <p className="text-sm font-medium text-text-primary">{user?.email || 'N/A'}</p>
              </div>
              <div className="p-3 bg-bg-base border border-border-subtle rounded-[4px]">
                <p className="text-xs font-mono text-text-muted uppercase tracking-wider">Vai trò</p>
                <p className="text-sm font-medium text-text-primary">Quản trị viên cao nhất</p>
              </div>
              <div className="p-3 bg-bg-base border border-border-subtle rounded-[4px]">
                <p className="text-xs font-mono text-text-muted uppercase tracking-wider">Trạng thái</p>
                <p className="text-sm font-medium text-status-pass flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-pass" />
                  Hoạt động
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard