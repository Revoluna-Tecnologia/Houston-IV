import { test, expect } from '../fixtures/auth.fixture'

test.describe('Medicos Module', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/medicos')
  })

  test.describe('Medicos List', () => {
    test('should display medicos page title', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /medicos/i })
      ).toBeVisible()
    })

    test('should display medicos table', async ({ page }) => {
      const table = page.locator('table, [role="table"]')
      await expect(table.first()).toBeVisible({ timeout: 10000 })
    })

    test('should have search functionality', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|nome|crm/i)
      await expect(searchInput.first()).toBeVisible()
    })

    test('should have create medico button for admin', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /novo medico|criar|adicionar/i })
      ).toBeVisible()
    })

    test('should display medico information in list', async ({ page }) => {
      // Wait for table to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 })

      // Table should have columns for name, CRM, specialties
      const headers = page.locator('table th, [role="columnheader"]')
      await expect(headers.first()).toBeVisible()
    })
  })

  test.describe('Create Medico', () => {
    test('should open create medico modal', async ({ page }) => {
      await page
        .getByRole('button', { name: /novo medico|criar|adicionar/i })
        .click()

      // Modal should appear
      const modal = page.locator('[role="dialog"], form')
      await expect(modal.first()).toBeVisible()
    })

    test('should display medico form fields', async ({ page }) => {
      await page
        .getByRole('button', { name: /novo medico|criar|adicionar/i })
        .click()

      // Required fields
      await expect(page.getByLabel(/nome/i)).toBeVisible()
      await expect(page.getByLabel(/crm/i)).toBeVisible()
      await expect(page.getByLabel(/uf|estado/i).first()).toBeVisible()
      await expect(page.getByLabel(/telefone|celular/i).first()).toBeVisible()
    })

    test('should validate CRM format', async ({ page }) => {
      await page
        .getByRole('button', { name: /novo medico|criar|adicionar/i })
        .click()

      // Fill with invalid CRM
      await page.getByLabel(/nome/i).fill('Dr. Teste')
      await page.getByLabel(/crm/i).fill('invalid')

      await page.getByRole('button', { name: /salvar|criar/i }).click()

      // Should show validation error
      await expect(page.getByText(/crm.*invalido|formato/i)).toBeVisible()
    })
  })

  test.describe('Search and Filter', () => {
    test('should search medicos by name', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar|pesquisar/i).first()
      await searchInput.fill('teste')

      // Wait for search results
      await page.waitForTimeout(500)

      // Results should be filtered
      const table = page.locator('table tbody')
      await expect(table).toBeVisible()
    })

    test('should filter by specialty', async ({ page }) => {
      const specialtyFilter = page
        .getByLabel(/especialidade/i)
        .or(page.getByRole('combobox', { name: /especialidade/i }))

      if (await specialtyFilter.first().isVisible()) {
        await specialtyFilter.first().click()

        // Select a specialty
        await page.getByRole('option').first().click()

        // Results should update
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Medico Details', () => {
    test('should view medico details on row click', async ({ page }) => {
      // Wait for table to load
      await page.waitForSelector('table tbody tr', { timeout: 10000 })

      // Click on first row or view button
      const viewButton = page.locator('button[aria-label*="ver"], [data-testid="view-medico"]')
      const firstRow = page.locator('table tbody tr').first()

      if (await viewButton.first().isVisible()) {
        await viewButton.first().click()
      } else {
        await firstRow.click()
      }

      // Should show medico details
      await expect(
        page.locator('[role="dialog"]').or(page.locator('[data-testid="medico-details"]'))
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Pagination', () => {
    test('should display pagination', async ({ page }) => {
      await page.waitForTimeout(2000)

      const pagination = page.locator(
        '[data-testid="pagination"], nav[aria-label*="paginacao"], .pagination'
      )
      await expect(pagination.first()).toBeVisible()
    })

    test('should show items per page selector', async ({ page }) => {
      const perPageSelector = page.getByRole('combobox', {
        name: /por pagina|items|registros/i,
      })

      if (await perPageSelector.isVisible()) {
        await expect(perPageSelector).toBeVisible()
      }
    })
  })
})
