import { useState, useEffect } from 'react'
import { tenantApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { CodeBlock } from '@/components/ui/code-block'
import { Search, Building2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { DeviceTransaction } from '@/lib/api'

interface TenantOption {
  id: number
  name: string
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Tiền mặt',
  coin: 'Xu',
  card: 'Thẻ',
  mobile_pay: 'Ví điện tử',
  qr_code: 'Mã QR',
  other: 'Khác',
}

const vendStatusLabels: Record<string, string> = {
  pending: 'Đang chờ trả hàng',
  success: 'Đã trả hàng',
  failed: 'Trả hàng thất bại',
  timeout: 'Hết thời gian chờ',
}

const refundStatusLabels: Record<string, string> = {
  none: 'N/A',
  required: 'Cần hoàn tiền',
  refunded: 'Đã hoàn tiền',
  failed: 'Cần hoàn tiền',
}

function getTransactionStatusLabel(tx: DeviceTransaction): { label: string; variant: 'pass' | 'fail' | 'pending' } {
  if (tx.is_success && tx.vend_status === 'success') {
    return { label: 'Hoàn tất', variant: 'pass' }
  }
  if (tx.vend_status === 'pending') {
    return { label: 'Đã thanh toán, chờ trả hàng', variant: 'pending' }
  }
  if (tx.vend_status === 'failed' && tx.refund_status === 'required') {
    return { label: 'Cần hoàn tiền', variant: 'fail' }
  }
  if (tx.vend_status === 'timeout' && tx.refund_status === 'required') {
    return { label: 'Cần hoàn tiền (timeout)', variant: 'fail' }
  }
  if (tx.refund_status === 'refunded') {
    return { label: 'Đã hoàn tiền', variant: 'pass' }
  }
  return { label: tx.is_success ? 'Thành công' : 'Thất bại', variant: tx.is_success ? 'pass' : 'fail' }
}

function AdminTransactionsPage() {
  const [tenants, setTenants] = useState<TenantOption[]>([])
  const [transactions, setTransactions] = useState<DeviceTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({
    tenantId: '',
    search: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: '',
    vendStatus: '',
    refundStatus: '',
  })

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await tenantApi.list({ pageSize: 100 })
      setTenants(response.items || [])
    } catch (err) {
      console.error('Không thể tải danh sách tenant', err)
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError('')
      // Note: Transaction list endpoint would need to be implemented in backend
      // For now using mock data
      setTransactions([])
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
    } catch (err) {
      setError('Không thể tải giao dịch')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [pagination.pageIndex, pagination.pageSize, filters.tenantId])

  const handlePageChange = (pageIndex: number) => {
    setPagination(prev => ({ ...prev, pageIndex }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, pageIndex: 1 }))
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, pageIndex: 1 }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Tất cả giao dịch</h1>
          <p className="text-sm text-text-muted mt-1">Xem giao dịch trên tất cả tenant</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form className="flex flex-wrap items-center gap-4" role="search">
            <div className="min-w-[180px]">
              <Select
                value={filters.tenantId}
                onChange={(e) => handleFilterChange('tenantId', e.target.value)}
                options={[
                  { value: '', label: 'Tất cả tenant' },
                  ...tenants.map(t => ({ value: String(t.id), label: t.name })),
                ]}
              />
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Tìm theo số TX..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
                autoComplete="off"
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
            <Select
              value={filters.vendStatus}
              onChange={(e) => handleFilterChange('vendStatus', e.target.value)}
              options={[
                { value: '', label: 'Tất cả trạng thái trả hàng' },
                { value: 'pending', label: 'Đang chờ' },
                { value: 'success', label: 'Thành công' },
                { value: 'failed', label: 'Thất bại' },
                { value: 'timeout', label: 'Timeout' },
              ]}
            />
            <Select
              value={filters.refundStatus}
              onChange={(e) => handleFilterChange('refundStatus', e.target.value)}
              options={[
                { value: '', label: 'Tất cả trạng thái hoàn tiền' },
                { value: 'none', label: 'N/A' },
                { value: 'required', label: 'Cần hoàn tiền' },
                { value: 'refunded', label: 'Đã hoàn tiền' },
                { value: 'failed', label: 'Cần hoàn tiền' },
              ]}
            />
            <Input
              type="date"
              placeholder="Từ"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
            <Input
              type="date"
              placeholder="Đến"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
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
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tenant</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thiết bị</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Người dùng</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Phương thức</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Số tiền</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Món hàng</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Lý do</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái trả hàng</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái hoàn tiền</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-4 py-12 text-center text-text-muted">
                          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p>Không tìm thấy giao dịch</p>
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50">
                          <td className="px-4 py-3"><CodeBlock code={tx.tx_number} lang="text" className="inline" /></td>
                          <td className="px-4 py-3">{tx.tenant?.name || 'N/A'}</td>
                          <td className="px-4 py-3"><CodeBlock code={tx.device_uuid} lang="text" className="inline" /></td>
                          <td className="px-4 py-3">{tx.user_info?.provider_payment_id || <span className="text-text-muted">—</span>}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-xs font-mono bg-accent/10 text-accent border border-accent/20 rounded-[4px]">
                              {paymentMethodLabels[tx.payment_method] || tx.payment_method}
                            </span>
                          </td>
                          <td className="px-4 py-3"><CodeBlock code={formatCurrency(parseFloat(tx.price))} lang="text" className="inline" /></td>
                          <td className="px-4 py-3"><CodeBlock code={tx.item} lang="text" className="inline" /></td>
                          <td className="px-4 py-3 text-text-muted"><CodeBlock code={tx.reason || '—'} lang="text" className="inline" /></td>
                          <td className="px-4 py-3">
                            <StatusBadge status={tx.vend_status === 'success' ? 'pass' : tx.vend_status === 'pending' ? 'pending' : 'fail'}>
                              {vendStatusLabels[tx.vend_status] || tx.vend_status}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const status = tx.refund_status || 'none'
                              if (status === 'none' || !status) {
                                return <StatusBadge status="pending">N/A</StatusBadge>
                              }
                              if (status === 'required' || status === 'failed') {
                                return <StatusBadge status="fail">Cần hoàn tiền</StatusBadge>
                              }
                              if (status === 'refunded') {
                                return <StatusBadge status="pass">Đã hoàn tiền</StatusBadge>
                              }
                              return <StatusBadge status="pending">{refundStatusLabels[status] || status}</StatusBadge>
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const { label, variant } = getTransactionStatusLabel(tx)
                              return <StatusBadge status={variant}>{label}</StatusBadge>
                            })()}
                          </td>
                          <td className="px-4 py-3 text-text-muted">{new Date(tx.time).toLocaleString('vi-VN')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <CardFooter className="flex items-center justify-between">
                <div className="text-sm text-text-muted font-mono">
                  Hiển thị {(pagination.pageIndex - 1) * pagination.pageSize + 1} đến {Math.min(pagination.pageIndex * pagination.pageSize, pagination.total)} của {pagination.total}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={pagination.pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="h-8 px-2 text-sm font-mono bg-bg-surface border border-border-subtle rounded-[4px] focus:outline-none focus:border-accent"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <nav className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handlePageChange(1)} disabled={pagination.pageIndex === 1}>
                      <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3l-4 4 4 4M6 3l4 4-4 4"/></svg>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handlePageChange(pagination.pageIndex - 1)} disabled={pagination.pageIndex === 1}>
                      <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3l-4 4 4 4"/></svg>
                    </Button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let page = Math.max(1, pagination.pageIndex - 2) + i
                      if (page > pagination.totalPages) page = pagination.totalPages - 4 + i
                      if (page < 1) page = 1
                      return (
                        <Button
                          key={page}
                          variant={pagination.pageIndex === page ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      )
                    })}
                    <Button variant="ghost" size="sm" onClick={() => handlePageChange(pagination.pageIndex + 1)} disabled={pagination.pageIndex === pagination.totalPages}>
                      <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 3l4 4-4 4"/></svg>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handlePageChange(pagination.totalPages)} disabled={pagination.pageIndex === pagination.totalPages}>
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

export default AdminTransactionsPage