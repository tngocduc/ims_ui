import { useState, useEffect } from 'react'
import { tenantUserApi, deviceApi } from '@/lib/api'
import { MetricCard } from '@/components/ui/metric-card'
import { Button } from '@/components/ui/button'
import { Plus, Server, DollarSign, BarChart2, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionLabel } from '@/components/ui/card'

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDevices: 0,
    onlineDevices: 0,
    totalBalance: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [usersRes, devicesRes] = await Promise.all([
        tenantUserApi.list({ limit: 1 }),
        deviceApi.list({ limit: 1 }),
      ])
      
      setStats({
        totalUsers: usersRes.data.total || 0,
        totalDevices: devicesRes.data.total || 0,
        onlineDevices: devicesRes.data.data?.filter((d: { status: string }) => d.status === 'online').length || 0,
        totalBalance: 0,
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
          <h1 className="text-2xl font-medium text-text-primary">Bảng điều khiển</h1>
          <p className="text-sm text-text-muted mt-1">Tổng quan tenant và thao tác nhanh</p>
        </div>
      </div>

      <SectionLabel>thống kê</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard value={stats.totalUsers} label="Tổng người dùng" />
        <MetricCard value={stats.totalDevices} label="Tổng thiết bị" />
        <MetricCard value={stats.onlineDevices} label="Thiết bị trực tuyến" />
        <MetricCard value={stats.totalBalance} label="Tổng số dư" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="primary" className="h-auto py-4 flex flex-col items-center gap-2">
                <Plus className="h-6 w-6" />
                <span className="text-sm font-mono">Thêm người dùng</span>
              </Button>
              <Button variant="secondary" className="h-auto py-4 flex flex-col items-center gap-2">
                <Server className="h-6 w-6" />
                <span className="text-sm font-mono">Đăng ký thiết bị</span>
              </Button>
              <Button variant="secondary" className="h-auto py-4 flex flex-col items-center gap-2">
                <DollarSign className="h-6 w-6" />
                <span className="text-sm font-mono">Nạp số dư</span>
              </Button>
              <Button variant="secondary" className="h-auto py-4 flex flex-col items-center gap-2">
                <BarChart2 className="h-6 w-6" />
                <span className="text-sm font-mono">Xem báo cáo</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col items-center justify-center h-40 text-text-muted">
              <Activity className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-mono">Chưa có hoạt động gần đây</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard