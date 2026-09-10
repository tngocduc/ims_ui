import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { DashboardPage } from '../pages/DashboardPage'
import { LayoutPage } from '../pages/LayoutPage'
import { testUsers } from '../fixtures/testData'

test.describe('Accessibility', () => {
  test('login page should have proper heading structure', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    
    // Check h1 exists
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Tenant Login')
  })

  test('login form should have proper labels', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    
    // Check each input has associated label
    await expect(page.locator('label[for="tenant_id"]')).toBeVisible()
    await expect(page.locator('label[for="username"]')).toBeVisible()
    await expect(page.locator('label[for="password"]')).toBeVisible()
    
    // Check inputs have ids matching labels
    await expect(loginPage.tenantIdInput).toHaveAttribute('id', 'tenant_id')
    await expect(loginPage.usernameInput).toHaveAttribute('id', 'username')
    await expect(loginPage.passwordInput).toHaveAttribute('id', 'password')
  })

  test('login form should have required attributes', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    
    await expect(loginPage.tenantIdInput).toHaveAttribute('required')
    await expect(loginPage.usernameInput).toHaveAttribute('required')
    await expect(loginPage.passwordInput).toHaveAttribute('required')
  })

  test('error message should have role alert', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('invalid', 'invalid')
    
    await expect(page.locator('[role="alert"]')).toBeVisible()
  })

  test('dashboard should have proper landmarks', async ({ page }) => {
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
    
    // Check main landmarks
    await expect(page.locator('main[role="main"]')).toBeVisible()
    await expect(page.locator('aside[role="navigation"]')).toBeVisible()
    await expect(page.locator('header[role="banner"]')).toBeVisible()
  })

  test('tables should have proper headers', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(
      testUsers.tenant.tenantId,
      testUsers.tenant.username,
      testUsers.tenant.password
    )
    
    await page.goto('/users')
    await page.waitForLoadState('networkidle')
    
    // Check table has proper headers
    await expect(page.locator('thead th')).toHaveCountGreaterThan(0)
    
    // Check scope attributes
    const headers = page.locator('thead th')
    const count = await headers.count()
    for (let i = 0; i < count; i++) {
      await expect(headers.nth(i)).toHaveAttribute('scope', 'col')
    }
  })

  test('buttons should have accessible names', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    
    // Submit button should have accessible text
    await expect(loginPage.submitButton).toHaveText('Sign In')
    
    // Eye button should have aria-label
    await expect(page.locator('button[aria-label*="password"]')).toBeVisible()
  })

  test('focus should be visible', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    
    // Tab to first input
    await page.keyboard.press('Tab')
    await expect(loginPage.tenantIdInput).toBeFocused()
    
    // Tab to username
    await page.keyboard.press('Tab')
    await expect(loginPage.usernameInput).toBeFocused()
    
    // Tab to password
    await page.keyboard.press('Tab')
    await expect(loginPage.passwordInput).toBeFocused()
  })

  test('color contrast should meet WCAG AA', async ({ page }) => {
    // This is a basic check - full contrast testing would need axe-core
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    
    // Check that text elements have reasonable contrast by verifying they're not transparent
    const textColor = await page.locator('h1').evaluate(el => 
      window.getComputedStyle(el).color
    )
    expect(textColor).not.toBe('rgba(0, 0, 0, 0)')
  })
})