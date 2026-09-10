import { Page, Locator, expect } from '@playwright/test'

export class LayoutPage {
  readonly page: Page
  readonly sidebar: Locator
  readonly sidebarToggle: Locator
  readonly logo: Locator
  readonly navLinks: Locator
  readonly userPanel: Locator
  readonly logoutButton: Locator
  readonly topBar: Locator
  readonly pageTitle: Locator
  readonly tenantBadge: Locator
  readonly mainContent: Locator

  constructor(page: Page) {
    this.page = page
    this.sidebar = page.locator('aside[role="navigation"]')
    this.sidebarToggle = page.locator('button[aria-label*="sidebar"]')
    this.logo = page.locator('a[aria-label="IMS Hub"]')
    this.navLinks = page.locator('nav a')
    this.userPanel = page.locator('.user-panel, .sidebar-footer .user-info')
    this.logoutButton = page.locator('button:has-text("Logout")')
    this.topBar = page.locator('header[role="banner"]')
    this.pageTitle = page.locator('header h1, header h2')
    this.tenantBadge = page.locator('.tenant-badge, span:has-text("Tenant:")')
    this.mainContent = page.locator('main[role="main"]')
  }

  async expectLoaded() {
    await expect(this.sidebar).toBeVisible()
    await expect(this.topBar).toBeVisible()
    await expect(this.mainContent).toBeVisible()
  }

  async expectSidebarExpanded() {
    await expect(this.sidebar).toHaveClass(/w-64/)
  }

  async expectSidebarCollapsed() {
    await expect(this.sidebar).toHaveClass(/w-16/)
  }

  async toggleSidebar() {
    await this.sidebarToggle.click()
    await this.page.waitForTimeout(200)
  }

  async clickNavLink(label: string) {
    await this.navLinks.filter({ hasText: label }).click()
    await this.page.waitForLoadState('networkidle')
  }

  async expectNavLinkActive(label: string) {
    const link = this.navLinks.filter({ hasText: label })
    await expect(link).toHaveClass(/active/)
  }

  async logout() {
    await this.logoutButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async getTenantBadgeText() {
    return await this.tenantBadge.textContent()
  }

  async getPageTitle() {
    return await this.pageTitle.textContent()
  }
}

export class AdminLayoutPage extends LayoutPage {
  constructor(page: Page) {
    super(page)
  }
}

export class TenantLayoutPage extends LayoutPage {
  constructor(page: Page) {
    super(page)
  }
}