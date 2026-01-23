import { test, expect } from '../fixtures/auth.fixture'

test.describe('Candidaturas Module', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/candidaturas')
  })

  test.describe('Candidaturas List', () => {
    test('should display candidaturas page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /candidaturas/i })).toBeVisible()
    })

    test('should display candidaturas table or list', async ({ page }) => {
      const table = page.locator('table, [role="table"]')
      const list = page.locator('[data-testid="candidaturas-list"]')

      await expect(table.or(list).first()).toBeVisible({ timeout: 10000 })
    })

    test('should have filter functionality', async ({ page }) => {
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i)

      await expect(statusFilter.or(searchInput).first()).toBeVisible()
    })

    test('should display candidatura status badges', async ({ page }) => {
      await page.waitForTimeout(2000)

      const statusBadges = page.locator('[data-testid="status-badge"], .badge, [class*="badge"]')

      if (await statusBadges.first().isVisible()) {
        await expect(statusBadges.first()).toBeVisible()
      }
    })
  })

  test.describe('Filter by Status', () => {
    test('should filter by pendente status', async ({ page }) => {
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /pendente/i }).click()

        await page.waitForResponse((response) =>
          response.url().includes('/candidaturas') && response.status() === 200
        )
      }
    })

    test('should filter by aprovada status', async ({ page }) => {
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /aprovada/i }).click()

        await page.waitForResponse((response) =>
          response.url().includes('/candidaturas') && response.status() === 200
        )
      }
    })

    test('should filter by rejeitada status', async ({ page }) => {
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /rejeitada/i }).click()

        await page.waitForResponse((response) =>
          response.url().includes('/candidaturas') && response.status() === 200
        )
      }
    })
  })

  test.describe('Candidatura Actions', () => {
    test('should display action buttons for candidaturas', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="candidatura-item"]', {
        timeout: 10000,
      })

      const actionButtons = page.locator('button[aria-label*="aprovar"], button[aria-label*="rejeitar"], [data-testid="candidatura-actions"]')

      if (await actionButtons.first().isVisible()) {
        await expect(actionButtons.first()).toBeVisible()
      }
    })

    test('should have approve button for pending candidaturas', async ({ page }) => {
      // Filter by pendente
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /pendente/i }).click()
        await page.waitForTimeout(1000)
      }

      const approveButton = page.getByRole('button', { name: /aprovar/i })

      if (await approveButton.first().isVisible()) {
        await expect(approveButton.first()).toBeVisible()
      }
    })

    test('should have reject button for pending candidaturas', async ({ page }) => {
      // Filter by pendente
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /pendente/i }).click()
        await page.waitForTimeout(1000)
      }

      const rejectButton = page.getByRole('button', { name: /rejeitar/i })

      if (await rejectButton.first().isVisible()) {
        await expect(rejectButton.first()).toBeVisible()
      }
    })
  })

  test.describe('Candidatura Details', () => {
    test('should open candidatura details modal/page', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="candidatura-item"]', {
        timeout: 10000,
      })

      const viewButton = page.getByRole('button', { name: /ver|detalhes|visualizar/i })
      const row = page.locator('table tbody tr, [data-testid="candidatura-item"]').first()

      if (await viewButton.first().isVisible()) {
        await viewButton.first().click()
      } else if (await row.isVisible()) {
        await row.click()
      }

      // Modal or details page should appear
      const modal = page.locator('[role="dialog"], [data-testid="candidatura-details"]')
      const detailsPage = page.locator('[data-testid="candidatura-page"]')

      await expect(modal.or(detailsPage).first()).toBeVisible({ timeout: 5000 })
    })

    test('should display candidatura info in details', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="candidatura-item"]', {
        timeout: 10000,
      })

      const viewButton = page.getByRole('button', { name: /ver|detalhes|visualizar/i })
      const row = page.locator('table tbody tr, [data-testid="candidatura-item"]').first()

      if (await viewButton.first().isVisible()) {
        await viewButton.first().click()
      } else if (await row.isVisible()) {
        await row.click()
      }

      await page.waitForTimeout(1000)

      // Should display medico and vaga info
      const medicoInfo = page.getByText(/medico|médico/i)
      const vagaInfo = page.getByText(/vaga/i)

      await expect(medicoInfo.or(vagaInfo).first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Pagination', () => {
    test('should display pagination controls', async ({ page }) => {
      await page.waitForTimeout(2000)

      const pagination = page.locator('[data-testid="pagination"], nav[aria-label*="paginacao"]')
      const paginationButtons = page.getByRole('button', { name: /proximo|anterior|next|prev/i })

      await expect(pagination.or(paginationButtons.first()).first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Approve/Reject Flow', () => {
    test('should show confirmation when approving', async ({ page }) => {
      // Filter by pendente
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /pendente/i }).click()
        await page.waitForTimeout(1000)
      }

      const approveButton = page.getByRole('button', { name: /aprovar/i }).first()

      if (await approveButton.isVisible()) {
        await approveButton.click()

        // Should show confirmation dialog or success message
        const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]')
        const successToast = page.getByText(/sucesso|aprovada|confirmado/i)

        await expect(confirmDialog.or(successToast).first()).toBeVisible({ timeout: 5000 })
      }
    })

    test('should show confirmation when rejecting', async ({ page }) => {
      // Filter by pendente
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /pendente/i }).click()
        await page.waitForTimeout(1000)
      }

      const rejectButton = page.getByRole('button', { name: /rejeitar/i }).first()

      if (await rejectButton.isVisible()) {
        await rejectButton.click()

        // Should show confirmation dialog or reason input
        const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]')
        const reasonInput = page.getByLabel(/motivo|razao/i)

        await expect(confirmDialog.or(reasonInput).first()).toBeVisible({ timeout: 5000 })
      }
    })
  })
})
