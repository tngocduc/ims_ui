import { useState, useEffect } from 'react'
import { vietqrApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { SectionLabel } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface VietqrConfig {
  tenant_id: number
  vietqr_bank: string
  vietqr_account_number: string
  vietqr_account_name: string
  seapay_api_key: string
  has_vietqr_config: boolean
}

function VietqrConfigPage() {
  const [config, setConfig] = useState<VietqrConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    vietqr_bank: '',
    vietqr_account_number: '',
    vietqr_account_name: '',
    seapay_api_key: '',
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await vietqrApi.getConfig()
      setConfig(response)
      if (response?.has_vietqr_config) {
        // Normalize bank value to match options (case-insensitive)
        const bankValue = response.vietqr_bank?.toUpperCase().trim() || ''
        setFormData({
          vietqr_bank: bankValue,
          vietqr_account_number: response.vietqr_account_number,
          vietqr_account_name: response.vietqr_account_name,
          seapay_api_key: response.seapay_api_key || '',
        })
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError.response?.data?.message || 'Không thể tải cấu hình VietQR')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.vietqr_bank || !formData.vietqr_account_number || !formData.vietqr_account_name) {
      setError('Vui lòng điền đầy đủ thông tin')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await vietqrApi.updateConfig(formData)
      setSuccess('Cập nhật cấu hình VietQR thành công')
      const response = await vietqrApi.getConfig()
      setConfig(response)
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } }
      setError(axiosError.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  const banks = [
    { value: 'VIETCOMBANK', label: 'Vietcombank (VIETCOMBANK)' },
    { value: 'VIETINBANK', label: 'VietinBank (VIETINBANK)' },
    { value: 'BIDV', label: 'BIDV (BIDV)' },
    { value: 'AGRIBANK', label: 'Agribank (AGRIBANK)' },
    { value: 'TECHCOMBANK', label: 'Techcombank (TECHCOMBANK)' },
    { value: 'MBBANK', label: 'MB Bank (MBBANK)' },
    { value: 'ACB', label: 'ACB (ACB)' },
    { value: 'VPBANK', label: 'VPBank (VPBANK)' },
    { value: 'HD BANK', label: 'HDBank (HDBANK)' },
    { value: 'TPBANK', label: 'TPBank (TPBANK)' },
    { value: 'SCB', label: 'SCB (SCB)' },
    { value: 'BAC A BANK', label: 'Bac A Bank (BAC A BANK)' },
    { value: 'NAM A BANK', label: 'Nam A Bank (NAM A BANK)' },
    { value: 'OCB', label: 'OCB (OCB)' },
    { value: 'SHB', label: 'SHB (SHB)' },
    { value: 'EXIMBANK', label: 'Eximbank (EXIMBANK)' },
    { value: 'MARITIME BANK', label: 'Maritime Bank (MARITIME BANK)' },
    { value: 'VIETCAPITAL BANK', label: 'VietCapital Bank (VIETCAPITAL BANK)' },
    { value: 'KIENLONG BANK', label: 'Kienlongbank (KIENLONG BANK)' },
    { value: 'SAIGONBANK', label: 'Saigonbank (SAIGONBANK)' },
    { value: 'PGBANK', label: 'PG Bank (PGBANK)' },
    { value: 'ABBANK', label: 'ABBank (ABBANK)' },
    { value: 'NCB', label: 'NCB (NCB)' },
    { value: 'SEA BANK', label: 'SeaBank (SEA BANK)' },
    { value: 'LIENVIETPOSTBANK', label: 'LienVietPostBank (LIENVIETPOSTBANK)' },
    { value: 'VIETBANK', label: 'Vietbank (VIETBANK)' },
    { value: 'GPBANK', label: 'GPBank (GPBANK)' },
    { value: 'PVCOMBANK', label: 'PVcomBank (PVCOMBANK)' },
    { value: 'COOPBANK', label: 'Co-opBank (COOPBANK)' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-text-primary">Cấu hình VietQR</h1>
          <p className="text-sm text-text-muted mt-1">Thiết lập thông tin tài khoản ngân hàng để tạo mã QR thanh toán</p>
        </div>
      </div>

      {config && config.has_vietqr_config && (
        <div className="p-3 text-sm bg-status-pass/10 border border-status-pass/20 rounded-[4px] flex items-center gap-2 text-status-pass">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>Đã cấu hình: {config.vietqr_bank} - {config.vietqr_account_name} - {config.vietqr_account_number}</span>
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-status-fail bg-status-fail/10 border border-status-fail/20 rounded-[4px] flex items-center gap-2" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm text-status-pass bg-status-pass/10 border border-status-pass/20 rounded-[4px] flex items-center gap-2" role="status">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <SectionLabel>thông tin tài khoản ngân hàng</SectionLabel>
      <Card>
        <CardHeader>
          <CardTitle>Thiết lập VietQR</CardTitle>
          <CardDescription>Nhập thông tin tài khoản ngân hàng để khách hàng quét mã QR thanh toán</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Ngân hàng <span className="text-status-fail">*</span></label>
              <select
                name="vietqr_bank"
                value={formData.vietqr_bank}
                onChange={handleChange}
                disabled={saving}
                className="w-full px-3 py-2 bg-bg-surface border border-border-subtle rounded-[4px] text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Chọn ngân hàng</option>
                {banks.map(bank => (
                  <option key={bank.value} value={bank.value}>{bank.label}</option>
                ))}
              </select>
            </div>

            <Input
              label={<>Số tài khoản <span className='text-status-fail'>*</span></>}
              name="vietqr_account_number"
              value={formData.vietqr_account_number}
              onChange={handleChange}
              placeholder="Nhập số tài khoản"
              required
              disabled={saving}
              autoComplete="off"
            />

            <Input
              label={<>Tên chủ tài khoản <span className='text-status-fail'>*</span></>}
              name="vietqr_account_name"
              value={formData.vietqr_account_name}
              onChange={handleChange}
              placeholder="Nhập tên chủ tài khoản (hiển thị trên app ngân hàng)"
              required
              disabled={saving}
              autoComplete="off"
            />

            <Input
              label={<>SeaPay API Key <span className='text-status-fail'>*</span></>}
              name="seapay_api_key"
              value={formData.seapay_api_key}
              onChange={handleChange}
              placeholder="Nhập SeaPay API Key"
              required
              disabled={saving}
              autoComplete="off"
              type="password"
            />

            <Button type="submit" className="w-full" loading={saving}>
              {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border-subtle/50">
        <CardHeader>
          <CardTitle className="text-text-muted">Hướng dẫn</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2 text-sm text-text-muted">
          <p>1. Chọn ngân hàng mà tài khoản của bạn mở tại ngân hàng đó</p>
          <p>2. Nhập đúng số tài khoản (không dấu cách, không ký tự đặc biệt)</p>
          <p>3. Tên chủ tài khoản sẽ hiển thị trên ứng dụng ngân hàng khi khách hàng quét mã QR</p>
          <p>4. Sau khi lưu, hệ thống sẽ tự động tạo mã VietQR cho các giao dịch thanh toán</p>
          <p className="text-status-fail font-medium">Lưu ý: Thông tin này nhạy cảm, hãy đảm bảo chỉ người được ủy quyền mới có quyền truy cập trang này</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default VietqrConfigPage