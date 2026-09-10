/// <reference types="vite/client" />

import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
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
          const { access, refresh } = response.data
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

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/token/pair', { username, password }),
  sessionLogin: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  verifyToken: (token: string) => api.post('/auth/token/verify', { token }),
}

export const tenantApi = {
  list: (params?: Record<string, unknown>) => api.get('/core/tenants', { params }),
  create: (data: Record<string, unknown>) => api.post('/core/tenants', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/core/tenants/${id}`, data),
  delete: (id: number) => api.delete(`/core/tenants/${id}`),
}

export const tenantUserApi = {
  list: (params?: Record<string, unknown>) => api.get('/core/tenant/users', { params }),
  create: (data: Record<string, unknown>) => api.post('/core/tenant/users', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/core/tenant/users/${id}`, data),
  getBalance: (id: number) => api.get(`/core/tenant/users/${id}/balance`),
  topup: (id: number, data: Record<string, unknown>) => api.post(`/core/tenant/users/${id}/topup`, data),
}

export const deviceApi = {
  list: (params?: Record<string, unknown>) => api.get('/core/tenant/devices/status', { params }),
  getConfig: (uuid: string) => api.get('/core/config/device', { params: { uuid } }),
  register: (data: Record<string, unknown>) => api.post('/core/config/device', data),
  update: (uuid: string, data: Record<string, unknown>) => api.put('/core/config/device', data, { params: { uuid } }),
}

export const transactionApi = {
  insert: (data: Record<string, unknown>) => api.post('/core/transaction/insert', data),
}

export const reportApi = {
  sales: (params?: Record<string, unknown>) => api.get('/core/tenant/reports/sales', { params }),
}