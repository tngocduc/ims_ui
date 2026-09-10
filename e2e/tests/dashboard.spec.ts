import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/DashboardPage'
import { LayoutPage } from '../pages/LayoutPage'
import { LoginPage } from '../pages/LoginPage'
import { testUsers } from '../fixtures/testData'

test.describe('Tenant Dashboard', () => {
  let dashboardPage: DashboardPage
  let layoutPage: LayoutPage
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    dashboardPage = new DashboardPage(page)
    layoutPage = new LayoutPage(page)
    
    await loginPage.goto()
    await loginPage.login(
      testUsers.tenant.tenantId,
      testUsers.tenant.username,
      testUsers.tenant.password
    )
    await dashboardPage.goto()
  })

  test('should load dashboard with all components', async () => {
    await dashboardPage.expectLoaded()
    await layoutPage.expectLoaded()
    await layoutPage.expectSidebarExpanded()
  })

  test('should display 4 stat cards', async () => {
    await dashboardPage.expectStatCards(4)
  })

  test('should display correct stat card labels', async () => {
    await expect(dashboardPage.statCards.nth(0)).toContainText('Total Users')
    await expect(dashboardPage.statCards.nth(1)).toContainText('Total Devices')
    await expect(dashboardPage.statCards.nth(2)).toContainText('Online Devices')
    await expect(dashboardPage.statCards.nth(3)).toContainText('Total Balance')
  })

  test('should display quick actions section', async () => {
    await expect(dashboardPage.quickActions).toHaveCount(4)
    await expect(dashboardPage.quickActions.nth(0)).toContainText('Add User')
    await expect(dashboardPage.quickActions.nth(1)).toContainText('Register Device')
    await expect(dashboardPage.quickActions.nth(2)).toContainText('Top Up Balance')
    await expect(dashboardPage.quickActions.nth(3)).toContainText('View Reports')
  })

  test('should display recent activity section', async () => {
    await dashboardPage.expectRecentActivityEmpty()
  })

  test('sidebar navigation should work', async () => {
    await layoutPage.clickNavLink('Users')
    await expect(page).toHaveURL(/.*users/)
    
    await layoutPage.clickNavLink('Devices')
    await expect(page).toHaveURL(/.*devices/)
    
    await layoutPage.clickNavLink('Dashboard')
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('should collapse and expand sidebar', async () => {
    await layoutPage.toggleSidebar()
    await layoutPage.expectSidebarCollapsed()
    
    await layoutPage.toggleSidebar()
    await layoutPage.expectSidebarExpanded()
  })

  test('logout should redirect to login', async () => {
    await layoutPage.logout()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Admin Dashboard', () => {
  let dashboardPage: DashboardPage
  let layoutPage: LayoutPage
  let adminLoginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    adminLoginPage = new LoginPage(page)
    dashboardPage = new DashboardPage(page)
    layoutPage = new LayoutPage(page)
    
    await adminLoginPage.goto()
    await adminLoginPage.login(
      testUsers.admin.username,
      testUsers.admin.password
    )
    await dashboardPage.goto()
  })

  test('should load admin dashboard', async () => {
    await dashboardPage.expectLoaded()
    await layoutPage.expectLoaded()
  })

  test('should display 4 stat cards', async () => {
    await dashboardPage.expectStatCards(4)
  })

  test('should display admin quick actions', async () => {
    await expect(dashboardPage.quickActions).toHaveCount(4)
  })
})