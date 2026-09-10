import { Page, Locator, expect } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly tenantIdInput: Locator
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly showPasswordButton: Locator
  readonly sessionLoginCheckbox: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly title: Locator

  constructor(page: Page) {
    this.page = page
    this.tenantIdInput = page.locator('input[name="tenant_id"]')
    this.usernameInput = page.locator('input[name="username"]')
    this.passwordInput = page.locator('input[name="password"]')
    this.showPasswordButton = page.locator('button[aria-label*="password"]')
    this.sessionLoginCheckbox = page.locator('input[type="checkbox"]')
    this.submitButton = page.locator('button[type="submit"]')
    this.errorMessage = page.locator('[role="alert"]')
    this.title = page.locator('h3:has-text("Tenant Login"), h2:has-text("Tenant Login"), h1:has-text("Tenant Login")')
  }

  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  async login(tenantId: string, username: string, password: string, useSessionLogin = false) {
    await this.tenantIdInput.fill(tenantId)
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    if (useSessionLogin) {
      await this.sessionLoginCheckbox.check()
    }
    await this.submitButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async togglePasswordVisibility() {
    await this.showPasswordButton.click()
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toBeVisible()
    await expect(this.errorMessage).toContainText(message)
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible()
    await expect(this.tenantIdInput).toBeVisible()
    await expect(this.usernameInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
  }

  async expectNoAdminLink() {
    await expect(this.page.locator('a[href="/admin"]')).not.toBeVisible()
  }

  async expectNoDemoInfo() {
    await expect(this.page.locator('text=Demo')).not.toBeVisible()
  }
}

export class AdminLoginPage {
  readonly page: Page
  readonly usernameInput: Locator
  readonly passwordInput: Locator
  readonly showPasswordButton: Locator
  readonly sessionLoginCheckbox: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly title: Locator
  readonly backLink: Locator

  constructor(page: Page) {
    this.page = page
    this.usernameInput = page.locator('input[name="username"]')
    this.passwordInput = page.locator('input[name="password"]')
    this.showPasswordButton = page.locator('button[aria-label*="password"]')
    this.sessionLoginCheckbox = page.locator('input[type="checkbox"]')
    this.submitButton = page.locator('button[type="submit"]')
    this.errorMessage = page.locator('[role="alert"]')
    this.title = page.locator('h3:has-text("Sign In"), h2:has-text("Sign In"), h1:has-text("Sign In")')
    this.backLink = page.locator('a[href="/"]')
  }

  async goto() {
    await this.page.goto('/admin')
    await this.page.waitForLoadState('networkidle')
  }

  async login(username: string, password: string, useSessionLogin = false) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    if (useSessionLogin) {
      await this.sessionLoginCheckbox.check()
    }
    await this.submitButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible()
    await expect(this.usernameInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
  }
}