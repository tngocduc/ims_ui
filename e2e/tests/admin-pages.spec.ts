import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { LayoutPage } from '../pages/LayoutPage'
import { testUsers } from '../fixtures/testData'
import { AdminUsersPage, AdminDevicesPage, AdminTransactionsPage, AdminReportsPage } from '../pages/ListPage'

test.describe('Admin Users Page', () => {
  let usersPage: AdminUsersPage
  let layoutPage: LayoutPage
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    usersPage = new AdminUsersPage(page)
    layoutPage = new LayoutPage(page)
    
    await loginPage.goto()
    await loginPage.login(
      testUsers.admin.username,
      testUsers.admin.password
    )
    await usersPage.goto()
  })

  test('should load admin users page', async () => {
    await usersPage.expectLoaded()
    await layoutPage.expectLoaded()
  })

  test('should have tenant filter', async () => {
    await expect(usersPage.page.locator('select:near(:text("Tenant"))')).toBeVisible()
  })

  test('should filter by tenant', async () => {
    const tenantFilter = usersPage.page.locator('select:near(:text("Tenant"))')
    await tenantFilter.selectOption({ index: 1 })
    await usersPage.page.waitForLoadState('networkidle')
  })

  test('should have search', async () => {
    await expect(usersPage.searchInput).toBeVisible()
  })
})

test.describe('Admin Devices Page', () => {
  let devicesPage: AdminDevicesPage
  let layoutPage: LayoutPage
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    devicesPage = new AdminDevicesPage(page)
    layoutPage = new LayoutPage(page)
    
    await loginPage.goto()
    await loginPage.login(
      testUsers.admin.username,
      testUsers.admin.password
    )
    await devicesPage.goto()
  })

  test('should load admin devices page', async () => {
    await devicesPage.expectLoaded()
    await layoutPage.expectLoaded()
  })

  test('should have tenant filter', async () => {
    await expect(devicesPage.page.locator('select:near(:text("Tenant"))')).toBeVisible()
  })

  test('should filter by tenant', async () => {
    const tenantFilter = devicesPage.page.locator('select:near(:text("Tenant"))')
    await tenantFilter.selectOption({ index: 1 })
    await devicesPage.page.waitForLoadState('networkidle')
  })
})

test.describe('Admin Transactions Page', () => {
  let transactionsPage: AdminTransactionsPage
  let layoutPage: LayoutPage
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    transactionsPage = new AdminTransactionsPage(page)
    layoutPage = new LayoutPage(page)
    
    await loginPage.goto()
    await loginPage.login(
      testUsers.admin.username,
      testUsers.admin.password
    )
    await transactionsPage.goto()
  })

  test('should load admin transactions page', async () => {
    await transactionsPage.expectLoaded()
    await layoutPage.expectLoaded()
  })

  test('should have tenant filter', async () => {
    await expect(transactionsPage.page.locator('select:near(:text("Tenant"))')).toBeVisible()
  })

  test('should have all filters', async () => {
    await expect(transactionsPage.searchInput).toBeVisible()
    await expect(transactionsPage.paymentMethodFilter).toBeVisible()
    await expect(transactionsPage.dateFromInput).toBeVisible()
    await expect(transactionsPage.dateToInput).toBeVisible()
  })
})

test.describe('Admin Reports Page', () => {
  let reportsPage: AdminReportsPage
  let layoutPage: LayoutPage
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    reportsPage = new AdminReportsPage(page)
    layoutPage = new LayoutPage(page)
    
    await loginPage.goto()
    await loginPage.login(
      testUsers.admin.username,
      testUsers.admin.password
    )
    await reportsPage.goto()
  })

  test('should load admin reports page', async () => {
    await expect(reportsPage.title).toBeVisible()
    await layoutPage.expectLoaded()
  })

  test('should display 4 summary cards', async () => {
    await expect(reportsPage.summaryCards).toHaveCount(4)
  })

  test('should have tenant filter', async () => {
    await expect(reportsPage.page.locator('select:near(:text("Tenant"))')).toBeVisible()
  })

  test('should have filters', async () => {
    await expect(reportsPage.deviceFilter).toBeVisible()
    await expect(reportsPage.dateFromInput).toBeVisible()
    await expect(reportsPage.dateToInput).toBeVisible()
    await expect(reportsPage.applyFiltersButton).toBeVisible()
  })

  test('should display tenant table', async () => {
    await expect(reportsPage.page.locator('section:has(h3:has-text("Tenant")) table')).toBeVisible()
  })

  test('should display payment method table', async () => {
    await expect(reportsPage.page.locator('section:has(h3:has-text("Payment Method")) table')).toBeVisible()
  })

  test('should display detailed data table', async () => {
    await expect(reportsPage.page.locator('section:has(h3:has-text("Detailed")) table')).toBeVisible()
  })
})