import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { CodeBlock } from '@/components/ui/code-block'
import { RotateCcw, CreditCard, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { refundApi, RefundTransaction, MarkRefundedRequest } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'

const refundStatusLabels: Record<string, string> = {
  required: 'Cần hoàn tiền',
  refunded: 'Đã hoàn tiền',
  failed: 'Cần hoàn tiền',
}

const vendStatusLabels: Record<string, string> = {
  failed: 'Trả hàng thất bại',
  timeout: 'Hết thời gian chờ',
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Tiền mặt',
  coin: 'Xu',
  card: 'Thẻ',
  mobile_pay: 'Ví điện tử',
  qr_code: 'Mã QR',
  other: 'Khác',
}

function RefundQueuePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [refunds, setRefunds] = useState<RefundTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({
    deviceUuid: '',
    refundStatus: 'required',
    dateFrom: '',
    dateTo: '',
  })
  const [markingRefunded, setMarkingRefunded] = useState<Record<string, boolean>>({})
  const [refundNotes, setRefundNotes] = useState<Record<string, string>>({})

  const fetchRefunds = async () => {
    if (!user?.tenant?.id) {
      setRefunds([])
      setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }))
      return
    }
    try {
      setLoading(true)
      setError('')
      const apiPageSize = Math.min(pagination.limit, 100)
      const params: Record<string, unknown> = {
        pageIndex: pagination.page,
        pageSize: apiPageSize,
        tenant_id: user.tenant.id,
      }
      if (filters.deviceUuid) params.device_uuid = filters.deviceUuid
      if (filters.refundStatus) params.refund_status = filters.refundStatus
      if (filters.dateFrom) params.date_from = filters.dateFrom
      if (filters.dateTo) params.date_to = filters.dateTo

      const response = await refundApi.list(params)
      const data = response as { items: RefundTransaction[]; count: number; pageIndex: number; pageSize: number; totalPages: number }
      setRefunds(data.items || [])
      setPagination(prev => ({
        ...prev,
        total: data.count,
        totalPages: data.totalPages,
      }))
    } catch (err) {
      setError('Không thể tải hàng đợi hoàn tiền')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRefunds()
  }, [pagination.page, pagination.limit, filters.deviceUuid, filters.refundStatus, filters.dateFrom, filters.dateTo, user?.tenant?.id])

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

  const handleMarkRefunded = async (txNumber: string) => {
    const note = refundNotes[txNumber]?.trim()
    if (!note) {
      toast({ title: 'Vui lòng nhập ghi chú hoàn tiền', variant: 'destructive' })
      return
    }

    setMarkingRefunded(prev => ({ ...prev, [txNumber]: true }))
    try {
      const data: MarkRefundedRequest = {
        note,
        tenant_id: user?.tenant?.id,
      }
      await refundApi.markRefunded(txNumber, data)
      toast({ title: 'Đã đánh dấu hoàn tiền', description: `Giao dịch ${txNumber} đã được cập nhật` })
      fetchRefunds()
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể đánh dấu hoàn tiền'
      toast({ title: 'Lỗi', description: message, variant: 'destructive' })
    } finally {
      setMarkingRefunded(prev => ({ ...prev, [txNumber]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text-primary flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-status-warning" />
            Hàng đợi hoàn tiền
          </h1>
          <p className="text-sm text-text-muted mt-1">Quản lý các giao dịch cần hoàn tiền cho khách hàng</p>
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
                ]}
              />
            </div>
            <Select
              value={filters.refundStatus}
              onChange={(e) => handleFilterChange('refundStatus', e.target.value)}
              options={[
                { value: 'required', label: 'Chưa hoàn' },
                { value: 'refunded', label: 'Đã hoàn' },
                { value: 'failed', label: 'Chưa hoàn' },
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
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Số TX</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thiết bị</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Số tiền</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Món hàng</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Phương thức</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Lý do lỗi</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái trả hàng</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái hoàn tiền</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thời gian</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center text-text-muted">
                          <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p>Không tìm thấy giao dịch cần hoàn tiền</p>
                        </td>
                      </tr>
                    ) : (
                      refunds.map((tx) => (
                        <tr key={tx.id} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50">
                          <td className="px-4 py-3"><CodeBlock code={tx.tx_number} lang="text" className="inline" /></td>
                          <td className="px-4 py-3"><CodeBlock code={tx.device_uuid} lang="text" className="inline" /></td>
                          <td className="px-4 py-3"><CodeBlock code={formatCurrency(parseFloat(tx.price))} lang="text" className="inline" /></td>
                          <td className="px-4 py-3"><CodeBlock code={tx.item} lang="text" className="inline" /></td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 text-xs font-mono bg-accent/10 text-accent border border-accent/20 rounded-[4px]">
                              {paymentMethodLabels[tx.payment_method] || tx.payment_method}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-muted"><CodeBlock code={tx.reason || '—'} lang="text" className="inline" /></td>
                          <td className="px-4 py-3">
                            {(() => {
                              const status = tx.vend_status
                              if (!status || status === 'pending') {
                                return <StatusBadge status="pending" label="N/A" />
                              }
                              if (status === 'success') {
                                return <StatusBadge status="pass" label="OK" />
                              }
                              return <StatusBadge status="fail" label="Error" />
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const status = tx.refund_status || 'none'
                              if (status === 'none' || !status) {
                                return <StatusBadge status="pending" label="N/A" />
                              }
                              if (status === 'required' || status === 'failed') {
                                return <StatusBadge status="fail" label="Chưa hoàn" />
                              }
                              if (status === 'refunded') {
                                return <StatusBadge status="pass" label="Đã hoàn" />
                              }
                              return <StatusBadge status="pending" label="N/A" />
                            })()}
                          </td>
                          <td className="px-4 py-3 text-text-muted">{new Date(tx.time).toLocaleString('vi-VN')}</td>
                          <td className="px-4 py-3">
                            {tx.refund_status === 'required' ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  placeholder="Ghi chú hoàn tiền..."
                                  value={refundNotes[tx.tx_number] || ''}
                                  onChange={(e) => setRefundNotes(prev => ({ ...prev, [tx.tx_number]: e.target.value }))}
                                  className="w-48"
                                  disabled={markingRefunded[tx.tx_number]}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleMarkRefunded(tx.tx_number)}
                                  disabled={markingRefunded[tx.tx_number]}
                                  className="gap-1.5"
                                >
                                  {markingRefunded[tx.tx_number] ? (
                                    <RotateCcw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <RotateCcw className="h-4 w-4" />
                                      Đánh dấu hoàn tiền
                                    </>
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-text-muted text-sm">—</span>
                            )}
                          </td>
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

export default RefundQueuePage