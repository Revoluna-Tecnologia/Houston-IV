import { test, expect, TEST_USERS } from '../fixtures/auth.fixture'

test.describe('Dashboard', () => {
  test.describe('Authenticated Access', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/')

      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should display dashboard for authenticated admin', async ({
      page,
      loginAs,
    }) => {
      await loginAs('admin')

      // Should be on dashboard
      await expect(page).toHaveURL('/')

      // Dashboard elements should be visible
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    test('should display user name in header', async ({ page, loginAs }) => {
      await loginAs('admin')

      // User name or avatar should be visible
      await expect(page.locator('header')).toContainText(
        new RegExp(TEST_USERS.admin.name, 'i')
      )
    })
  })

  test.describe('Dashboard Metrics', () => {
    test('should display metric cards', async ({ page, loginAs }) => {
      await loginAs('admin')

      // Metric cards should be visible
      const metricCards = page.locator('[data-testid="metric-card"]')
      await expect(metricCards.first()).toBeVisible({ timeout: 10000 })
    })

    test('should display recent activity section', async ({
      page,
      loginAs,
    }) => {
      await loginAs('admin')

      // Look for activity or recent sections
      await expect(
        page.getByText(/atividade|recente|ultimos/i)
      ).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Navigation', () => {
    test('should have sidebar with navigation links', async ({
      page,
      loginAs,
    }) => {
      await loginAs('admin')

      // Sidebar should have navigation links
      const sidebar = page.locator('nav, aside').first()
      await expect(sidebar).toBeVisible()

      // Check for common navigation items
      await expect(
        page.getByRole('link', { name: /vagas|medicos|hospitais/i })
      ).toBeVisible()
    })

    test('should navigate to vagas page', async ({ page, loginAs }) => {
      await loginAs('admin')

      // Click on vagas link
      await page.getByRole('link', { name: /vagas/i }).first().click()

      // Should be on vagas page
      await expect(page).toHaveURL(/\/vagas/)
    })

    test('should navigate to medicos page', async ({ page, loginAs }) => {
      await loginAs('admin')

      // Click on medicos link
      await page.getByRole('link', { name: /medicos/i }).first().click()

      // Should be on medicos page
      await expect(page).toHaveURL(/\/medicos/)
    })

    test('should navigate to hospitais page', async ({ page, loginAs }) => {
      await loginAs('admin')

      // Click on hospitais link
      await page.getByRole('link', { name: /hospitais/i }).first().click()

      // Should be on hospitais page
      await expect(page).toHaveURL(/\/hospitais/)
    })
  })

  test.describe('Role-based Access', () => {
    test('admin should see all navigation items', async ({
      page,
      loginAs,
    }) => {
      await loginAs('admin')

      // Admin should see admin-only links
      await expect(
        page.getByRole('link', { name: /usuarios|admin/i })
      ).toBeVisible()
    })

    test('escalista should have limited navigation', async ({
      page,
      loginAs,
    }) => {
      await loginAs('escalista')

      // Escalista should not see admin links
      await expect(
        page.getByRole('link', { name: /usuarios|admin/i })
      ).not.toBeVisible()
    })
  })

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page, loginAs, logout }) => {
      await loginAs('admin')

      // Perform logout
      await logout()

      // Should be redirected to login
      await expect(page).toHaveURL(/\/auth\/login/)

      // Should not have access to protected content
      await page.goto('/')
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })
})
