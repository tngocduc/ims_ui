# IMS Hub UI - Documentation with Screenshots

## Overview

IMS Hub is a modern, dark-themed React UI for managing vending machine tenants, users, devices, transactions, and sales reports. Built with React 18, TypeScript, Vite, Tailwind CSS, and shadcn/ui components.

## Screenshots

### 1. Tenant Login Page
![Tenant Login](docs/screenshots/login-error.png)

**Features:**
- Tenant ID, Username, Password fields
- Session login (browser cookies) option
- Show/hide password toggle
- Error handling with inline messages
- No demo credentials or admin link (clean UI)

### 2. Tenant Dashboard
![Dashboard Load](docs/screenshots/dashboard-load.png)

**Components:**
- **Stat Cards**: Total Users, Total Devices, Online Devices, Total Balance
- **Quick Actions**: Add User, Register Device, Top Up Balance, View Reports
- **Recent Activity**: Placeholder for future activity feed

### 3. Dashboard Statistics
![Dashboard Stats](docs/screenshots/dashboard-stats.png)

**Features:**
- Big-number stat callouts with huge numbers, small captions
- Monospace typography for data
- Clean card layout with subtle borders

### 4. Quick Actions
![Dashboard Actions](docs/screenshots/dashboard-actions.png)

**Buttons:**
- Add User (primary)
- Register Device
- Top Up Balance
- View Reports

### 5. Sidebar Navigation
![Dashboard Sidebar](docs/screenshots/dashboard-sidebar.png)

**Navigation:**
- Dashboard, Users, Devices, Transactions, Reports
- Collapsible sidebar (desktop)
- User panel with avatar and role
- Logout button

## Design System

### Color Palette
```css
:root {
  --bg-base: #0A0A0B;         /* Page background */
  --bg-surface: #131315;      /* Cards, panels */
  --bg-surface-hover: #1B1B1E;
  --border-subtle: #26262A;
  --border-strong: #3A3A40;
  --text-primary: #F4F4F5;
  --text-muted: #9A9AA2;
  --text-disabled: #5C5C63;
  --accent: #FF6A3D;          /* Warm orange - primary CTA */
  --accent-hover: #FF8259;
  --status-pass: #3DD68C;
  --status-fail: #F0555B;
  --status-running: #5B9DF0;
}
```

### Typography
- **UI Chrome**: Inter (sans-serif)
- **Code/Data**: JetBrains Mono (monospace)
- **Section Headers**: `// comment-style` in monospace

### Components
- **Buttons**: Primary (accent), Secondary, Ghost, Danger variants
- **Inputs**: Dark surfaces, accent focus rings
- **Tables**: Monospace, hover states, virtualized
- **Status Badges**: Color-coded with dots
- **Metric Cards**: Huge numbers, small captions

## Pages

| Route | Description |
|-------|-------------|
| `/` | Tenant login |
| `/admin` | Admin login |
| `/dashboard` | Tenant dashboard |
| `/users` | User management |
| `/devices` | Device management |
| `/transactions` | Transaction history |
| `/reports` | Sales reports |
| `/admin/dashboard` | Admin overview |
| `/admin/users` | All users (all tenants) |
| `/admin/devices` | All devices |
| `/admin/transactions` | All transactions |
| `/admin/reports` | Global sales reports |

## Running the Application

```bash
cd /home/ductran/ims/ims_ui
npm run dev      # Dev server at http://localhost:3000
npm run build    # Production build
npm run test     # Playwright e2e tests
```

## API Integration

Proxies to Django Ninja API at `http://localhost:8000/api/v1`:
- JWT authentication with automatic token refresh
- Session login support (browser cookies)
- TanStack Query for caching/background refetch
- Pagination: 20 items/page default