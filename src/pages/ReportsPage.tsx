import { useState, useEffect } from 'react'
import { reportApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SectionLabel } from '@/components/ui/card'
import { CodeBlock } from '@/components/ui/code-block'
import { MetricCard } from '@/components/ui/metric-card'
import { FileText, Server } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ReportItem {
  device_uuid: string
  payment_method: string
  transaction_count: number
  total_sales: string
  tenant?: { name: string }
}

interface ReportResponse {
  tenant_id: number
  total_sales: string
  transaction_count: number
  external_total_sales: string
  external_transaction_count: number
  by_device: Array<{ device_uuid: string; total_sales: string; transaction_count: number }>
  by_external_device: Array<{ device_sn: string; total_sales: string; transaction_count: number }>
  by_payment_method: Array<{ payment_method: string; total_sales: string; transaction_count: number }>
  by_external_payment_method: Array<{ pay_method: string; total_sales: string; transaction_count: number }>
}

function ReportsPage() {
  const [reportData, setReportData] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    deviceUuid: '',
    dateFrom: '',
    dateTo: '',
  })
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalTransactions: 0,
    byPaymentMethod: {} as Record<string, number>,
    byDevice: {} as Record<string, number>,
  })

  const fetchReport = async () => {
    try {
      setLoading(true)
      setError('')
      const params: Record<string, string> = {}
      if (filters.deviceUuid) params.device_uuid = filters.deviceUuid
      if (filters.dateFrom) params.date_from = filters.dateFrom
      if (filters.dateTo) params.date_to = filters.dateTo
      
      const response = await reportApi.sales(params)
      const data = response as ReportResponse
      
      // Transform the response to match the expected format
      const items: ReportItem[] = [
        ...data.by_device.map(d => ({
          device_uuid: d.device_uuid,
          payment_method: 'all',
          transaction_count: d.transaction_count,
          total_sales: d.total_sales,
        })),
        ...data.by_external_device.map(d => ({
          device_uuid: d.device_sn,
          payment_method: 'all',
          transaction_count: d.transaction_count,
          total_sales: d.total_sales,
        })),
        ...data.by_payment_method.map(p => ({
          device_uuid: 'all',
          payment_method: p.payment_method,
          transaction_count: p.transaction_count,
          total_sales: p.total_sales,
        })),
      ]
      
      setReportData(items)
      
      const totalSales = parseFloat(data.total_sales || '0') + parseFloat(data.external_total_sales || '0')
      const totalTransactions = data.transaction_count + data.external_transaction_count
      
      const byPaymentMethod: Record<string, number> = {}
      const byDevice: Record<string, number> = {}
      
      data.by_payment_method.forEach(item => {
        byPaymentMethod[item.payment_method] = parseFloat(item.total_sales || '0')
      })
      data.by_external_payment_method.forEach(item => {
        byPaymentMethod[item.pay_method] = (byPaymentMethod[item.pay_method] || 0) + parseFloat(item.total_sales || '0')
      })
      data.by_device.forEach(item => {
        byDevice[item.device_uuid] = parseFloat(item.total_sales || '0')
      })
      data.by_external_device.forEach(item => {
        byDevice[item.device_sn] = (byDevice[item.device_sn] || 0) + parseFloat(item.total_sales || '0')
      })
      
      setSummary({ totalSales, totalTransactions, byPaymentMethod, byDevice })
    } catch (err) {
      setError('Không thể tải báo cáo doanh thu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [filters.deviceUuid, filters.dateFrom, filters.dateTo])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Báo cáo doanh thu</h1>
          <p className="text-sm text-text-muted mt-1">Xem hiệu suất bán hàng và phân tích</p>
        </div>
      </div>

      <SectionLabel>tóm tắt</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard value={formatCurrency(summary.totalSales)} label="Tổng doanh thu" />
        <MetricCard value={summary.totalTransactions.toLocaleString()} label="Tổng giao dịch" />
        <MetricCard value={Object.keys(summary.byPaymentMethod).length} label="Phương thức thanh toán" />
        <MetricCard value={Object.keys(summary.byDevice).length} label="Thiết bị hoạt động" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <form className="flex flex-wrap items-end gap-4" onSubmit={(e) => e.preventDefault()}>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-text-muted mb-1.5">UUID thiết bị</label>
              <Input
                placeholder="Lọc theo UUID thiết bị"
                value={filters.deviceUuid}
                onChange={(e) => handleFilterChange('deviceUuid', e.target.value)}
              />
            </div>
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-text-muted mb-1.5">Từ ngày</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-text-muted mb-1.5">Đến ngày</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
            <Button type="button" onClick={fetchReport} disabled={loading} className="h-9">
              {loading ? 'Đang tải...' : 'Áp dụng bộ lọc'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 text-sm text-status-fail bg-status-fail/10 border border-status-fail/20 rounded-[4px]" role="alert">
          {error}
        </div>
      )}

      <SectionLabel>doanh thu theo phương thức thanh toán</SectionLabel>
      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-base">
                  <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Phương thức thanh toán</th>
                  <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tổng doanh thu</th>
                  <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.byPaymentMethod).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-text-muted">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p>Không có dữ liệu</p>
                    </td>
                  </tr>
                ) : (
                  Object.entries(summary.byPaymentMethod).map(([method, amount]) => (
                    <tr key={method} className="border-b border-border-subtle/50">
                      <td className="px-4 py-3">{method}</td>
                      <td className="px-4 py-3"><CodeBlock code={formatCurrency(amount)} lang="text" className="inline" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-bg-base rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent rounded-full transition-all duration-300"
                              style={{ width: `${summary.totalSales > 0 ? (amount / summary.totalSales * 100) : 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-text-muted font-mono w-16 text-right">
                            {summary.totalSales > 0 ? ((amount / summary.totalSales * 100).toFixed(1)) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <SectionLabel>doanh thu theo thiết bị</SectionLabel>
      <Card>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-base">
                  <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">UUID thiết bị</th>
                  <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tổng doanh thu</th>
                  <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary.byDevice).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-text-muted">
                      <Server className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p>Không có dữ liệu</p>
                    </td>
                  </tr>
                ) : (
                  Object.entries(summary.byDevice).map(([device, amount]) => (
                    <tr key={device} className="border-b border-border-subtle/50">
                      <td className="px-4 py-3"><CodeBlock code={device} lang="text" className="inline" /></td>
                      <td className="px-4 py-3"><CodeBlock code={formatCurrency(amount)} lang="text" className="inline" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-bg-base rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent rounded-full transition-all duration-300"
                              style={{ width: `${summary.totalSales > 0 ? (amount / summary.totalSales * 100) : 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-text-muted font-mono w-16 text-right">
                            {summary.totalSales > 0 ? ((amount / summary.totalSales * 100).toFixed(1)) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <SectionLabel>chi tiết dữ liệu doanh thu</SectionLabel>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-base">
                  <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">UUID thiết bị</th>
                  <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Phương thức thanh toán</th>
                  <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Số giao dịch</th>
                  <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tổng doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-text-muted">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p>Không có dữ liệu doanh thu</p>
                    </td>
                  </tr>
                ) : (
                  reportData.map((item, index) => (
                    <tr key={index} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50">
                      <td className="px-4 py-3"><CodeBlock code={item.device_uuid} lang="text" className="inline" /></td>
                      <td className="px-4 py-3">{item.payment_method}</td>
                      <td className="px-4 py-3">{item.transaction_count}</td>
                      <td className="px-4 py-3"><CodeBlock code={formatCurrency(parseFloat(item.total_sales))} lang="text" className="inline" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportsPage