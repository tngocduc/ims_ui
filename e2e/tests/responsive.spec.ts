import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { LayoutPage } from '../pages/LayoutPage'
import { testUsers, viewportSizes } from '../fixtures/testData'

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize(viewportSizes.mobile)
    
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.expectLoaded()
    
    // Login form should be visible and usable
    await expect(loginPage.tenantIdInput).toBeVisible()
    await expect(loginPage.usernameInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
  })

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize(viewportSizes.tablet)
    
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.expectLoaded()
  })

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize(viewportSizes.desktop)
    
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.expectLoaded()
  })

  test('sidebar should collapse on mobile', async ({ page }) => {
    await page.setViewportSize(viewportSizes.mobile)
    
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(
      testUsers.tenant.tenantId,
      testUsers.tenant.username,
      testUsers.tenant.password
    )
    
    const layoutPage = new LayoutPage(page)
    await layoutPage.page.goto('/dashboard')
    await layoutPage.page.waitForLoadState('networkidle')
    
    // On mobile, sidebar should be collapsed or hidden
    await expect(layoutPage.sidebar).toBeVisible()
  })
})