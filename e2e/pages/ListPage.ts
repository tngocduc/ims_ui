import { Page, Locator, expect } from '@playwright/test'

export class ListPage {
  readonly page: Page
  readonly title: Locator
  readonly description: Locator
  readonly addButton: Locator
  readonly searchInput: Locator
  readonly searchButton: Locator
  readonly table: Locator
  readonly tableHeaders: Locator
  readonly tableRows: Locator
  readonly pagination: Locator
  readonly pageSizeSelect: Locator
  readonly pageInfo: Locator
  readonly prevButton: Locator
  readonly nextButton: Locator
  readonly errorMessage: Locator
  readonly emptyState: Locator

  constructor(page: Page, titleText: string) {
    this.page = page
    this.title = page.locator(`h1:has-text("${titleText}"), h2:has-text("${titleText}"), h3:has-text("${titleText}")`)
    this.description = page.locator('text=Manage')
    this.addButton = page.locator('button:has-text("Add")')
    this.searchInput = page.locator('input[placeholder*="Search"]')
    this.searchButton = page.locator('button:has-text("Search")')
    this.table = page.locator('table')
    this.tableHeaders = page.locator('thead th')
    this.tableRows = page.locator('tbody tr')
    this.pagination = page.locator('nav[aria-label="Pagination"], .pagination')
    this.pageSizeSelect = page.locator('select:near(:text("Rows per page")), select:near(:text("rows per page"))')
    this.pageInfo = page.locator('.pagination-info, text=/Showing.*of.*entries/i')
    this.prevButton = page.locator('button[aria-label="Previous page"], button:has-text("«")')
    this.nextButton = page.locator('button[aria-label="Next page"], button:has-text("»")')
    this.errorMessage = page.locator('[role="alert"]')
    this.emptyState = page.locator('text=No.*found')
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible()
    await expect(this.table).toBeVisible()
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    if (await this.searchButton.isVisible()) {
      await this.searchButton.click()
    } else {
      await this.searchInput.press('Enter')
    }
    await this.page.waitForLoadState('networkidle')
  }

  async clearSearch() {
    await this.searchInput.clear()
    await this.page.waitForLoadState('networkidle')
  }

  async getRowCount() {
    return await this.tableRows.count()
  }

  async clickRowAction(rowIndex: number, actionTitle: string) {
    const row = this.tableRows.nth(rowIndex)
    await row.locator(`button[title="${actionTitle}"]`).click()
    await this.page.waitForLoadState('networkidle')
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible()
  }

  async expectRowCount(count: number) {
    await expect(this.tableRows).toHaveCount(count)
  }

  async changePageSize(size: number) {
    await this.pageSizeSelect.selectOption(String(size))
    await this.page.waitForLoadState('networkidle')
  }

