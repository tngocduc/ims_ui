# E2E Tests for IMS UI

## Overview

End-to-end tests using Playwright for the IMS Hub UI application.

## Test Structure

```
e2e/
├── playwright.config.ts     # Playwright configuration
├── pages/                   # Page Object Models
│   ├── LoginPage.ts         # Login page objects (tenant + admin)
│   ├── DashboardPage.ts     # Dashboard page objects
│   ├── ListPage.ts          # List pages (users, devices, transactions, reports)
│   └── LayoutPage.ts        # Layout/sidebar page objects
├── fixtures/
│   └── testData.ts          # Test users, routes, viewport sizes
└── tests/                   # Test specifications
    ├── login.spec.ts        # Login page tests
    ├── dashboard.spec.ts    # Dashboard tests
    ├── list-pages.spec.ts   # List page tests (users, devices, transactions, reports)
    ├── admin-pages.spec.ts  # Admin page tests
    ├── responsive.spec.ts   # Responsive design tests
    └── accessibility.spec.ts # Accessibility tests
```

## Running Tests

### Install Dependencies
```bash
cd /home/ductran/ims/ims_ui
npm install -D @playwright/test
npx playwright install chromium
```

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test e2e/tests/login.spec.ts
npx playwright test e2e/tests/dashboard.spec.ts
npx playwright test e2e/tests/list-pages.spec.ts
npx playwright test e2e/tests/admin-pages.spec.ts
npx playwright test e2e/tests/responsive.spec.ts
npx playwright test e2e/tests/accessibility.spec.ts
```

### Run with UI
```bash
npx playwright test --ui
```

### Run in Headed Mode
```bash
npx playwright test --headed
```

### Generate HTML Report
```bash
npx playwright test --reporter=html
npx playwright show-report
```

### Debug Mode
```bash
npx playwright test --debug
```

## Test Coverage

### Login Tests
- ✅ Page loads correctly with all form elements
- ✅ Invalid credentials show error
- ✅ Password visibility toggle
- ✅ Accessibility attributes (required, ids, labels)
- ✅ No demo info or admin link on tenant login
- ✅ Admin login page loads with back link

### Dashboard Tests
- ✅ Loads with all components (stat cards, quick actions, recent activity)
- ✅ 4 stat cards with correct labels
- ✅ Quick actions section with 4 buttons
- ✅ Sidebar navigation works
- ✅ Sidebar collapse/expand
- ✅ Logout redirects to login
- ✅ Admin dashboard loads with correct stats

### List Pages Tests (Users, Devices, Transactions, Reports)
- ✅ Page loads with table and pagination
- ✅ Search functionality
- ✅ Pagination (next/prev, page size)
- ✅ Filter controls (payment method, date range)
- ✅ Status badges display correctly

### Admin Pages Tests
- ✅ Admin users page with tenant filter
- ✅ Admin devices page with tenant filter
- ✅ Admin transactions with all filters
- ✅ Admin reports with summary cards and tables

### Responsive Design Tests
- ✅ Mobile viewport (375x667)
- ✅ Tablet viewport (768x1024)
- ✅ Desktop viewport (1280x720)
- ✅ Sidebar behavior on mobile

### Accessibility Tests
- ✅ Proper heading structure (h1)
- ✅ Form labels associated with inputs
- ✅ Required attributes on required fields
- ✅ Error messages with role="alert"
- ✅ Proper landmarks (main, aside, header)
- ✅ Table headers with scope="col"
- ✅ Accessible button names
- ✅ Visible focus states
- ✅ Keyboard navigation

## Page Object Pattern

Each page has a dedicated Page Object class that encapsulates:
- Element locators
- Page actions (login, search, filter, navigate)
- Assertion helpers

Example:
```typescript
const loginPage = new LoginPage(page)
await loginPage.goto()
await loginPage.login('tenant_id', 'username', 'password')
await loginPage.expectError('Login failed')
```

## Fixtures

Test data is centralized in `e2e/fixtures/testData.ts`:
- Test users (tenant, admin, invalid)
- Routes
- Viewport sizes for responsive testing

## Configuration

The `playwright.config.ts` includes:
- Base URL: http://localhost:3000
- Auto-starts dev server
- HTML reporter
- Screenshots on failure
- Videos on failure
- Traces on first retry
- Single worker for CI