import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { AdminLoginPage } from '../pages/LoginPage'
import { testUsers } from '../fixtures/testData'

test.describe('Login Page - Tenant', () => {
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    await loginPage.goto()
  })

  test('should load login page correctly', async ({ page }) => {
    await loginPage.expectLoaded()
    await loginPage.expectNoAdminLink()
    await loginPage.expectNoDemoInfo()
    
    // Check form elements
    await expect(loginPage.tenantIdInput).toBeVisible()
    await expect(loginPage.usernameInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
    await expect(loginPage.sessionLoginCheckbox).toBeVisible()
  })

  test('should show error for invalid credentials', async () => {
    await loginPage.login(
      testUsers.invalid.username,
      testUsers.invalid.password
    )
    await loginPage.expectError('Login failed')
  })

  test('should toggle password visibility', async () => {
    await loginPage.passwordInput.fill('testpassword')
    expect(await loginPage.passwordInput.getAttribute('type')).toBe('password')
    
    await loginPage.togglePasswordVisibility()
    expect(await loginPage.passwordInput.getAttribute('type')).toBe('text')
    
    await loginPage.togglePasswordVisibility()
    expect(await loginPage.passwordInput.getAttribute('type')).toBe('password')
  })

  test('should have proper accessibility attributes', async () => {
    await expect(loginPage.tenantIdInput).toHaveAttribute('required')
    await expect(loginPage.usernameInput).toHaveAttribute('required')
    await expect(loginPage.passwordInput).toHaveAttribute('required')
    await expect(loginPage.tenantIdInput).toHaveAttribute('id')
    await expect(loginPage.usernameInput).toHaveAttribute('id')
    await expect(loginPage.passwordInput).toHaveAttribute('id')
  })
})

test.describe('Login Page - Admin', () => {
  let adminLoginPage: AdminLoginPage

  test.beforeEach(async ({ page }) => {
    adminLoginPage = new AdminLoginPage(page)
    await adminLoginPage.goto()
  })

  test('should load admin login page correctly', async () => {
    await adminLoginPage.expectLoaded()
    await expect(adminLoginPage.usernameInput).toBeVisible()
    await expect(adminLoginPage.passwordInput).toBeVisible()
    await expect(adminLoginPage.submitButton).toBeVisible()
    await expect(adminLoginPage.backLink).toBeVisible()
    await expect(adminLoginPage.backLink).toHaveAttribute('href', '/')
  })

  test('should show error for invalid credentials', async () => {
    await adminLoginPage.login(
      testUsers.invalid.username,
      testUsers.invalid.password
    )
    await expect(adminLoginPage.errorMessage).toBeVisible()
    await expect(adminLoginPage.errorMessage).toContainText('Login failed')
  })

  test('should navigate back to tenant login', async () => {
    await adminLoginPage.backLink.click()
    await expect(adminLoginPage.page).toHaveURL('/')
  })
})