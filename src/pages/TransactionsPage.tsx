import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { CodeBlock } from '@/components/ui/code-block'
import { Server } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { deviceApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

interface Device {
  uuid: string
  type_name: string
  status: string
}

interface Transaction {
  id: number
  tx_number: string
  device_uuid: string
  user_id: number | null
  user_info: { name: string } | null
  payment_method: string
  payment_source_id: string
  price: string
  item: string
  reason: string
  is_success: boolean
  is_sniff: boolean
  note: string | null
  time: string
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Tiền mặt',
  coin: 'Xu',
  card: 'Thẻ',
  mobile_pay: 'Ví điện tử',
  qr_code: 'Mã QR',
  other: 'Khác',
}

function TransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [devicesLoading, setDevicesLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({
    deviceUuid: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
  })

  const fetchDevices = async () => {
    if (!user?.tenant?.id) return
    try {
      setDevicesLoading(true)
      const response = await deviceApi.list({ tenant_id: user.tenant.id, is_active: true })
      const data = response as { items: Device[] }
      setDevices(data.items || [])
    } catch (err) {
      console.error('Failed to fetch devices:', err)
    } finally {
      setDevicesLoading(false)
    }
  }

  const fetchTransactions = async () => {
    if (!filters.deviceUuid) {
      setTransactions([])
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
      return
    }
    try {
      setLoading(true)
      setError('')
      const params: Record<string, unknown> = {
        pageIndex: pagination.page,
        pageSize: pagination.limit,
      }
      if (filters.paymentMethod) params.payment_method = filters.paymentMethod
      if (filters.dateFrom) params.date_from = filters.dateFrom
      if (filters.dateTo) params.date_to = filters.dateTo

      const response = await deviceApi.listTransactions(filters.deviceUuid, params)
      const data = response as { items: Transaction[]; count: number; pageIndex: number; pageSize: number; totalPages: number }
      setTransactions(data.items || [])
      setPagination(prev => ({
        ...prev,
        total: data.count,
        totalPages: data.totalPages,
      }))
    } catch (err) {
      setError('Không thể tải giao dịch')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [user?.tenant?.id])

  useEffect(() => {
    fetchTransactions()
  }, [pagination.page, pagination.limit, filters.deviceUuid, filters.paymentMethod, filters.dateFrom, filters.dateTo])

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handlePageSizeChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Giao dịch</h1>
          <p className="text-sm text-text-muted mt-1">Xem và quản lý lịch sử giao dịch</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form className="flex flex-wrap items-end gap-4" role="search">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-text-muted mb-1.5">Thiết bị</label>
              <Select
                value={filters.deviceUuid}
                onChange={(e) => handleFilterChange('deviceUuid', e.target.value)}
                options={[
                  { value: '', label: 'Chọn thiết bị' },
                  ...devices.map(d => ({ value: d.uuid, label: `${d.uuid} (${d.type_name})` })),
                ]}
                disabled={devicesLoading}
              />
            </div>
            <Select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              options={[
                { value: '', label: 'Tất cả phương thức' },
                { value: 'cash', label: 'Tiền mặt' },
                { value: 'coin', label: 'Xu' },
                { value: 'card', label: 'Thẻ' },
                { value: 'mobile_pay', label: 'Ví điện tử' },
                { value: 'qr_code', label: 'Mã QR' },
                { value: 'other', label: 'Khác' },
              ]}
            />
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-text-muted mb-1.5">Từ ngày</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-text-muted mb-1.5">Đến ngày</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 text-sm text-status-fail bg-status-fail/10 border border-status-fail/20 rounded-[4px]" role="alert">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-base">
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Số TX</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thiết bị</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Người dùng</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Phương thức</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Số tiền</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Món hàng</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                          <Server className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p>Không tìm thấy giao dịch</p>
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50">
                          <td className="px-4 py-3"><CodeBlock code={tx.tx_number} lang="text" className="inline" /></td>
                          <td className="px-4 py-3"><CodeBlock code={tx.device_uuid} lang="text" className="inline" /></td>
                          <td className="px-4 py-3">{tx.user_info?.name || <span className="text-text-muted">—</span>}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-xs font-mono bg-accent/10 text-accent border border-accent/20 rounded-[4px]">
                              {paymentMethodLabels[tx.payment_method] || tx.payment_method}
                            </span>
                          </td>
                          <td className="px-4 py-3"><CodeBlock code={formatCurrency(parseFloat(tx.price))} lang="text" className="inline" /></td>
                          <td className="px-4 py-3"><CodeBlock code={tx.item} lang="text" className="inline" /></td>
                          <td className="px-4 py-3"><StatusBadge status={tx.is_success ? 'pass' : 'fail'} /></td>
                          <td className="px-4 py-3 text-text-muted">{new Date(tx.time).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-text-muted font-mono">
                  Hiển thị {(pagination.page - 1) * pagination.limit + 1} đến {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={pagination.limit}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="h-8 px-2 text-sm font-mono bg-bg-surface border border-border-subtle rounded-[4px] focus:outline-none focus:border-accent"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <nav className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handlePageChange(1)} disabled={pagination.page === 1}>
                      <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3l-4 4 4 4M6 3l4 4-4 4"/></svg>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1}>
                      <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3l-4 4 4 4"/></svg>
                    </Button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let page = Math.max(1, pagination.page - 2) + i
                      if (page > pagination.totalPages) page = pagination.totalPages - 4 + i
                      if (page < 1) page = 1
                      return (
                        <Button
                          key={page}
                          variant={pagination.page === page ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      )
                    })}
                    <Button variant="ghost" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}>
                      <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 3l4 4-4 4"/></svg>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.page === pagination.totalPages}>
                      <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 3l4 4-4 4M8 3l-4 4 4 4"/></svg>
                    </Button>
                  </nav>
                </div>
              </CardFooter>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TransactionsPage