  async goToNextPage() {
    await this.nextButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async goToPrevPage() {
    await this.prevButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async expectPaginationVisible() {
    await expect(this.pagination).toBeVisible()
  }

  async getPageInfo() {
    return await this.pageInfo.textContent()
  }
}

export class UsersPage extends ListPage {
  constructor(page: Page) {
    super(page, 'Users')
  }

  async goto() {
    await this.page.goto('/users')
    await this.page.waitForLoadState('networkidle')
  }

  async expectUserRow(name: string, phone: string) {
    await expect(this.page.locator(`tbody tr:has-text("${name}")`)).toBeVisible()
  }
}

export class DevicesPage extends ListPage {
  constructor(page: Page) {
    super(page, 'Devices')
  }

  async goto() {
    await this.page.goto('/devices')
    await this.page.waitForLoadState('networkidle')
  }
}

export class TransactionsPage extends ListPage {
  readonly paymentMethodFilter: Locator
  readonly dateFromInput: Locator
  readonly dateToInput: Locator

  constructor(page: Page) {
    super(page, 'Transactions')
    this.paymentMethodFilter = page.locator('select:near(:text("Payment Method"))')
    this.dateFromInput = page.locator('input[type="date"]:near(:text("From"))')
    this.dateToInput = page.locator('input[type="date"]:near(:text("To"))')
  }

  async goto() {
    await this.page.goto('/transactions')
    await this.page.waitForLoadState('networkidle')
  }

  async filterByPaymentMethod(method: string) {
    await this.paymentMethodFilter.selectOption(method)
    await this.page.waitForLoadState('networkidle')
  }

  async filterByDateRange(from: string, to: string) {
    if (from) await this.dateFromInput.fill(from)
    if (to) await this.dateToInput.fill(to)
    await this.page.waitForLoadState('networkidle')
  }
}

export class ReportsPage {
  readonly page: Page
  readonly title: Locator
  readonly summaryCards: Locator
  readonly deviceFilter: Locator
  readonly dateFromInput: Locator
  readonly dateToInput: Locator
  readonly applyFiltersButton: Locator
  readonly paymentMethodTable: Locator
  readonly deviceTable: Locator
  readonly detailedTable: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.locator('h1:has-text("Sales Reports"), h2:has-text("Sales Reports"), h3:has-text("Sales Reports")')
    this.summaryCards = page.locator('[role="region"][aria-label="Summary Statistics"] article, .summary-card')
    this.deviceFilter = page.locator('input[placeholder*="device" i]')
    this.dateFromInput = page.locator('input[type="date"]:near(:text("Date From")), input[type="date"][id*="from" i]')
    this.dateToInput = page.locator('input[type="date"]:near(:text("Date To")), input[type="date"][id*="to" i]')
    this.applyFiltersButton = page.locator('button:has-text("Apply Filters")')
    this.paymentMethodTable = page.locator('section:has(h3:has-text("Payment Method")) table, section:has(h2:has-text("Payment Method")) table')
    this.deviceTable = page.locator('section:has(h3:has-text("Device")) table, section:has(h2:has-text("Device")) table')
    this.detailedTable = page.locator('section:has(h3:has-text("Detailed")) table, section:has(h2:has-text("Detailed")) table')
  }

  async goto() {
    await this.page.goto('/reports')
    await this.page.waitForLoadState('networkidle')
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible()
    await expect(this.summaryCards.first()).toBeVisible()
  }

  async filterByDevice(deviceUuid: string) {
    await this.deviceFilter.fill(deviceUuid)
    await this.applyFiltersButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async filterByDateRange(from: string, to: string) {
    if (from) await this.dateFromInput.fill(from)
    if (to) await this.dateToInput.fill(to)
    await this.applyFiltersButton.click()
    await this.page.waitForLoadState('networkidle')
  }
}

export class AdminUsersPage extends ListPage {
  readonly tenantFilter: Locator

  constructor(page: Page) {
    super(page, 'All Users')
    this.tenantFilter = page.locator('select:near(:text("Tenant"))')
  }

  async goto() {
    await this.page.goto('/admin/users')
    await this.page.waitForLoadState('networkidle')
  }
}

export class AdminDevicesPage extends ListPage {
  readonly tenantFilter: Locator

  constructor(page: Page) {
    super(page, 'All Devices')
    this.tenantFilter = page.locator('select:near(:text("Tenant"))')
  }

  async goto() {
    await this.page.goto('/admin/devices')
    await this.page.waitForLoadState('networkidle')
  }
}

export class AdminTransactionsPage extends ListPage {
  readonly tenantFilter: Locator

  constructor(page: Page) {
    super(page, 'All Transactions')
    this.tenantFilter = page.locator('select:near(:text("Tenant"))')
  }

  async goto() {
    await this.page.goto('/admin/transactions')
    await this.page.waitForLoadState('networkidle')
  }
}

export class AdminReportsPage {
  readonly page: Page
  readonly title: Locator
  readonly summaryCards: Locator
  readonly tenantFilter: Locator
  readonly deviceFilter: Locator
  readonly dateFromInput: Locator
  readonly dateToInput: Locator
  readonly applyFiltersButton: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.locator('h1:has-text("Sales Reports")')
    this.summaryCards = page.locator('[role="region"][aria-label="Summary Statistics"] article')
    this.tenantFilter = page.locator('select:near(:text("Tenant"))')
    this.deviceFilter = page.locator('input[placeholder="Filter by device UUID"]')
    this.dateFromInput = page.locator('input[type="date"]:near(:text("Date From"))')
    this.dateToInput = page.locator('input[type="date"]:near(:text("Date To"))')
    this.applyFiltersButton = page.locator('button:has-text("Apply Filters")')
  }

  async goto() {
    await this.page.goto('/admin/reports')
    await this.page.waitForLoadState('networkidle')
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible()
    await expect(this.summaryCards).toHaveCount(4)
  }
}