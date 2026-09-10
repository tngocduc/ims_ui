import { test, expect } from '@playwright/test'
import { UsersPage, DevicesPage, TransactionsPage, ReportsPage } from '../pages/ListPage'
import { LayoutPage } from '../pages/LayoutPage'
import { LoginPage } from '../pages/LoginPage'
import { testUsers, routes } from '../fixtures/testData'

test.describe('Users Page', () => {
  let usersPage: UsersPage
  let layoutPage: LayoutPage
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    usersPage = new UsersPage(page)
    layoutPage = new LayoutPage(page)
    
    await loginPage.goto()
    await loginPage.login(
      testUsers.tenant.tenantId,
      testUsers.tenant.username,
      testUsers.tenant.password
    )
    await usersPage.goto()
  })

  test('should load users page', async () => {
    await usersPage.expectLoaded()
    await layoutPage.expectLoaded()
  })

  test('should have search functionality', async () => {
    await expect(usersPage.searchInput).toBeVisible()
    await usersPage.search('test')
    await usersPage.clearSearch()
  })

  test('should display pagination', async () => {
    await usersPage.expectPaginationVisible()
  })

  test('should change page size', async () => {
    await usersPage.changePageSize(10)
    await expect(usersPage.pageSizeSelect).toHaveValue('10')
    await usersPage.changePageSize(50)
    await expect(usersPage.pageSizeSelect).toHaveValue('50')
  })

  test('should navigate pages', async () => {
    const totalPages = await usersPage.page.locator('button[aria-label="Last page"]').isVisible()
    if (totalPages) {
      await usersPage.goToNextPage()
      await usersPage.goToPrevPage()
    }
  })
})

test.describe('Devices Page', () => {
  let devicesPage: DevicesPage
  let layoutPage: LayoutPage
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    devicesPage = new DevicesPage(page)
    layoutPage = new LayoutPage(page)
    
    await loginPage.goto()
    await loginPage.login(
      testUsers.tenant.tenantId,
      testUsers.tenant.username,
      testUsers.tenant.password
    )
    await devicesPage.goto()
  })

  test('should load devices page', async () => {
    await devicesPage.expectLoaded()
    await layoutPage.expectLoaded()
  })

  test('should have search functionality', async () => {
    await expect(devicesPage.searchInput).toBeVisible()
    await devicesPage.search('test')
    await devicesPage.clearSearch()
  })

  test('should display status badges', async () => {
    const rows = devicesPage.tableRows
    const count = await rows.count()
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const statusCell = rows.nth(i).locator('.status-badge, [class*="status-"]')
        await expect(statusCell).toBeVisible()
      }
    }
  })
})

test.describe('Transactions Page', () => {
  let transactionsPage: TransactionsPage
  let layoutPage: LayoutPage
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    transactionsPage = new TransactionsPage(page)
    layoutPage = new LayoutPage(page)
    
    await loginPage.goto()
    await loginPage.login(
      testUsers.tenant.tenantId,
      testUsers.tenant.username,
      testUsers.tenant.password
    )
    await transactionsPage.goto()
  })

  test('should load transactions page', async () => {
    await transactionsPage.expectLoaded()
    await layoutPage.expectLoaded()
  })

  test('should have filter controls', async () => {
    await expect(transactionsPage.searchInput).toBeVisible()
    await expect(transactionsPage.paymentMethodFilter).toBeVisible()
    await expect(transactionsPage.dateFromInput).toBeVisible()
    await expect(transactionsPage.dateToInput).toBeVisible()
  })

  test('should filter by payment method', async () => {
    await transactionsPage.filterByPaymentMethod('cash')
    await expect(transactionsPage.paymentMethodFilter).toHaveValue('cash')
  })

  test('should filter by date range', async () => {
    await transactionsPage.filterByDateRange('2024-01-01', '2024-12-31')
  })

  test('should have pagination', async () => {
    await transactionsPage.expectPaginationVisible()
  })
})

test.describe('Reports Page', () => {
  let reportsPage: ReportsPage
  let layoutPage: LayoutPage
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    reportsPage = new ReportsPage(page)
    layoutPage = new LayoutPage(page)
    
    await loginPage.goto()
    await loginPage.login(
      testUsers.tenant.tenantId,
      testUsers.tenant.username,
      testUsers.tenant.password
    )
    await reportsPage.goto()
  })

  test('should load reports page', async () => {
    await reportsPage.expectLoaded()
    await layoutPage.expectLoaded()
  })

  test('should display 4 summary cards', async () => {
    await expect(reportsPage.summaryCards).toHaveCount(4)
  })

  test('should have filter controls', async () => {
    await expect(reportsPage.deviceFilter).toBeVisible()
    await expect(reportsPage.dateFromInput).toBeVisible()
    await expect(reportsPage.dateToInput).toBeVisible()
    await expect(reportsPage.applyFiltersButton).toBeVisible()
  })

  test('should filter by device', async () => {
    await reportsPage.filterByDevice('test-device')
  })

  test('should filter by date range', async () => {
    await reportsPage.filterByDateRange('2024-01-01', '2024-12-31')
  })

  test('should display payment method table', async () => {
    await expect(reportsPage.paymentMethodTable).toBeVisible()
  })

  test('should display device table', async () => {
    await expect(reportsPage.deviceTable).toBeVisible()
  })

  test('should display detailed data table', async () => {
    await expect(reportsPage.detailedTable).toBeVisible()
  })
})