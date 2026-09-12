import { useState, useEffect } from 'react'
import { externalDeviceApi, ExternalDevice } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { CodeBlock } from '@/components/ui/code-block'
import { Search, Server, CreditCard, FileText } from 'lucide-react'

interface ExternalDeviceResponse {
  items: ExternalDevice[]
  count: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

interface ExternalDeviceTransaction {
  id: number
  raw_data: Record<string, unknown>
  tenant_id: number
  external_device_id: number
  order_id: number
  order_no: string
  device_sn: string
  temina_id: string
  business_temina_id: string
  price: string
  pay_amount: string
  pay_method: string
  pay_status: number
  refund_status: number
  total_amount: string
  modify_at: string
  create_at: string
  created_at: string
}

interface TransactionResponse {
  items: ExternalDeviceTransaction[]
  count: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Tiền mặt',
  coin: 'Xu',
  card: 'Thẻ',
  mobile_pay: 'Ví điện tử',
  qr_code: 'Mã QR',
  other: 'Khác',
}

function ExternalDevicesPage() {
  const [devices, setDevices] = useState<ExternalDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [selectedDevice, setSelectedDevice] = useState<ExternalDevice | null>(null)
  const [showTransactions, setShowTransactions] = useState(false)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [transactions, setTransactions] = useState<ExternalDeviceTransaction[]>([])
  const [txPagination, setTxPagination] = useState({ pageIndex: 1, pageSize: 20, total: 0, totalPages: 0 })

  useEffect(() => {
    fetchDevices()
  }, [pagination.pageIndex, pagination.pageSize, search])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await externalDeviceApi.list({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        search: search || undefined,
      })
      const data = response as ExternalDeviceResponse
      setDevices(data.items || [])
      setPagination(prev => ({
        ...prev,
        total: data.count || 0,
        totalPages: data.totalPages || 0,
      }))
    } catch (err) {
      setError('Không thể tải danh sách thiết bị ngoại vi')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    if (!selectedDevice) return
    try {
      setTransactionsLoading(true)
      const response = await externalDeviceApi.listTransactions(selectedDevice.device_sn, {
        pageIndex: txPagination.pageIndex,
        pageSize: txPagination.pageSize,
      })
      const data = response as TransactionResponse
      setTransactions(data.items || [])
      setTxPagination(prev => ({
        ...prev,
        total: data.count || 0,
        totalPages: data.totalPages || 0,
      }))
    } catch (err) {
      console.error('Không thể tải giao dịch', err)
    } finally {
      setTransactionsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedDevice && showTransactions) {
      fetchTransactions()
    }
  }, [selectedDevice?.device_sn, txPagination.pageIndex, txPagination.pageSize])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPagination(prev => ({ ...prev, pageIndex: 1 }))
  }

  const handlePageChange = (pageIndex: number) => {
    setPagination(prev => ({ ...prev, pageIndex }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, pageIndex: 1 }))
  }

  const handleTxPageChange = (pageIndex: number) => {
    setTxPagination(prev => ({ ...prev, pageIndex }))
  }

  const handleTxPageSizeChange = (pageSize: number) => {
    setTxPagination(prev => ({ ...prev, pageSize, pageIndex: 1 }))
  }

  const handleViewTransactions = (device: ExternalDevice) => {
    setSelectedDevice(device)
    setShowTransactions(true)
    setTxPagination(prev => ({ ...prev, pageIndex: 1 }))
  }

  const closeTransactions = () => {
    setShowTransactions(false)
    setSelectedDevice(null)
    setTransactions([])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Thiết bị ngoại vi</h1>
          <p className="text-sm text-text-muted mt-1">Xem thiết bị TCN/Android và giao dịch</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form className="flex gap-4" role="search">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Tìm kiếm theo serial, tên, vị trí..."
                value={search}
                onChange={handleSearch}
                className="pl-10"
                autoComplete="off"
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
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Serial</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tên</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Vị trí</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Giao dịch</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Đã thanh toán</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Doanh thu</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Ngày tạo</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                          <Server className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p>Không tìm thấy thiết bị</p>
                        </td>
                      </tr>
                    ) : (
                      devices.map((device) => (
                        <tr key={device.device_sn} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50 cursor-pointer" onClick={() => handleViewTransactions(device)}>
                          <td className="px-4 py-3"><CodeBlock code={device.device_sn} lang="text" className="inline" /></td>
                          <td className="px-4 py-3 font-medium text-text-primary">{device.name || '—'}</td>
                          <td className="px-4 py-3 text-text-muted">{device.location || '—'}</td>
                          <td className="px-4 py-3">{device.stats?.transaction_count || 0}</td>
                          <td className="px-4 py-3">{device.stats?.paid_transaction_count || 0}</td>
                          <td className="px-4 py-3"><CodeBlock code={device.stats?.total_sales || '0'} lang="text" className="inline" /></td>
                          <td className="px-4 py-3">
                            <StatusBadge status={device.is_active ? 'pass' : 'fail'} />
                          </td>
                          <td className="px-4 py-3 text-text-muted">{new Date(device.created_at).toLocaleDateString('vi-VN')}</td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewTransactions(device); }} title="Xem giao dịch">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </td>
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

      {/* Transactions Modal */}
      {showTransactions && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between">
              <h2 className="text-xl font-medium">Giao dịch thiết bị: {selectedDevice.name || selectedDevice.device_sn}</h2>
              <Button variant="ghost" size="sm" onClick={closeTransactions}>
                <FileText className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {transactionsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-mono">
                    <thead>
                      <tr className="border-b border-border-subtle bg-bg-base">
                        <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Order No</th>
                        <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Phương thức</th>
                        <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Giá</th>
                        <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Đã thanh toán</th>
                        <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Terminal ID</th>
                        <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thời gian tạo</th>
                        <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thời gian sửa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                            <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p>Không có giao dịch</p>
                          </td>
                        </tr>
                      ) : (
                        transactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50">
                            <td className="px-4 py-3"><CodeBlock code={tx.order_no} lang="text" className="inline" /></td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 text-xs font-mono bg-accent/10 text-accent border border-accent/20 rounded-[4px]">
                                {paymentMethodLabels[tx.pay_method] || tx.pay_method}
                              </span>
                            </td>
                            <td className="px-4 py-3"><CodeBlock code={tx.price} lang="text" className="inline" /></td>
                            <td className="px-4 py-3"><CodeBlock code={tx.pay_amount} lang="text" className="inline" /></td>
                            <td className="px-4 py-3">
                              <StatusBadge status={tx.pay_status === 1 ? 'pass' : 'fail'} />
                            </td>
                            <td className="px-4 py-3 text-text-muted">{tx.temina_id || '—'}</td>
                            <td className="px-4 py-3 text-text-muted">{tx.create_at ? new Date(tx.create_at).toLocaleString('vi-VN') : '—'}</td>
                            <td className="px-4 py-3 text-text-muted">{tx.modify_at ? new Date(tx.modify_at).toLocaleString('vi-VN') : '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="p-4 border-t border-border-subtle flex items-center justify-between">
                <div className="text-sm text-text-muted font-mono">
                  Hiển thị {(txPagination.pageIndex - 1) * txPagination.pageSize + 1} đến {Math.min(txPagination.pageIndex * txPagination.pageSize, txPagination.total)} của {txPagination.total}
                </div>
                <nav className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleTxPageChange(1)} disabled={txPagination.pageIndex === 1}>
                    <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3l-4 4 4 4M6 3l4 4-4 4"/></svg>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleTxPageChange(txPagination.pageIndex - 1)} disabled={txPagination.pageIndex === 1}>
                    <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 3l-4 4 4 4"/></svg>
                  </Button>
                  {Array.from({ length: Math.min(5, txPagination.totalPages) }, (_, i) => {
                    let page = Math.max(1, txPagination.pageIndex - 2) + i
                    if (page > txPagination.totalPages) page = txPagination.totalPages - 4 + i
                    if (page < 1) page = 1
                    return (
                      <Button
                        key={page}
                        variant={txPagination.pageIndex === page ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => handleTxPageChange(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                  <Button variant="ghost" size="sm" onClick={() => handleTxPageChange(txPagination.pageIndex + 1)} disabled={txPagination.pageIndex === txPagination.totalPages}>
                    <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 3l4 4-4 4"/></svg>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleTxPageChange(txPagination.totalPages)} disabled={txPagination.pageIndex === txPagination.totalPages}>
                    <svg className="h-4 w-4" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 3l4 4-4 4M8 3l-4 4 4 4"/></svg>
                  </Button>
                </nav>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ExternalDevicesPage