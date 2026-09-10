import { useState, useEffect } from 'react'
import { tenantApi, tenantUserApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { CodeBlock } from '@/components/ui/code-block'
import { Plus, Search, Edit, DollarSign, Trash2, Building2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface User {
  id: number
  tenant: { id: number; name: string }
  phone_number: string
  name: string
  balance: string
  is_active: boolean
  created_at: string
}

interface Tenant {
  id: number
  name: string
}

interface UserResponse {
  data: User[]
  total: number
}

function AdminUsersPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ tenantId: '', search: '' })

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await tenantApi.list({ limit: 100 })
      setTenants(response.data.data || [])
    } catch (err) {
      console.error('Không thể tải danh sách tenant', err)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const params: Record<string, string | number> = {
        page: pagination.page,
        limit: pagination.limit,
      }
      if (filters.tenantId) params.tenant_id = filters.tenantId
      if (filters.search) params.search = filters.search
      
      const response = await tenantUserApi.list(params)
      const data = response.data as UserResponse
      setUsers(data.data || [])
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: Math.ceil((data.total || 0) / pagination.limit),
      }))
    } catch (err) {
      setError('Không thể tải danh sách người dùng')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, pagination.limit, filters.tenantId, filters.search])

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
          <h1 className="text-2xl font-medium text-text-primary">Tất cả người dùng</h1>
          <p className="text-sm text-text-muted mt-1">Quản lý người dùng trên tất cả tenant</p>
        </div>
        <Button>
          <Plus className="h-4 w-4" />
          Thêm người dùng
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
                placeholder="Tìm kiếm người dùng..."
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
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tenant</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Tên</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Điện thoại</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Số dư</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Ngày tạo</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p>Không tìm thấy người dùng</p>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50">
                          <td className="px-4 py-3"><CodeBlock code={String(user.id)} lang="text" className="inline" /></td>
                          <td className="px-4 py-3">{user.tenant?.name || 'N/A'}</td>
                          <td className="px-4 py-3 font-medium text-text-primary">{user.name}</td>
                          <td className="px-4 py-3"><CodeBlock code={user.phone_number} lang="text" className="inline" /></td>
                          <td className="px-4 py-3"><CodeBlock code={formatCurrency(parseFloat(user.balance))} lang="text" className="inline" /></td>
                          <td className="px-4 py-3"><StatusBadge status={user.is_active ? 'pass' : 'fail'} /></td>
                          <td className="px-4 py-3 text-text-muted">{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" title="Sửa"><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" title="Nạp tiền"><DollarSign className="h-4 w-4" /></Button>
                              <Button variant="danger" size="sm" title="Vô hiệu hóa"><Trash2 className="h-4 w-4" /></Button>
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

export default AdminUsersPage