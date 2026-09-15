import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, SectionLabel } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { CodeBlock } from '@/components/ui/code-block'
import { Server, CreditCard, QrCode } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { deviceApi, qrPaymentApi, QrPayment } from '@/lib/api'
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

type ViewMode = 'device' | 'qr'

const paymentMethodLabels: Record<string, string> = {
  cash: 'Tiền mặt',
  coin: 'Xu',
  card: 'Thẻ',
  mobile_pay: 'Ví điện tử',
  qr_code: 'Mã QR',
  other: 'Khác',
}

const qrStatusLabels: Record<string, string> = {
  pending: 'Đang chờ',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  expired: 'Hết hạn',
  refunded: 'Đã hoàn tiền',
}

function TransactionsPage() {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('device')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [qrPayments, setQrPayments] = useState<QrPayment[]>([])
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
    status: '',
    search: '',
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

  const fetchDeviceTransactions = async () => {
    if (!user?.tenant?.id) {
      setTransactions([])
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
      return
    }
    try {
      setLoading(true)
      setError('')

      const deviceUuids = filters.deviceUuid ? [filters.deviceUuid] : devices.map(d => d.uuid)

      if (deviceUuids.length === 0) {
        // No devices available yet, don't show empty - just return
        // The effect will re-run when devices are loaded
        setTransactions([])
        setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
        return
      }

      // API max pageSize is 100
      const apiPageSize = Math.min(pagination.limit * deviceUuids.length, 100)
      
      const params: Record<string, unknown> = {
        pageIndex: 1,
        pageSize: apiPageSize,
      }
      if (filters.paymentMethod) params.payment_method = filters.paymentMethod
      if (filters.dateFrom) params.date_from = filters.dateFrom
      if (filters.dateTo) params.date_to = filters.dateTo

      const responses = await Promise.all(
        deviceUuids.map(uuid => deviceApi.listTransactions(uuid, params).catch(err => {
          console.error(`Failed to fetch transactions for device ${uuid}:`, err)
          return { items: [], count: 0, pageIndex: 1, pageSize: apiPageSize, totalPages: 0 }
        }))
      )

      // Merge all transactions
      const allTransactions = responses.flatMap(r => (r as any).items || [])
      
      // Sort by time descending
      allTransactions.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      
      // Apply client-side pagination
      const total = responses.reduce((sum, r) => sum + ((r as any).count || 0), 0)
      const start = (pagination.page - 1) * pagination.limit
      const end = start + pagination.limit
      const paginatedTransactions = allTransactions.slice(start, end)

      setTransactions(paginatedTransactions)
      setPagination(prev => ({
        ...prev,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      }))
    } catch (err) {
      setError('Không thể tải giao dịch thiết bị')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchQrPayments = async () => {
    if (!user?.tenant?.id) {
      setQrPayments([])
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
      return
    }
    try {
      setLoading(true)
      setError('')
      // API max pageSize is 100
      const apiPageSize = Math.min(pagination.limit, 100)
      const params: Record<string, unknown> = {
        pageIndex: pagination.page,
        pageSize: apiPageSize,
        tenant_id: user.tenant.id,
      }
      if (filters.deviceUuid) params.device_uuid = filters.deviceUuid
      if (filters.paymentMethod) params.payment_method = filters.paymentMethod
      if (filters.status) params.status = filters.status
      if (filters.dateFrom) params.date_from = filters.dateFrom
      if (filters.dateTo) params.date_to = filters.dateTo
      if (filters.search) params.search = filters.search

      const response = await qrPaymentApi.list(params)
      const data = response as { items: QrPayment[]; count: number; pageIndex: number; pageSize: number; totalPages: number }
      setQrPayments(data.items || [])
      setPagination(prev => ({
        ...prev,
        total: data.count,
        totalPages: data.totalPages,
      }))
    } catch (err) {
      setError('Không thể tải giao dịch QR')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [user?.tenant?.id])

  useEffect(() => {
    if (viewMode === 'device') {
      fetchDeviceTransactions()
    } else {
      fetchQrPayments()
    }
  }, [viewMode, pagination.page, pagination.limit, filters.deviceUuid, filters.paymentMethod, filters.dateFrom, filters.dateTo, filters.status, filters.search, devices.length])

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
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'device' ? 'primary' : 'ghost'}
            onClick={() => { setViewMode('device'); handleFilterChange('deviceUuid', ''); }}
            className="gap-1.5"
          >
            <CreditCard className="h-4 w-4" />
            Thiết bị
          </Button>
          <Button
            variant={viewMode === 'qr' ? 'primary' : 'ghost'}
            onClick={() => { setViewMode('qr'); handleFilterChange('deviceUuid', ''); }}
            className="gap-1.5"
          >
            <QrCode className="h-4 w-4" />
            QR Payment
          </Button>
        </div>
      </div>

      {/* Filter Form */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <form className="flex flex-wrap items-end gap-4" onSubmit={(e) => e.preventDefault()}>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-text-muted mb-1.5">Thiết bị</label>
              <Select
                value={filters.deviceUuid}
                onChange={(e) => handleFilterChange('deviceUuid', e.target.value)}
                options={[
                  { value: '', label: 'Tất cả thiết bị' },
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
            {viewMode === 'qr' && (
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[
                  { value: '', label: 'Tất cả trạng thái' },
                  { value: 'pending', label: 'Đang chờ' },
                  { value: 'paid', label: 'Đã thanh toán' },
                  { value: 'failed', label: 'Thất bại' },
                  { value: 'expired', label: 'Hết hạn' },
                  { value: 'refunded', label: 'Đã hoàn tiền' },
                ]}
              />
            )}
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
            {viewMode === 'qr' && (
              <div className="min-w-[200px]">
                <label className="block text-xs font-medium text-text-muted mb-1.5">Tìm kiếm</label>
                <Input
                  placeholder="Transaction ID hoặc Order ID"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  autoComplete="off"
                />
              </div>
            )}
            <Button type="submit" disabled={loading} className="h-9">
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
                      {viewMode === 'device' ? (
                        <>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Số TX</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thiết bị</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Người dùng</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Phương thức</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Số tiền</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Món hàng</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thời gian</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Transaction ID</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Provider Order ID</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thiết bị</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Số tiền</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Phương thức</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tạo lúc</th>
                          <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thanh toán lúc</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {viewMode === 'device' ? (
                      transactions.length === 0 ? (
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
                      )
                    ) : (
                      qrPayments.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                            <QrCode className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>Không tìm thấy giao dịch QR</p>
                          </td>
                        </tr>
                      ) : (
                        qrPayments.map((p) => (
                          <tr key={p.id} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50">
                            <td className="px-4 py-3"><CodeBlock code={p.transaction_id} lang="text" className="inline" /></td>
                            <td className="px-4 py-3"><CodeBlock code={p.provider_order_id} lang="text" className="inline" /></td>
                            <td className="px-4 py-3"><CodeBlock code={p.device_uuid} lang="text" className="inline" /></td>
                            <td className="px-4 py-3"><CodeBlock code={formatCurrency(parseFloat(p.amount))} lang="text" className="inline" /></td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 text-xs font-mono bg-accent/10 text-accent border border-accent/20 rounded-[4px]">
                                {p.payment_method}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={
                                p.status === 'paid' ? 'pass' :
                                p.status === 'failed' ? 'fail' :
                                p.status === 'pending' ? 'pending' : 'pending'
                              } />
                            </td>
                            <td className="px-4 py-3 text-text-muted">{new Date(p.created_at).toLocaleString('vi-VN')}</td>
                            <td className="px-4 py-3 text-text-muted">{p.paid_at ? new Date(p.paid_at).toLocaleString('vi-VN') : <span className="text-text-muted">—</span>}</td>
                          </tr>
                        ))
                      )
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