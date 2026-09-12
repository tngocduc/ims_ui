import { useState, useEffect } from 'react'
import { tenantApi, externalDeviceApi, Tenant, ExternalDevice } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { CodeBlock } from '@/components/ui/code-block'
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'

interface ExternalDeviceResponse {
  items: ExternalDevice[]
  count: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

function AdminExternalDevicesPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [devices, setDevices] = useState<ExternalDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ tenantId: '', search: '' })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDevice, setEditingDevice] = useState<ExternalDevice | null>(null)
  const [formData, setFormData] = useState({
    tenant_id: '',
    device_sn: '',
    name: '',
    location: '',
    extra_info: '',
    is_active: true,
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

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
      
      const response = await externalDeviceApi.list(params)
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

  useEffect(() => {
    fetchDevices()
  }, [pagination.pageIndex, pagination.pageSize, filters.tenantId, filters.search])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
    setPagination(prev => ({ ...prev, pageIndex: 1 }))
  }

  const handleTenantFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, tenantId: e.target.value }))
    setPagination(prev => ({ ...prev, pageIndex: 1 }))
  }

  const handlePageChange = (pageIndex: number) => {
    setPagination(prev => ({ ...prev, pageIndex }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, pageIndex: 1 }))
  }

  const openCreateModal = () => {
    setFormData({ tenant_id: '', device_sn: '', name: '', location: '', extra_info: '', is_active: true })
    setFormError('')
    setShowCreateModal(true)
  }

  const openEditModal = (device: ExternalDevice) => {
    setEditingDevice(device)
    setFormData({
      tenant_id: String(device.tenant_id),
      device_sn: device.device_sn,
      name: device.name,
      location: device.location,
      extra_info: JSON.stringify(device.extra_info || {}, null, 2),
      is_active: device.is_active,
    })
    setFormError('')
    setShowEditModal(true)
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setEditingDevice(null)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    try {
      let extraInfo = {}
      try {
        extraInfo = JSON.parse(formData.extra_info || '{}')
      } catch {
        throw new Error('extra_info phải là JSON hợp lệ')
      }

      const data = {
        tenant_id: Number(formData.tenant_id),
        device_sn: formData.device_sn,
        name: formData.name,
        location: formData.location,
        extra_info: extraInfo,
        is_active: formData.is_active,
      }

      if (showCreateModal) {
        await externalDeviceApi.create(data)
      } else if (editingDevice) {
        await externalDeviceApi.update(editingDevice.device_sn, data)
      }
      closeModals()
      fetchDevices()
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setFormError(axiosError.response?.data?.message || 'Thao tác thất bại')
    } finally {
      setFormLoading(false)
    }
  }

  const handleActivate = async (deviceSn: string) => {
    if (!window.confirm('Kích hoạt thiết bị này?')) return
    try {
      await externalDeviceApi.update(deviceSn, { is_active: true })
      fetchDevices()
    } catch (err) {
      console.error('Không thể kích hoạt thiết bị', err)
    }
  }

  const handleDeactivate = async (deviceSn: string) => {
    if (!window.confirm('Vô hiệu hóa thiết bị này?')) return
    try {
      await externalDeviceApi.delete(deviceSn)
      fetchDevices()
    } catch (err) {
      console.error('Không thể vô hiệu hóa thiết bị', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Thiết bị ngoại vi</h1>
          <p className="text-sm text-text-muted mt-1">Quản lý thiết bị TCN/Android trên tất cả tenant</p>
        </div>
        <Button onClick={openCreateModal}>
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
                onChange={handleTenantFilterChange}
                options={[
                  { value: '', label: 'Tất cả tenant' },
                  ...tenants.map(t => ({ value: String(t.id), label: t.name })),
                ]}
              />
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Tìm kiếm theo serial, tên..."
                value={filters.search}
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
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tenant</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tên</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Vị trí</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Giao dịch</th>
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
                          <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p>Không tìm thấy thiết bị</p>
                        </td>
                      </tr>
                    ) : (
                      devices.map((device) => (
                        <tr key={device.device_sn} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50">
                          <td className="px-4 py-3"><CodeBlock code={device.device_sn} lang="text" className="inline" /></td>
                          <td className="px-4 py-3">Tenant #{device.tenant_id}</td>
                          <td className="px-4 py-3 font-medium text-text-primary">{device.name || '—'}</td>
                          <td className="px-4 py-3 text-text-muted">{device.location || '—'}</td>
                          <td className="px-4 py-3">{device.stats?.transaction_count || 0}</td>
                          <td className="px-4 py-3"><CodeBlock code={device.stats?.total_sales || '0'} lang="text" className="inline" /></td>
                          <td className="px-4 py-3">
                            <StatusBadge status={device.is_active ? 'pass' : 'fail'} />
                          </td>
                          <td className="px-4 py-3 text-text-muted">{new Date(device.created_at).toLocaleDateString('vi-VN')}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(device)} title="Sửa"><Edit className="h-4 w-4" /></Button>
                              {device.is_active ? (
                                <Button variant="ghost" size="sm" onClick={() => handleDeactivate(device.device_sn)} title="Vô hiệu hóa"><XCircle className="h-4 w-4 text-status-fail" /></Button>
                              ) : (
                                <Button variant="ghost" size="sm" onClick={() => handleActivate(device.device_sn)} title="Kích hoạt"><CheckCircle className="h-4 w-4 text-status-pass" /></Button>
                              )}
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-medium">Đăng ký thiết bị ngoại vi</h2>
              <Select
                label="Tenant"
                name="tenant_id"
                value={formData.tenant_id}
                onChange={handleFormChange}
                options={[
                  { value: '', label: 'Chọn tenant' },
                  ...tenants.map(t => ({ value: String(t.id), label: t.name })),
                ]}
                required
              />
              <Input label="Serial Number" name="device_sn" value={formData.device_sn} onChange={handleFormChange} required placeholder="Serial number" />
              <Input label="Tên thiết bị" name="name" value={formData.name} onChange={handleFormChange} placeholder="Tên thiết bị" />
              <Input label="Vị trí" name="location" value={formData.location} onChange={handleFormChange} placeholder="Vị trí lắp đặt" />
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Extra Info (JSON)</label>
                <textarea
                  name="extra_info"
                  value={formData.extra_info}
                  onChange={handleFormChange}
                  className="w-full h-24 px-3 py-2 text-sm font-mono bg-bg-surface border border-border-subtle rounded-[4px] focus:outline-none focus:border-accent"
                  placeholder='{"key": "value"}'
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-accent border-border-subtle rounded-[4px] bg-bg-surface focus:ring-2 focus:ring-accent/20"
                />
                <span>Hoạt động</span>
              </label>
              {formError && <div className="text-sm text-status-fail">{formError}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeModals}>Hủy</Button>
                <Button type="submit" loading={formLoading}>{formLoading ? 'Đang lưu...' : 'Lưu'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-medium">Sửa thiết bị ngoại vi</h2>
              <Select
                label="Tenant"
                name="tenant_id"
                value={formData.tenant_id}
                onChange={handleFormChange}
                options={[
                  { value: '', label: 'Chọn tenant' },
                  ...tenants.map(t => ({ value: String(t.id), label: t.name })),
                ]}
                required
              />
              <Input label="Serial Number" name="device_sn" value={formData.device_sn} onChange={handleFormChange} required placeholder="Serial number" disabled />
              <Input label="Tên thiết bị" name="name" value={formData.name} onChange={handleFormChange} placeholder="Tên thiết bị" />
              <Input label="Vị trí" name="location" value={formData.location} onChange={handleFormChange} placeholder="Vị trí lắp đặt" />
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Extra Info (JSON)</label>
                <textarea
                  name="extra_info"
                  value={formData.extra_info}
                  onChange={handleFormChange}
                  className="w-full h-24 px-3 py-2 text-sm font-mono bg-bg-surface border border-border-subtle rounded-[4px] focus:outline-none focus:border-accent"
                  placeholder='{"key": "value"}'
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-accent border-border-subtle rounded-[4px] bg-bg-surface focus:ring-2 focus:ring-accent/20"
                />
                <span>Hoạt động</span>
              </label>
              {formError && <div className="text-sm text-status-fail">{formError}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeModals}>Hủy</Button>
                <Button type="submit" loading={formLoading}>{formLoading ? 'Đang lưu...' : 'Lưu'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AdminExternalDevicesPage