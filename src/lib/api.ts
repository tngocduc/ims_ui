/// <reference types="vite/client" />

import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh`, {
            refresh: refreshToken,
          })
          const { access, refresh } = extractData<{ access: string; refresh: string }>(response)
          localStorage.setItem('access_token', access)
          localStorage.setItem('refresh_token', refresh)
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        }
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

function extractData<T>(response: AxiosResponse<{ status: string; data: T } | T>): T {
  const data = response.data as { status?: string; data?: T } & T
  // Handle both formats: {status: "success", data: T} and direct T
  if (data && typeof data === 'object' && 'status' in data && 'data' in data) {
    return data.data as T
  }
  return data as T
}

function mapPaginationParams(params?: Record<string, unknown>): Record<string, unknown> {
  if (!params) return {}
  const mapped: Record<string, unknown> = { ...params }
  if ('page' in mapped) {
    mapped.pageIndex = mapped.page
    delete mapped.page
  }
  if ('limit' in mapped) {
    mapped.pageSize = mapped.limit
    delete mapped.limit
  }
  return mapped
}

export interface PaginatedResponse<T> {
  count: number
  items: T[]
  pageIndex: number
  pageSize: number
  totalPages: number
}

export interface Tenant {
  id: number
  name: string
  address: string
  extra_info: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
  admin_count: number
  user_count: number
  device_count: number
}

export interface TenantUser {
  id: number
  tenant: number
  phone_number: string
  name: string
  is_active: boolean
  balance: string
  created_at: string
  updated_at: string
  rfid_cards: Array<{
    id: number
    card_id: string
    extra_info: Record<string, unknown>
    is_active: boolean
    user: number
    created_at: string
    updated_at: string
  }>
}

export interface Device {
  uuid: string
  tenant_id: number
  type_name: string
  firmware: string
  register_date: string | null
  status: string
  is_active: boolean
  extra_config: Record<string, unknown> | null
  hw_uuid: string
  last_seen_at: string | null
  created_at: string
  updated_at: string
  stats: {
    transaction_count: number
    successful_transaction_count: number
    total_sales: number
  }
}

export interface DeviceStatus {
  uuid: string
  status: string
  is_active: boolean
  firmware: string
  last_seen_at: string | null
  updated_at: string
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  is_staff: boolean
  is_superuser: boolean
  role: string
  tenant?: { id: number; name: string; address: string; extra_info: Record<string, unknown>; is_active: boolean; created_at: string; updated_at: string }
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ status: string; data: { access: string; refresh: string } }>('/auth/token/pair', { username, password }).then(extractData),
  sessionLogin: (username: string, password: string) =>
    api.post<{ status: string; data: User }>('/auth/login', { username, password }).then(extractData),
  logout: () => api.post<{ status: string; data: unknown }>('/auth/logout').then(extractData),
  me: () => api.get<{ status: string; data: User }>('/auth/me').then(extractData),
  verifyToken: (token: string) =>
    api.post<{ status: string; data: unknown }>('/auth/token/verify', { token }).then(extractData),
}

export const tenantApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ status: string; data: PaginatedResponse<Tenant> }>('/core/tenants', { params: mapPaginationParams(params) }).then(extractData),
  get: (id: number) =>
    api.get<{ status: string; data: Tenant }>(`/core/tenants/${id}`).then(extractData),
  create: (data: Record<string, unknown>) =>
    api.post<{ status: string; data: Tenant }>('/core/tenants', data).then(extractData),
  update: (id: number, data: Record<string, unknown>) =>
    api.put<{ status: string; data: Tenant }>(`/core/tenants/${id}`, data).then(extractData),
  delete: (id: number) =>
    api.delete<{ status: string; data: unknown }>(`/core/tenants/${id}`).then(extractData),
  activate: (id: number) =>
    api.post<{ status: string; data: Tenant }>(`/core/tenants/${id}/activate`).then(extractData),
  listAdmins: (tenantId: number, params?: Record<string, unknown>) =>
    api.get<{ status: string; data: PaginatedResponse<unknown> }>(`/core/tenants/${tenantId}/admins`, { params: mapPaginationParams(params) }).then(extractData),
  listUsers: (tenantId: number, params?: Record<string, unknown>) =>
    api.get<{ status: string; data: PaginatedResponse<unknown> }>(`/core/tenants/${tenantId}/users`, { params: mapPaginationParams(params) }).then(extractData),
  listDevices: (tenantId: number, params?: Record<string, unknown>) =>
    api.get<{ status: string; data: PaginatedResponse<unknown> }>(`/core/tenants/${tenantId}/devices`, { params: mapPaginationParams(params) }).then(extractData),
  salesReport: (tenantId: number, params?: Record<string, unknown>) =>
    api.get(`/core/tenants/${tenantId}/reports/sales`, { params }).then(extractData),
  listAllAdmins: (params?: Record<string, unknown>) =>
    api.get('/core/tenant-admins', { params: mapPaginationParams(params) }).then(extractData),
  createAdmin: (data: Record<string, unknown>) =>
    api.post('/core/tenant-admins', data).then(extractData),
  updateAdmin: (authUserId: number, data: Record<string, unknown>) =>
    api.put(`/core/tenant-admins/${authUserId}`, data).then(extractData),
}

export const tenantUserApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ status: string; data: PaginatedResponse<TenantUser> }>('/core/tenant/users', { params: mapPaginationParams(params) }).then(extractData),
  create: (data: Record<string, unknown>) =>
    api.post<{ status: string; data: TenantUser }>('/core/tenant/users', data).then(extractData),
  getByPhone: (phoneNumber: string, tenantId?: number) =>
    api.get<{ status: string; data: TenantUser }>(`/core/tenant/users/by-phone/${phoneNumber}`, { params: tenantId ? { tenant_id: tenantId } : {} }).then(extractData),
  get: (id: number) =>
    api.get<{ status: string; data: TenantUser }>(`/core/tenant/users/${id}`).then(extractData),
  update: (id: number, data: Record<string, unknown>) =>
    api.put<{ status: string; data: TenantUser }>(`/core/tenant/users/${id}`, data).then(extractData),
  delete: (id: number) =>
    api.delete<{ status: string; data: unknown }>(`/core/tenant/users/${id}`).then(extractData),
  activate: (id: number) =>
    api.post<{ status: string; data: TenantUser }>(`/core/tenant/users/${id}/activate`).then(extractData),
  getBalance: (id: number) =>
    api.get<{ status: string; data: { balance: string } }>(`/core/tenant/users/${id}/balance`).then(extractData),
  topup: (id: number, data: Record<string, unknown>) =>
    api.post<{ status: string; data: TenantUser }>(`/core/tenant/users/${id}/topup`, data).then(extractData),
  topupByPhone: (data: { tenant_id: number; phone_number: string; amount: string; reason: string }) =>
    api.post<{ status: string; data: TenantUser }>('/core/tenant/users/topup-by-phone', data).then(extractData),
  listBalanceLogs: (id: number, params?: Record<string, unknown>) =>
    api.get<{ status: string; data: PaginatedResponse<unknown> }>(`/core/tenant/users/${id}/balance-logs`, { params: mapPaginationParams(params) }).then(extractData),
  listTransactions: (id: number, params?: Record<string, unknown>) =>
    api.get<{ status: string; data: PaginatedResponse<unknown> }>(`/core/tenant/users/${id}/transactions`, { params: mapPaginationParams(params) }).then(extractData),
  listRfidCards: (id: number, params?: Record<string, unknown>) =>
    api.get<{ status: string; data: PaginatedResponse<unknown> }>(`/core/tenant/users/${id}/rfid-cards`, { params: mapPaginationParams(params) }).then(extractData),
  registerRfidCard: (id: number, data: Record<string, unknown>) =>
    api.post<{ status: string; data: unknown }>(`/core/tenant/users/${id}/rfid-cards`, data).then(extractData),
  deactivateRfidCard: (userId: number, cardId: string) =>
    api.delete<{ status: string; data: unknown }>(`/core/tenant/users/${userId}/rfid-cards/${cardId}`).then(extractData),
}

export const deviceApi = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ status: string; data: PaginatedResponse<Device> }>('/core/devices', { params: mapPaginationParams(params) }).then(extractData),
  register: (data: Record<string, unknown>) =>
    api.post<{ status: string; data: Device }>('/core/devices', data).then(extractData),
  get: (uuid: string) =>
    api.get<{ status: string; data: Device }>(`/core/devices/${uuid}`).then(extractData),
  update: (uuid: string, data: Record<string, unknown>) =>
    api.put<{ status: string; data: Device }>(`/core/devices/${uuid}`, data).then(extractData),
  delete: (uuid: string) =>
    api.delete<{ status: string; data: unknown }>(`/core/devices/${uuid}`).then(extractData),
  activate: (uuid: string) =>
    api.post<{ status: string; data: Device }>(`/core/devices/${uuid}/activate`).then(extractData),
  getConfig: (uuid: string) =>
    api.get<{ status: string; data: unknown }>(`/core/devices/${uuid}/config`).then(extractData),
  updateConfig: (uuid: string, data: Record<string, unknown>) =>
    api.put<{ status: string; data: Device }>(`/core/devices/${uuid}/config`, data).then(extractData),
  getStatus: (uuid: string) =>
    api.get<{ status: string; data: DeviceStatus }>(`/core/devices/${uuid}/status`).then(extractData),
  listTransactions: (uuid: string, params?: Record<string, unknown>) =>
    api.get<{ status: string; data: PaginatedResponse<unknown> }>(`/core/devices/${uuid}/transactions`, { params: mapPaginationParams(params) }).then(extractData),
  listStatus: (params?: Record<string, unknown>) =>
    api.get<{ status: string; data: PaginatedResponse<DeviceStatus> }>('/core/tenant/devices/status', { params: mapPaginationParams(params) }).then(extractData),
}

export const deviceTypeApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/core/device-types', { params: mapPaginationParams(params) }).then(extractData),
  create: (data: Record<string, unknown>) =>
    api.post('/core/device-types', data).then(extractData),
  get: (name: string) =>
    api.get(`/core/device-types/${name}`).then(extractData),
  update: (name: string, data: Record<string, unknown>) =>
    api.put(`/core/device-types/${name}`, data).then(extractData),
  delete: (name: string) =>
    api.delete(`/core/device-types/${name}`).then(extractData),
  activate: (name: string) =>
    api.post(`/core/device-types/${name}/activate`).then(extractData),
}

export const externalDeviceApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/core/external-devices', { params: mapPaginationParams(params) }).then(extractData),
  create: (data: Record<string, unknown>) =>
    api.post('/core/external-devices', data).then(extractData),
  get: (deviceSn: string) =>
    api.get(`/core/external-devices/${deviceSn}`).then(extractData),
  update: (deviceSn: string, data: Record<string, unknown>) =>
    api.put(`/core/external-devices/${deviceSn}`, data).then(extractData),
  delete: (deviceSn: string) =>
    api.delete(`/core/external-devices/${deviceSn}`).then(extractData),
  listTransactions: (deviceSn: string, params?: Record<string, unknown>) =>
    api.get(`/core/external-devices/${deviceSn}/transactions`, { params: mapPaginationParams(params) }).then(extractData),
}

export const transactionApi = {
  insert: (data: Record<string, unknown>) =>
    api.post('/core/transaction/insert', data).then(extractData),
  tcnAndroidLog: (data: Record<string, unknown>, apiKey: string, signature: string) =>
    api.post('/core/transaction/t_a_tx', data, {
      headers: {
        'X-API-KEY': apiKey,
        'X-Signature-SHA256': signature,
      },
    }).then(extractData),
}

export const reportApi = {
  sales: (params?: Record<string, unknown>) =>
    api.get<{ status: string; data: unknown }>('/core/tenant/reports/sales', { params }).then(extractData),
  adminSales: (tenantId: number, params?: Record<string, unknown>) =>
    api.get<{ status: string; data: unknown }>(`/core/tenants/${tenantId}/reports/sales`, { params }).then(extractData),
}

export const balanceApi = {
  check: (data: { device_uuid: string; check_type: 'card' | 'mobile_pay' | 'qr_code'; check_value: string }) =>
    api.post('/core/balance/check', data).then(extractData),
}

export const mqttApi = {
  deviceMessage: (data: Record<string, unknown>) =>
    api.post('/mqtt/device-message', data).then(extractData),
  deviceStatus: (data: Record<string, unknown>) =>
    api.post('/mqtt/device-status', data).then(extractData),
}

export const webhookApi = {
  qrPayment: (data: Record<string, unknown>, webhookKey: string, signature: string) =>
    api.post('/webhook/qr-payment', data, {
      headers: {
        'X-Webhook-Key': webhookKey,
        'X-Signature-SHA256': signature,
      },
    }).then(extractData),
  qrPaymentPoll: (data: Record<string, unknown>) =>
    api.post('/webhook/qr-payment/poll', data).then(extractData),
}

export const legacyConfigApi = {
  getDevice: (uuid: string) =>
    api.get('/core/config/device', { params: { uuid } }).then(extractData),
  registerDevice: (data: Record<string, unknown>) =>
    api.post('/core/config/device', data).then(extractData),
  updateDevice: (uuid: string, data: Record<string, unknown>) =>
    api.put('/core/config/device', data, { params: { uuid } }).then(extractData),
}