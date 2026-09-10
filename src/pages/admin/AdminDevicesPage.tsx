import { useState, useEffect } from 'react'
import { tenantApi, deviceApi, Device, Tenant } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { CodeBlock } from '@/components/ui/code-block'
import { Plus, Search, Settings, Edit, Building2 } from 'lucide-react'

interface DeviceResponse {
  items: Device[]
  count: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

function AdminDevicesPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ tenantId: '', search: '' })

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

  const fetchDevices = async () => {
    try {
      setLoading(true)
      setError('')
      const params: Record<string, string | number> = {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      }
      if (filters.tenantId) params.tenant_id = filters.tenantId
      if (filters.search) params.search = filters.search
      
      const response = await deviceApi.list(params)
      const data = response as DeviceResponse
      setDevices(data.items || [])
      setPagination(prev => ({
        ...prev,
        total: data.count || 0,
        totalPages: data.totalPages || 0,
      }))
    } catch (err) {
      setError('Khong the tai danh sach thiet bi')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [pagination.pageIndex, pagination.pageSize, filters.tenantId, filters.search])

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
          <h1 className="text-2xl font-medium text-text-primary">Tất cả thiết bị</h1>
          <p className="text-sm text-text-muted mt-1">Quản lý thiết bị trên tất cả tenant</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Đăng ký thiết bị
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form className="flex flex-wrap items-center gap-4" role="search">
            <div className="min-w-[200px]">
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
                placeholder="Tìm kiếm thiết bị..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
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
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">UUID</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tenant</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Loại</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Firmware</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Đã đăng ký</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Lần thấy cuối</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p>Không tìm thấy thiết bị</p>
                        </td>
                      </tr>
                    ) : (
                      devices.map((device) => (
                        <tr key={device.uuid} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50">
                          <td className="px-4 py-3"><CodeBlock code={device.uuid} lang="text" className="inline" /></td>
                          <td className="px-4 py-3">Tenant #{device.tenant_id}</td>
                          <td className="px-4 py-3">{device.type_name}</td>
                          <td className="px-4 py-3"><CodeBlock code={device.firmware} lang="text" className="inline" /></td>
                          <td className="px-4 py-3">
                            <StatusBadge status={
                              device.status === 'online' ? 'pass' :
                              device.status === 'offline' ? 'fail' :
                              device.status === 'maintenance' ? 'needs_review' : 'error'
                            } />
                          </td>
                          <td className="px-4 py-3 text-text-muted">{device.register_date ? new Date(device.register_date).toLocaleDateString('vi-VN') : '—'}</td>
                          <td className="px-4 py-3 text-text-muted">{device.last_seen_at ? new Date(device.last_seen_at).toLocaleString('vi-VN') : '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" title="Xem cấu hình"><Settings className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" title="Sửa"><Edit className="h-4 w-4" /></Button>
                            </div>
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
    </div>
  )
}

export default AdminDevicesPage