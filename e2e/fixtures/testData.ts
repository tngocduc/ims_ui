export const testUsers = {
  tenant: {
    tenantId: '1',
    username: 'admin',
    password: 'password',
  },
  admin: {
    username: 'admin',
    password: 'password',
  },
  invalid: {
    username: 'invalid',
    password: 'invalid',
  },
}

export const testData = {
  users: [
    { name: 'John Doe', phone: '+1234567890', balance: '1000' },
    { name: 'Jane Smith', phone: '+1234567891', balance: '2000' },
  ],
  devices: [
    { uuid: 'dev-001', type: 'Vending Machine', firmware: '1.0.0', status: 'online' },
    { uuid: 'dev-002', type: 'Kiosk', firmware: '1.1.0', status: 'offline' },
  ],
  transactions: [
    { txNumber: 'TX-001', device: 'dev-001', amount: '100', status: 'Success' },
    { txNumber: 'TX-002', device: 'dev-002', amount: '200', status: 'Failed' },
  ],
}

export const routes = {
  login: '/',
  adminLogin: '/admin',
  dashboard: '/dashboard',
  users: '/users',
  devices: '/devices',
  transactions: '/transactions',
  reports: '/reports',
  adminDashboard: '/admin/dashboard',
  adminUsers: '/admin/users',
  adminDevices: '/admin/devices',
  adminTransactions: '/admin/transactions',
  adminReports: '/admin/reports',
}

export const viewportSizes = {
  desktop: { width: 1280, height: 720 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
}