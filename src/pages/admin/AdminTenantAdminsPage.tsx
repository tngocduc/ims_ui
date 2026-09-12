import { useState, useEffect } from 'react'
import { tenantApi, Tenant, TenantAdmin } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { CodeBlock } from '@/components/ui/code-block'
import { Plus, Search, Edit, Trash2, ShieldCheck, XCircle, CheckCircle } from 'lucide-react'

interface TenantAdminItem {
  auth_user: {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_staff: boolean
    is_superuser: boolean
    role: string
    tenant: { id: number; name: string }
  }
  tenant_admin: {
    id: number
    tenant_id: number
    is_active: boolean
  }
}

interface TenantAdminResponse {
  items: TenantAdminItem[]
  count: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

function AdminTenantAdminsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [admins, setAdmins] = useState<TenantAdminItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ tenantId: '', search: '' })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<TenantAdminItem | null>(null)
  const [formData, setFormData] = useState({
    tenant_id: '',
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
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

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      setError('')
      const params: Record<string, string | number> = {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      }
      if (filters.tenantId) params.tenant_id = filters.tenantId
      if (filters.search) params.search = filters.search
      
      const response = await tenantApi.listAllAdmins(params)
      const data = response as TenantAdminResponse
      setAdmins(data.items || [])
      setPagination(prev => ({
        ...prev,
        total: data.count || 0,
        totalPages: data.totalPages || 0,
      }))
    } catch (err) {
      setError('Không thể tải danh sách admin tenant')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
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
    setFormData({ tenant_id: '', username: '', password: '', email: '', first_name: '', last_name: '', is_active: true })
    setFormError('')
    setShowCreateModal(true)
  }

  const openEditModal = (admin: TenantAdminItem) => {
    setEditingAdmin(admin)
    setFormData({
      tenant_id: String(admin.auth_user.tenant?.id || ''),
      username: admin.auth_user.username,
      password: '',
      email: admin.auth_user.email,
      first_name: admin.auth_user.first_name,
      last_name: admin.auth_user.last_name,
      is_active: admin.tenant_admin.is_active,
    })
    setFormError('')
    setShowEditModal(true)
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setEditingAdmin(null)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    try {
      const data: Record<string, unknown> = {
        tenant_id: Number(formData.tenant_id),
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        is_active: formData.is_active,
      }

      if (formData.password) {
        data.password = formData.password
      }

      if (showCreateModal) {
        await tenantApi.createAdmin(data)
      } else if (editingAdmin) {
        await tenantApi.updateAdmin(editingAdmin.auth_user.id, data)
      }
      closeModals()
      fetchAdmins()
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setFormError(axiosError.response?.data?.message || 'Thao tác thất bại')
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleActive = async (admin: TenantAdminItem) => {
    try {
      const newStatus = !admin.tenant_admin.is_active
      await tenantApi.updateAdmin(admin.auth_user.id, { is_active: newStatus })
      fetchAdmins()
    } catch (err) {
      console.error('Không thể thay đổi trạng thái', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Quản lý Admin Tenant</h1>
          <p className="text-sm text-text-muted mt-1">Tạo, sửa, kích hoạt/vô hiệu hóa admin tenant</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Tạo admin tenant
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
                placeholder="Tìm kiếm theo tên, email..."
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
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tenant</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Username</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Họ tên</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                          <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p>Không tìm thấy admin tenant</p>
                        </td>
                      </tr>
                    ) : (
                      admins.map((admin) => (
                        <tr key={admin.auth_user.id} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50">
                          <td className="px-4 py-3"><CodeBlock code={String(admin.auth_user.id)} lang="text" className="inline" /></td>
                          <td className="px-4 py-3">{admin.auth_user.tenant?.name || 'N/A'}</td>
                          <td className="px-4 py-3 font-medium text-text-primary">{admin.auth_user.username}</td>
                          <td className="px-4 py-3">{admin.auth_user.email || '—'}</td>
                          <td className="px-4 py-3">{admin.auth_user.first_name} {admin.auth_user.last_name}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={admin.tenant_admin.is_active ? 'pass' : 'fail'} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(admin)} title="Sửa"><Edit className="h-4 w-4" /></Button>
                              {admin.tenant_admin.is_active ? (
                                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(admin)} title="Vô hiệu hóa"><XCircle className="h-4 w-4 text-status-fail" /></Button>
                              ) : (
                                <Button variant="ghost" size="sm" onClick={() => handleToggleActive(admin)} title="Kích hoạt"><CheckCircle className="h-4 w-4 text-status-pass" /></Button>
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
              <h2 className="text-xl font-medium">Tạo admin tenant mới</h2>
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
              <Input label="Username" name="username" value={formData.username} onChange={handleFormChange} required placeholder="Username" />
              <Input label="Password" name="password" type="password" value={formData.password} onChange={handleFormChange} required placeholder="Mật khẩu" autoComplete="new-password" />
              <Input label="Email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Email" type="email" />
              <Input label="First Name" name="first_name" value={formData.first_name} onChange={handleFormChange} placeholder="Họ" />
              <Input label="Last Name" name="last_name" value={formData.last_name} onChange={handleFormChange} placeholder="Tên" />
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
              <h2 className="text-xl font-medium">Sửa admin tenant</h2>
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
              <Input label="Username" name="username" value={formData.username} onChange={handleFormChange} required placeholder="Username" disabled />
              <Input label="Password (để trống để không đổi)" name="password" type="password" value={formData.password} onChange={handleFormChange} placeholder="Mật khẩu mới" autoComplete="new-password" />
              <Input label="Email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Email" type="email" />
              <Input label="First Name" name="first_name" value={formData.first_name} onChange={handleFormChange} placeholder="Họ" />
              <Input label="Last Name" name="last_name" value={formData.last_name} onChange={handleFormChange} placeholder="Tên" />
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

export default AdminTenantAdminsPage