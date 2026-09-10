import { Page, Locator, expect } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly title: Locator
  readonly statCards: Locator
  readonly quickActions: Locator
  readonly recentActivity: Locator
  readonly sidebar: Locator
  readonly topBar: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.locator('h1:has-text("Dashboard")')
    this.statCards = page.locator('[role="region"][aria-label="Statistics"] article')
    this.quickActions = page.locator('section:has(h3:has-text("Quick Actions")) button')
    this.recentActivity = page.locator('section:has(h3:has-text("Recent Activity"))')
    this.sidebar = page.locator('aside[role="navigation"]')
    this.topBar = page.locator('header[role="banner"]')
  }

  async goto() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible()
    await expect(this.sidebar).toBeVisible()
    await expect(this.topBar).toBeVisible()
  }

  async expectStatCards(count: number) {
    await expect(this.statCards).toHaveCount(count)
  }

  async expectStatCardValue(label: string, expectedValue: string) {
    const card = this.statCards.filter({ hasText: label })
    await expect(card.locator('p:first-child')).toContainText(expectedValue)
  }

  async clickQuickAction(actionLabel: string) {
    await this.quickActions.filter({ hasText: actionLabel }).click()
    await this.page.waitForLoadState('networkidle')
  }

  async expectRecentActivityEmpty() {
    await expect(this.recentActivity.locator('text=No recent activity')).toBeVisible()
  }
}

export class AdminDashboardPage {
  readonly page: Page
  readonly title: Locator
  readonly statCards: Locator
  readonly quickActions: Locator
  readonly systemOverview: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.locator('h1:has-text("Admin Dashboard")')
    this.statCards = page.locator('[role="region"][aria-label="Statistics"] article')
    this.quickActions = page.locator('section:has(h3:has-text("Quick Actions")) button')
    this.systemOverview = page.locator('section:has(h3:has-text("System Overview"))')
  }

  async goto() {
    await this.page.goto('/admin/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible()
  }
}