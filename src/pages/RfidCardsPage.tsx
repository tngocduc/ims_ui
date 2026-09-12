import { useState, useEffect } from 'react'
import { tenantUserApi, TenantUser } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { CodeBlock } from '@/components/ui/code-block'
import { Plus, Search, Edit, Trash2, CreditCard } from 'lucide-react'

interface RfidCard {
  id: number
  card_id: string
  extra_info: Record<string, unknown>
  is_active: boolean
  user: number
  created_at: string
  updated_at: string
}

interface RfidCardResponse {
  items: RfidCard[]
  count: number
  pageIndex: number
  pageSize: number
  totalPages: number
}

function RfidCardsPage() {
  const [users, setUsers] = useState<TenantUser[]>([])
  const [cards, setCards] = useState<RfidCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 1, pageSize: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState({ userId: '', search: '' })
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [formData, setFormData] = useState({
    card_id: '',
    extra_info: '',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await tenantUserApi.list({ pageSize: 1000 })
      setUsers(response.items || [])
    } catch (err) {
      console.error('Không thể tải danh sách người dùng', err)
    }
  }

  const fetchCards = async () => {
    if (!filters.userId) {
      setCards([])
      return
    }
    try {
      setLoading(true)
      setError('')
      const response = await tenantUserApi.listRfidCards(Number(filters.userId), {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        search: filters.search || undefined,
      })
      const data = response as RfidCardResponse
      setCards(data.items || [])
      setPagination(prev => ({
        ...prev,
        total: data.count || 0,
        totalPages: data.totalPages || 0,
      }))
    } catch (err) {
      setError('Không thể tải danh sách thẻ RFID')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (filters.userId) {
      const user = users.find(u => u.id === Number(filters.userId))
      setSelectedUser(user || null)
      fetchCards()
    } else {
      setSelectedUser(null)
      setCards([])
    }
  }, [filters.userId, pagination.pageIndex, pagination.pageSize, filters.search])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
    setPagination(prev => ({ ...prev, pageIndex: 1 }))
  }

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, userId: e.target.value }))
    setPagination(prev => ({ ...prev, pageIndex: 1 }))
  }

  const handlePageChange = (pageIndex: number) => {
    setPagination(prev => ({ ...prev, pageIndex }))
  }

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, pageIndex: 1 }))
  }

  const openRegisterModal = () => {
    setFormData({ card_id: '', extra_info: '' })
    setFormError('')
    setShowRegisterModal(true)
  }

  const closeModal = () => {
    setShowRegisterModal(false)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!filters.userId) return
    setFormLoading(true)
    setFormError('')
    try {
      let extraInfo = {}
      try {
        extraInfo = JSON.parse(formData.extra_info || '{}')
      } catch {
        throw new Error('extra_info phải là JSON hợp lệ')
      }

      await tenantUserApi.registerRfidCard(Number(filters.userId), {
        card_id: formData.card_id,
        extra_info: extraInfo,
      })
      closeModal()
      fetchCards()
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setFormError(axiosError.response?.data?.message || 'Thao tác thất bại')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeactivate = async (cardId: string) => {
    if (!filters.userId) return
    if (!window.confirm('Vô hiệu hóa thẻ này?')) return
    try {
      await tenantUserApi.deactivateRfidCard(Number(filters.userId), cardId)
      fetchCards()
    } catch (err) {
      console.error('Không thể vô hiệu hóa thẻ', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Quản lý thẻ RFID</h1>
          <p className="text-sm text-text-muted mt-1">Đăng ký và quản lý thẻ RFID cho người dùng</p>
        </div>
        {filters.userId && (
          <Button onClick={openRegisterModal}>
            <Plus className="h-4 w-4" />
            Đăng ký thẻ mới
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-4">
          <form className="flex flex-wrap items-center gap-4" role="search">
            <div className="min-w-[300px]">
              <label className="block text-xs font-medium text-text-muted mb-1.5">Người dùng</label>
              <select
                value={filters.userId}
                onChange={handleUserChange}
                className="h-9 w-full px-3 text-sm font-mono bg-bg-surface border border-border-subtle rounded-[4px] focus:outline-none focus:border-accent"
              >
                <option value="">Chọn người dùng</option>
                {users.map(u => (
                  <option key={u.id} value={String(u.id)}>{u.name} ({u.phone_number})</option>
                ))}
              </select>
            </div>
            {filters.userId && (
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  placeholder="Tìm kiếm theo mã thẻ..."
                  value={filters.search}
                  onChange={handleSearch}
                  className="pl-10"
                  autoComplete="off"
                />
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {filters.userId && selectedUser && (
        <div className="p-3 bg-bg-surface border border-border-subtle rounded-[4px]">
          <p className="text-sm font-medium text-text-primary">
            Thẻ của: {selectedUser.name} - {selectedUser.phone_number} (Số dư: {selectedUser.balance})
          </p>
        </div>
      )}

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
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Mã thẻ</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Nhãn</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Ngày tạo</th>
                      <th className="px-4 py-3 text-left text-text-muted uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-text-muted">
                          <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                          <p>{filters.userId ? 'Không có thẻ RFID' : 'Chọn người dùng để xem thẻ'}</p>
                        </td>
                      </tr>
                    ) : (
                      cards.map((card) => (
                        <tr key={card.id} className="border-b border-border-subtle/50 hover:bg-bg-surface-hover/50">
                          <td className="px-4 py-3"><CodeBlock code={String(card.id)} lang="text" className="inline" /></td>
                          <td className="px-4 py-3 font-medium text-text-primary"><CodeBlock code={card.card_id} lang="text" className="inline" /></td>
                          <td className="px-4 py-3 text-text-muted">
                            {card.extra_info?.label || card.extra_info?.name || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={card.is_active ? 'pass' : 'fail'} />
                          </td>
                          <td className="px-4 py-3 text-text-muted">{new Date(card.created_at).toLocaleDateString('vi-VN')}</td>
                          <td className="px-4 py-3">
                            {card.is_active && (
                              <Button variant="danger" size="sm" onClick={() => handleDeactivate(card.card_id)} title="Vô hiệu hóa">
                                <Trash2 className="h-4 w-4" />
                              </Button>
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

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h2 className="text-xl font-medium">Đăng ký thẻ RFID mới</h2>
              <Input label="Mã thẻ (Card ID)" name="card_id" value={formData.card_id} onChange={handleFormChange} required placeholder="Ví dụ: 478C3063" />
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Extra Info (JSON)</label>
                <textarea
                  name="extra_info"
                  value={formData.extra_info}
                  onChange={handleFormChange}
                  className="w-full h-24 px-3 py-2 text-sm font-mono bg-bg-surface border border-border-subtle rounded-[4px] focus:outline-none focus:border-accent"
                  placeholder='{"label": "Thẻ chính"}'
                />
              </div>
              {formError && <div className="text-sm text-status-fail">{formError}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeModal}>Hủy</Button>
                <Button type="submit" loading={formLoading}>{formLoading ? 'Đang lưu...' : 'Lưu'}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

export default RfidCardsPage