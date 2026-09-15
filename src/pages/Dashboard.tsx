import { useState, useEffect } from 'react'
import { tenantUserApi, deviceApi, reportApi } from '@/lib/api'
import { MetricCard } from '@/components/ui/metric-card'
import { Button } from '@/components/ui/button'
import { Plus, Server, DollarSign, BarChart2, Activity, TrendingUp, Users, Wifi, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionLabel } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'

interface SalesReport {
  total_devices: number
  total_sales: string
  transaction_count: number
  failed_transaction_count: number
  external_total_sales: string
  external_transaction_count: number
  by_device: Array<{ device_uuid: string; total_sales: string; transaction_count: number }>
  by_external_device: Array<{ device_sn: string; total_sales: string; transaction_count: number }>
  by_payment_method: Array<{ payment_method: string; total_sales: string; transaction_count: number }>
  by_external_payment_method: Array<{ pay_method: string; total_sales: string; transaction_count: number }>
}

interface PaginatedResponse<T> {
  items: T[]
  count: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDevices: 0,
    onlineDevices: 0,
    totalBalance: 0,
    totalSales: 0,
    totalTransactions: 0,
    successTransactions: 0,
    failedTransactions: 0,
    todaySales: 0,
    todayTransactions: 0,
  })
  const [topDevices, setTopDevices] = useState<Array<{ device_uuid: string; total_sales: string; transaction_count: number }>>([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    console.log('Dashboard useEffect triggered, user:', user)
    fetchStats()
  }, [user?.tenant?.id])

  // Fetch all users across all pages (pageSize max is 100)
  const fetchAllUsers = async (): Promise<Array<{ balance: string }>> => {
    if (!user?.tenant?.id) return []
    const allUsers: Array<{ balance: string }> = []
    let pageIndex = 1
    const pageSize = 100

    while (true) {
      const response = await tenantUserApi.list({ pageIndex, pageSize })
      const data = response as PaginatedResponse<{ balance: string }>
      if (data.items?.length) {
        allUsers.push(...data.items)
      }
      if (pageIndex >= (data.totalPages || 1)) break
      pageIndex++
    }
    return allUsers
  }

  // Fetch all device statuses across all pages (pageSize max is 100)
  const fetchAllDeviceStatuses = async (): Promise<Array<{ status: string }>> => {
    if (!user?.tenant?.id) return []
    const allDevices: Array<{ status: string }> = []
    let pageIndex = 1
    const pageSize = 100

    while (true) {
      const response = await deviceApi.listStatus({ pageIndex, pageSize })
      const data = response as PaginatedResponse<{ status: string }>
      if (data.items?.length) {
        allDevices.push(...data.items)
      }
      if (pageIndex >= (data.totalPages || 1)) break
      pageIndex++
    }
    return allDevices
  }

  const fetchStats = async () => {
    if (!user?.tenant?.id) {
      setDebugInfo('No tenant ID in user: ' + JSON.stringify(user?.tenant))
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setDebugInfo(`Fetching for tenant ID: ${user.tenant.id}`)
      // Use tenant-scoped endpoints (auto-scoped via JWT)
      const [usersRes, devicesRes, salesRes] = await Promise.all([
        tenantUserApi.list({ pageSize: 1 }),
        deviceApi.listStatus({ pageSize: 1 }),
        reportApi.sales({ pageSize: 1 }),
      ])
      
      console.log('usersRes:', usersRes)
      console.log('devicesRes:', devicesRes)
      console.log('salesRes:', salesRes)
      setDebugInfo(`usersRes: ${JSON.stringify(usersRes, null, 2)} | devicesRes: ${JSON.stringify(devicesRes, null, 2)} | salesRes: ${JSON.stringify(salesRes, null, 2)}`)
      
      // Fetch all users to calculate total balance (paginated)
      const allUsers = await fetchAllUsers()
      console.log('allUsers count:', allUsers.length)
      setDebugInfo(prev => prev + ` | allUsers count: ${allUsers.length}`)
      const totalBalance = allUsers.reduce((sum, u) => sum + parseFloat(u.balance || '0'), 0)

      const salesData = salesRes as SalesReport
      const totalSales = parseFloat(salesData.total_sales || '0') + parseFloat(salesData.external_total_sales || '0')
      const totalTransactions = salesData.transaction_count + salesData.external_transaction_count
      // API now provides transaction_count (successful) and failed_transaction_count
      const successTransactions = salesData.transaction_count
      const failedTransactions = salesData.failed_transaction_count || 0

      // Fetch all device statuses to count online devices
      const allDeviceStatuses = await fetchAllDeviceStatuses()
      const onlineDevices = allDeviceStatuses.filter(d => d.status === 'online').length

      // Sort top devices by sales
      const sortedDevices = [...(salesData.by_device || [])].sort((a, b) => 
        parseFloat(b.total_sales || '0') - parseFloat(a.total_sales || '0')
      ).slice(0, 5)

      setStats({
        totalUsers: usersRes?.count || 0,
        totalDevices: devicesRes?.count || 0,
        onlineDevices,
        totalBalance,
        totalSales,
        totalTransactions,
        successTransactions,
        failedTransactions,
        todaySales: totalSales, // API doesn't provide today-specific, use total as placeholder
        todayTransactions: totalTransactions,
      })
      setTopDevices(sortedDevices)
    } catch (err) {
      console.error('Dashboard fetchStats error:', err)
      setDebugInfo(`Error: ${err?.response?.data?.message || err?.message || err}`)
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

      {debugInfo && (
        <div className="p-3 text-xs font-mono bg-bg-base border border-border-subtle rounded-[4px] text-text-muted">
          Debug: {debugInfo}
        </div>
      )}

      <SectionLabel>thống kê</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4">
        <MetricCard value={stats.totalUsers} label="Tổng người dùng" icon={<Users className="h-5 w-5" />} />
        <MetricCard value={stats.totalDevices} label="Tổng thiết bị" icon={<Server className="h-5 w-5" />} />
        <MetricCard value={stats.onlineDevices} label="Thiết bị trực tuyến" icon={<Wifi className="h-5 w-5" />} />
        <MetricCard value={formatCurrency(stats.totalBalance)} label="Tổng số dư" icon={<Wallet className="h-5 w-5" />} />
        <MetricCard value={formatCurrency(stats.totalSales)} label="Tổng doanh thu" icon={<DollarSign className="h-5 w-5" />} />
        <MetricCard value={stats.successTransactions.toLocaleString()} label="Giao dịch thành công" icon={<Activity className="h-5 w-5" />} />
        <MetricCard value={stats.failedTransactions.toLocaleString()} label="Giao dịch thất bại" icon={<Activity className="h-5 w-5" />} />
        <MetricCard value={stats.totalTransactions.toLocaleString()} label="Tổng giao dịch" icon={<Activity className="h-5 w-5" />} />
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
            <CardTitle>Thiết bị bán chạy nhất</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {topDevices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-text-muted">
                <Server className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm font-mono">Chưa có dữ liệu bán hàng</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topDevices.map((device, index) => (
                  <div key={device.device_uuid} className="flex items-center justify-between p-3 bg-bg-base rounded-[4px] border border-border-subtle">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center text-xs font-medium text-text-muted bg-bg-surface border border-border-subtle rounded-full">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-mono text-sm">{device.device_uuid}</p>
                        <p className="text-xs text-text-muted">{device.transaction_count} giao dịch</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-medium">{formatCurrency(parseFloat(device.total_sales || '0'))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SectionLabel>hoạt động gần đây</SectionLabel>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Giao dịch mới nhất</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col items-center justify-center h-40 text-text-muted">
            <Activity className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-mono">Chưa có hoạt động gần đây</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard