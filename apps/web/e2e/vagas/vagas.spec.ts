import { test, expect } from '../fixtures/auth.fixture'

test.describe('Vagas Module', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/vagas')
  })

  test.describe('Vagas List', () => {
    test('should display vagas page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /vagas/i })).toBeVisible()
    })

    test('should display vagas table or list', async ({ page }) => {
      // Look for table or list component
      const table = page.locator('table, [role="table"]')
      const list = page.locator('[data-testid="vagas-list"]')

      await expect(table.or(list).first()).toBeVisible({ timeout: 10000 })
    })

    test('should have search/filter functionality', async ({ page }) => {
      // Look for search input or filter button
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i)
      const filterButton = page.getByRole('button', { name: /filtrar|filtros/i })

      await expect(searchInput.or(filterButton).first()).toBeVisible()
    })

    test('should have create new vaga button', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /nova vaga|criar|adicionar/i })
      ).toBeVisible()
    })
  })

  test.describe('Create Vaga', () => {
    test('should open create vaga modal/form', async ({ page }) => {
      await page.getByRole('button', { name: /nova vaga|criar|adicionar/i }).click()

      // Modal or form should appear
      const modal = page.locator('[role="dialog"], form')
      await expect(modal.first()).toBeVisible()
    })

    test('should display vaga form fields', async ({ page }) => {
      await page.getByRole('button', { name: /nova vaga|criar|adicionar/i }).click()

      // Required fields should be present
      await expect(page.getByLabel(/data/i)).toBeVisible()
      await expect(page.getByLabel(/horario|hora/i).first()).toBeVisible()
      await expect(page.getByLabel(/valor|preco/i)).toBeVisible()
      await expect(page.getByLabel(/setor|hospital/i).first()).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.getByRole('button', { name: /nova vaga|criar|adicionar/i }).click()

      // Try to submit empty form
      await page.getByRole('button', { name: /salvar|criar|confirmar/i }).click()

      // Should show validation errors
      await expect(
        page.getByText(/obrigatorio|required|invalido/i)
      ).toBeVisible()
    })
  })

  test.describe('Vaga Actions', () => {
    test('should have action buttons for each vaga', async ({ page }) => {
      // Wait for vagas to load
      await page.waitForSelector('table tbody tr, [data-testid="vaga-item"]', {
        timeout: 10000,
      })

      // Look for action buttons (view, edit, delete)
      const actionButtons = page.locator('button[aria-label*="editar"], button[aria-label*="excluir"], [data-testid="vaga-actions"]')
      await expect(actionButtons.first()).toBeVisible()
    })

    test('should filter vagas by status', async ({ page }) => {
      // Click on filter/status dropdown
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /aberta/i }).click()

        // Should update list with filtered results
        await page.waitForResponse((response) =>
          response.url().includes('/vagas') && response.status() === 200
        )
      }
    })
  })

  test.describe('Pagination', () => {
    test('should display pagination controls', async ({ page }) => {
      // Wait for content to load
      await page.waitForTimeout(2000)

      // Look for pagination
      const pagination = page.locator('[data-testid="pagination"], nav[aria-label*="paginacao"]')
      const paginationButtons = page.getByRole('button', { name: /proximo|anterior|next|prev/i })

      await expect(pagination.or(paginationButtons.first()).first()).toBeVisible()
    })
  })
})
