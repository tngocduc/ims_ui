import { useState, useEffect } from 'react'
import { deviceApi, Device } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { CodeBlock } from '@/components/ui/code-block'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Plus, Search, Settings, Edit, Server } from 'lucide-react'

interface DeviceResponse {
  items: Device[]
  count: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [editForm, setEditForm] = useState({ type_name: '', firmware: '', status: '', is_active: true, extra_config: '' })
  const [editLoading, setEditLoading] = useState(false)

  const fetchDevices = async () => {
    try {
      setLoading(true)
      setError('')
      const params: Record<string, string | number> = {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      }
      if (search) params.search = search
      
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
  }, [pagination.pageIndex, pagination.pageSize, search])

  const handlePageChange = (pageIndex: number) => {
    setPagination(prev => ({ ...prev, pageIndex }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, pageIndex: 1 }))
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPagination(prev => ({ ...prev, pageIndex: 1 }))
  }

  const handleEditClick = (device: Device) => {
    setEditingDevice(device)
    setEditForm({
      type_name: device.type_name,
      firmware: device.firmware,
      status: device.status,
      is_active: device.is_active,
      extra_config: device.extra_config ? JSON.stringify(device.extra_config, null, 2) : '',
    })
    setEditModalOpen(true)
  }

  const handleEditChange = (key: string, value: string | boolean) => {
    setEditForm(prev => ({ ...prev, [key]: value }))
  }

  const handleEditSubmit = async () => {
    if (!editingDevice) return
    try {
      setEditLoading(true)
      const extraConfig = editForm.extra_config ? JSON.parse(editForm.extra_config) : {}
      await deviceApi.update(editingDevice.uuid, {
        type_name: editForm.type_name,
        firmware: editForm.firmware,
        status: editForm.status,
        is_active: editForm.is_active,
        extra_config: extraConfig,
      })
      setEditModalOpen(false)
      setEditingDevice(null)
      fetchDevices()
    } catch (err) {
      console.error('Failed to update device:', err)
      alert('Không thể cập nhật thiết bị')
    } finally {
      setEditLoading(false)
    }
  }

  const closeEditModal = () => {
    setEditModalOpen(false)
    setEditingDevice(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Thiết bị</h1>
          <p className="text-sm text-text-muted mt-1">Quản lý và giám sát thiết bị</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Đăng ký thiết bị
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form className="flex gap-4" role="search">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Tìm kiếm theo UUID, loại, hoặc trạng thái..."
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
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">UUID</th>
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
                        <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                          <Server className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p>Không tìm thấy thiết bị</p>
                        </td>
                      </tr>
                    ) : (
                      devices.map((device) => (
                        <tr key={device.uuid} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50">
                          <td className="px-4 py-3"><CodeBlock code={device.uuid} lang="text" inline /></td>
                          <td className="px-4 py-3">{device.type_name}</td>
                          <td className="px-4 py-3"><CodeBlock code={device.firmware} lang="text" inline /></td>
                          <td className="px-4 py-3">
                            <StatusBadge status={
                              device.status === 'online' ? 'pass' :
                              device.status === 'offline' ? 'fail' :
                              device.status === 'maintenance' ? 'needs_review' : 'error'
                            } label={
                              device.status === 'online' ? 'OK' :
                              device.status === 'offline' ? 'Error' : 'N/A'
                            } />
                          </td>
                          <td className="px-4 py-3 text-text-muted">{device.register_date ? new Date(device.register_date).toLocaleDateString('vi-VN') : '—'}</td>
                          <td className="px-4 py-3 text-text-muted">{device.last_seen_at ? new Date(device.last_seen_at).toLocaleString('vi-VN') : '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" title="Xem cấu hình"><Settings className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" title="Sửa" onClick={() => handleEditClick(device)}><Edit className="h-4 w-4" /></Button>
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

      {/* Edit Device Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa thiết bị</DialogTitle>
            <DialogDescription>Cập nhật thông tin thiết bị {editingDevice?.uuid}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">Loại thiết bị</label>
                <Input
                  value={editForm.type_name}
                  onChange={(e) => handleEditChange('type_name', e.target.value)}
                  disabled={editLoading}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">Firmware</label>
                <Input
                  value={editForm.firmware}
                  onChange={(e) => handleEditChange('firmware', e.target.value)}
                  disabled={editLoading}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">Trạng thái</label>
                <Select
                  value={editForm.status}
                  onChange={(e) => handleEditChange('status', e.target.value)}
                  disabled={editLoading}
                  options={[
                    { value: 'online', label: 'Online' },
                    { value: 'offline', label: 'Offline' },
                    { value: 'maintenance', label: 'Maintenance' },
                  ]}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted">Kích hoạt</label>
                <Select
                  value={String(editForm.is_active)}
                  onChange={(e) => handleEditChange('is_active', e.target.value === 'true')}
                  disabled={editLoading}
                  options={[
                    { value: 'true', label: 'Có' },
                    { value: 'false', label: 'Không' },
                  ]}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-muted">Cấu hình thêm (JSON)</label>
              <textarea
                value={editForm.extra_config}
                onChange={(e) => handleEditChange('extra_config', e.target.value)}
                disabled={editLoading}
                rows={6}
                className="w-full h-32 px-3 text-sm font-mono bg-bg-surface border border-border-subtle rounded-[6px] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeEditModal} disabled={editLoading}>
              Hủy
            </Button>
            <Button onClick={handleEditSubmit} disabled={editLoading}>
              {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DevicesPage