import { useState, useEffect } from 'react'
import { tenantApi, vietqrApi, Tenant } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { CodeBlock } from '@/components/ui/code-block'
import { Plus, Search, Edit, CheckCircle, XCircle, Settings, CreditCard } from 'lucide-react'

interface TenantResponse {
  items: Tenant[]
  count: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    extra_info: '',
    is_active: true,
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  // VietQR config modal
  const [showVietqrModal, setShowVietqrModal] = useState(false)
  const [vietqrTenant, setVietqrTenant] = useState<Tenant | null>(null)
  const [vietqrConfig, setVietqrConfig] = useState<{ vietqr_bank: string; vietqr_account_number: string; vietqr_account_name: string } | null>(null)
  const [vietqrFormData, setVietqrFormData] = useState({
    vietqr_bank: '',
    vietqr_account_number: '',
    vietqr_account_name: '',
  })
  const [vietqrError, setVietqrError] = useState('')
  const [vietqrSuccess, setVietqrSuccess] = useState('')
  const [vietqrLoading, setVietqrLoading] = useState(false)

  useEffect(() => {
    fetchTenants()
  }, [pagination.pageIndex, pagination.pageSize, search])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await tenantApi.list({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        search: search || undefined,
      })
      const data = response as TenantResponse
      setTenants(data.items || [])
      setPagination(prev => ({
        ...prev,
        total: data.count || 0,
        totalPages: data.totalPages || 0,
      }))
    } catch (err) {
      setError('Không thể tải danh sách tenant')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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

  const openCreateModal = () => {
    setFormData({ name: '', address: '', extra_info: '', is_active: true })
    setFormError('')
    setShowCreateModal(true)
  }

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setFormData({
      name: tenant.name,
      address: tenant.address || '',
      extra_info: JSON.stringify(tenant.extra_info || {}, null, 2),
      is_active: tenant.is_active,
    })
    setFormError('')
    setShowEditModal(true)
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setEditingTenant(null)
    setShowVietqrModal(false)
    setVietqrTenant(null)
    setVietqrConfig(null)
    setVietqrFormData({ vietqr_bank: '', vietqr_account_number: '', vietqr_account_name: '' })
    setVietqrError('')
    setVietqrSuccess('')
  }

  const openVietqrModal = async (tenant: Tenant) => {
    setVietqrTenant(tenant)
    setVietqrError('')
    setVietqrSuccess('')
    setVietqrLoading(true)
    try {
      const config = await vietqrApi.adminGetConfig(tenant.id)
      setVietqrConfig(config)
      setVietqrFormData({
        vietqr_bank: config.vietqr_bank || '',
        vietqr_account_number: config.vietqr_account_number || '',
        vietqr_account_name: config.vietqr_account_name || '',
      })
    } catch (err) {
      setVietqrError('Không thể tải cấu hình VietQR')
      console.error(err)
    } finally {
      setVietqrLoading(false)
      setShowVietqrModal(true)
    }
  }

  const handleVietqrSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vietqrTenant) return
    if (!vietqrFormData.vietqr_bank || !vietqrFormData.vietqr_account_number || !vietqrFormData.vietqr_account_name) {
      setVietqrError('Vui lòng điền đầy đủ thông tin')
      return
    }
    setVietqrLoading(true)
    setVietqrError('')
    setVietqrSuccess('')
    try {
      await vietqrApi.adminUpdateConfig(vietqrTenant.id, vietqrFormData)
      setVietqrSuccess('Cập nhật cấu hình VietQR thành công')
      const config = await vietqrApi.adminGetConfig(vietqrTenant.id)
      setVietqrConfig(config)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setVietqrError(axiosError.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setVietqrLoading(false)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        name: formData.name,
        address: formData.address,
        extra_info: extraInfo,
        is_active: formData.is_active,
      }

      if (showCreateModal) {
        await tenantApi.create(data)
      } else if (editingTenant) {
        await tenantApi.update(editingTenant.id, data)
      }
      closeModals()
      fetchTenants()
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setFormError(axiosError.response?.data?.message || 'Thao tác thất bại')
    } finally {
      setFormLoading(false)
    }
  }

  const handleActivate = async (id: number) => {
    if (!window.confirm('Kích hoạt tenant này?')) return
    try {
      await tenantApi.activate(id)
      fetchTenants()
    } catch (err) {
      console.error('Không thể kích hoạt tenant', err)
    }
  }

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Vô hiệu hóa tenant này?')) return
    try {
      await tenantApi.delete(id)
      fetchTenants()
    } catch (err) {
      console.error('Không thể vô hiệu hóa tenant', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Quản lý Tenant</h1>
          <p className="text-sm text-text-muted mt-1">Tạo, sửa, kích hoạt/vô hiệu hóa tenant</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Tạo tenant
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form className="flex gap-4" role="search">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Tìm kiếm theo tên, địa chỉ..."
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
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tên</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Địa chỉ</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Admin</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Người dùng</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thiết bị</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">VietQR</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Ngày tạo</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-text-muted">
                          <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p>Không tìm thấy tenant</p>
                        </td>
                      </tr>
                    ) : (
                      tenants.map((tenant) => (
                        <tr key={tenant.id} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50">
                          <td className="px-4 py-3"><CodeBlock code={String(tenant.id)} lang="text" inline skipHighlighting={true} /></td>
                          <td className="px-4 py-3 font-medium text-text-primary">{tenant.name}</td>
                          <td className="px-4 py-3 text-text-muted">{tenant.address || '—'}</td>
                          <td className="px-4 py-3">{tenant.admin_count}</td>
                          <td className="px-4 py-3">{tenant.user_count}</td>
<td className="px-4 py-3">{tenant.device_count}</td>
                            <td className="px-4 py-3">
                              <Button variant="ghost" size="sm" onClick={() => openVietqrModal(tenant)} title="Cấu hình VietQR">
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={tenant.is_active ? 'pass' : 'fail'} label={tenant.is_active ? 'OK' : 'Error'} />
                            </td>
                          <td className="px-4 py-3 text-text-muted">{new Date(tenant.created_at).toLocaleDateString('vi-VN')}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(tenant)} title="Sửa"><Edit className="h-4 w-4" /></Button>
                              {tenant.is_active ? (
                                <Button variant="ghost" size="sm" onClick={() => handleDeactivate(tenant.id)} title="Vô hiệu hóa"><XCircle className="h-4 w-4 text-status-fail" /></Button>
                              ) : (
                                <Button variant="ghost" size="sm" onClick={() => handleActivate(tenant.id)} title="Kích hoạt"><CheckCircle className="h-4 w-4 text-status-pass" /></Button>
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
              <h2 className="text-xl font-medium">Tạo tenant mới</h2>
              <Input label="Tên tenant" name="name" value={formData.name} onChange={handleFormChange} required placeholder="Tên tenant" />
              <Input label="Địa chỉ" name="address" value={formData.address} onChange={handleFormChange} placeholder="Địa chỉ" />
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
              <h2 className="text-xl font-medium">Sửa tenant</h2>
              <Input label="Tên tenant" name="name" value={formData.name} onChange={handleFormChange} required placeholder="Tên tenant" />
              <Input label="Địa chỉ" name="address" value={formData.address} onChange={handleFormChange} placeholder="Địa chỉ" />
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

      {/* VietQR Config Modal */}
      {showVietqrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <form onSubmit={handleVietqrSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-medium">Cấu hình VietQR</h2>
              {vietqrTenant && <p className="text-sm text-text-muted">Tenant: {vietqrTenant.name} (ID: {vietqrTenant.id})</p>}
              {vietqrLoading && (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
                </div>
              )}
              {!vietqrLoading && (
                <>
                  <select
                    name="vietqr_bank"
                    value={vietqrFormData.vietqr_bank}
                    onChange={(e) => setVietqrFormData(prev => ({ ...prev, vietqr_bank: e.target.value }))}
                    disabled={vietqrLoading}
                    className="w-full px-3 py-2 bg-bg-surface border border-border-subtle rounded-[4px] text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50"
                  >
                    <option value="">Chọn ngân hàng</option>
                    <option value="VIETCOMBANK">Vietcombank (VIETCOMBANK)</option>
                    <option value="VIETINBANK">VietinBank (VIETINBANK)</option>
                    <option value="BIDV">BIDV (BIDV)</option>
                    <option value="AGRIBANK">Agribank (AGRIBANK)</option>
                    <option value="TECHCOMBANK">Techcombank (TECHCOMBANK)</option>
                    <option value="MBBANK">MB Bank (MBBANK)</option>
                    <option value="ACB">ACB (ACB)</option>
                    <option value="VPBANK">VPBank (VPBANK)</option>
                    <option value="HDBANK">HDBank (HDBANK)</option>
                    <option value="TPBANK">TPBank (TPBANK)</option>
                    <option value="SCB">SCB (SCB)</option>
                    <option value="BAC A BANK">Bac A Bank (BAC A BANK)</option>
                    <option value="NAM A BANK">Nam A Bank (NAM A BANK)</option>
                    <option value="OCB">OCB (OCB)</option>
                    <option value="SHB">SHB (SHB)</option>
                    <option value="EXIMBANK">Eximbank (EXIMBANK)</option>
                    <option value="MARITIME BANK">Maritime Bank (MARITIME BANK)</option>
                    <option value="VIETCAPITAL BANK">VietCapital Bank (VIETCAPITAL BANK)</option>
                    <option value="KIENLONG BANK">Kienlongbank (KIENLONG BANK)</option>
                    <option value="SAIGONBANK">Saigonbank (SAIGONBANK)</option>
                    <option value="PGBANK">PG Bank (PGBANK)</option>
                    <option value="ABBANK">ABBank (ABBANK)</option>
                    <option value="NCB">NCB (NCB)</option>
                    <option value="SEA BANK">SeaBank (SEA BANK)</option>
                    <option value="LIENVIETPOSTBANK">LienVietPostBank (LIENVIETPOSTBANK)</option>
                    <option value="VIETBANK">Vietbank (VIETBANK)</option>
                    <option value="GPBANK">GPBank (GPBANK)</option>
                    <option value="PVCOMBANK">PVcomBank (PVCOMBANK)</option>
                    <option value="COOPBANK">Co-opBank (COOPBANK)</option>
                  </select>

                  <Input
                    label="Số tài khoản"
                    name="vietqr_account_number"
                    value={vietqrFormData.vietqr_account_number}
                    onChange={(e) => setVietqrFormData(prev => ({ ...prev, vietqr_account_number: e.target.value }))}
                    placeholder="Nhập số tài khoản"
                    required
                    disabled={vietqrLoading}
                    autoComplete="off"
                  />

                  <Input
                    label="Tên chủ tài khoản"
                    name="vietqr_account_name"
                    value={vietqrFormData.vietqr_account_name}
                    onChange={(e) => setVietqrFormData(prev => ({ ...prev, vietqr_account_name: e.target.value }))}
                    placeholder="Nhập tên chủ tài khoản"
                    required
                    disabled={vietqrLoading}
                    autoComplete="off"
                  />

                  {vietqrError && <div className="text-sm text-status-fail">{vietqrError}</div>}
                  {vietqrSuccess && <div className="text-sm text-status-pass">{vietqrSuccess}</div>}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={closeModals} disabled={vietqrLoading}>Hủy</Button>
                    <Button type="submit" loading={vietqrLoading}>{vietqrLoading ? 'Đang lưu...' : 'Lưu cấu hình'}</Button>
                  </div>
                </>
              )}
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

export default AdminTenantsPage