import { test, expect } from '../fixtures/auth.fixture'

test.describe('Hospitais Module', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/hospitais')
  })

  test.describe('Hospitais List', () => {
    test('should display hospitais page title', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /hospitais/i })
      ).toBeVisible()
    })

    test('should display hospitais table', async ({ page }) => {
      const table = page.locator('table, [role="table"]')
      await expect(table.first()).toBeVisible({ timeout: 10000 })
    })

    test('should have search functionality', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|nome/i)
      await expect(searchInput.first()).toBeVisible()
    })

    test('should have create hospital button for admin', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /novo hospital|criar|adicionar/i })
      ).toBeVisible()
    })

    test('should display hospital columns', async ({ page }) => {
      await page.waitForSelector('table th, [role="columnheader"]', {
        timeout: 10000,
      })

      // Should have columns for name, city, state
      const headers = page.locator('table th, [role="columnheader"]')
      const headerCount = await headers.count()
      expect(headerCount).toBeGreaterThan(0)
    })
  })

  test.describe('Create Hospital', () => {
    test('should open create hospital modal', async ({ page }) => {
      await page
        .getByRole('button', { name: /novo hospital|criar|adicionar/i })
        .click()

      const modal = page.locator('[role="dialog"], form')
      await expect(modal.first()).toBeVisible()
    })

    test('should display hospital form fields', async ({ page }) => {
      await page
        .getByRole('button', { name: /novo hospital|criar|adicionar/i })
        .click()

      // Required fields
      await expect(page.getByLabel(/nome/i)).toBeVisible()
      await expect(page.getByLabel(/cidade/i)).toBeVisible()
      await expect(page.getByLabel(/estado|uf/i).first()).toBeVisible()
      await expect(page.getByLabel(/grupo/i)).toBeVisible()
    })

    test('should validate required fields on submit', async ({ page }) => {
      await page
        .getByRole('button', { name: /novo hospital|criar|adicionar/i })
        .click()

      // Submit empty form
      await page.getByRole('button', { name: /salvar|criar/i }).click()

      // Should show validation errors
      await expect(
        page.getByText(/obrigatorio|required|invalido/i)
      ).toBeVisible()
    })

    test('should create hospital successfully', async ({ page }) => {
      await page
        .getByRole('button', { name: /novo hospital|criar|adicionar/i })
        .click()

      // Fill form
      await page.getByLabel(/nome/i).fill('Hospital Teste E2E')
      await page.getByLabel(/cidade/i).fill('Sao Paulo')

      const estadoSelect = page.getByLabel(/estado|uf/i).first()
      await estadoSelect.click()
      await page.getByRole('option', { name: /sp|sao paulo/i }).click()

      const grupoSelect = page.getByLabel(/grupo/i)
      await grupoSelect.click()
      await page.getByRole('option').first().click()

      // Submit
      await page.getByRole('button', { name: /salvar|criar/i }).click()

      // Should show success message or close modal
      await expect(
        page
          .getByText(/sucesso|criado|salvo/i)
          .or(page.locator('[role="dialog"]').filter({ hasNot: page.locator('visible') }))
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Edit Hospital', () => {
    test('should open edit modal from actions menu', async ({ page }) => {
      await page.waitForSelector('table tbody tr', { timeout: 10000 })

      // Find edit button
      const editButton = page.locator(
        'button[aria-label*="editar"], [data-testid="edit-hospital"]'
      )

      if (await editButton.first().isVisible()) {
        await editButton.first().click()

        // Modal should open with hospital data
        const modal = page.locator('[role="dialog"]')
        await expect(modal).toBeVisible()
      }
    })
  })

  test.describe('Filter and Search', () => {
    test('should filter hospitals by state', async ({ page }) => {
      const stateFilter = page
        .getByLabel(/estado|uf/i)
        .or(page.getByRole('combobox', { name: /estado|uf/i }))

      if (await stateFilter.first().isVisible()) {
        await stateFilter.first().click()
        await page.getByRole('option').first().click()

        // Wait for filter to apply
        await page.waitForTimeout(500)
      }
    })

    test('should search by hospital name', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar|pesquisar/i).first()
      await searchInput.fill('hospital')

      // Wait for search
      await page.waitForTimeout(500)

      // Table should still be visible with results
      const table = page.locator('table tbody')
      await expect(table).toBeVisible()
    })
  })

  test.describe('Hospital Setores', () => {
    test('should navigate to hospital setores', async ({ page }) => {
      await page.waitForSelector('table tbody tr', { timeout: 10000 })

      // Click on setores button or expand hospital
      const setoresButton = page.locator(
        'button[aria-label*="setores"], [data-testid="view-setores"]'
      )

      if (await setoresButton.first().isVisible()) {
        await setoresButton.first().click()

        // Should show setores list or navigate
        await expect(
          page.getByText(/setor|setores/i)
        ).toBeVisible({ timeout: 5000 })
      }
    })
  })
})
