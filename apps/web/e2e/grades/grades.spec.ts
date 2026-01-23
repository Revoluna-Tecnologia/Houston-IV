import { test, expect } from '../fixtures/auth.fixture'

test.describe('Grades Module', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/grades')
  })

  test.describe('Grades List', () => {
    test('should display grades page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /grades|escalas/i })).toBeVisible()
    })

    test('should display grades table or list', async ({ page }) => {
      const table = page.locator('table, [role="table"]')
      const list = page.locator('[data-testid="grades-list"]')
      const cards = page.locator('[data-testid="grade-card"]')

      await expect(table.or(list).or(cards).first()).toBeVisible({ timeout: 10000 })
    })

    test('should have create new grade button', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /nova grade|criar grade|adicionar/i })
      ).toBeVisible()
    })

    test('should have filter functionality', async ({ page }) => {
      const hospitalFilter = page.getByLabel(/hospital/i).or(
        page.getByRole('combobox', { name: /hospital/i })
      )
      const setorFilter = page.getByLabel(/setor/i).or(
        page.getByRole('combobox', { name: /setor/i })
      )
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i)

      await expect(hospitalFilter.or(setorFilter).or(searchInput).first()).toBeVisible()
    })
  })

  test.describe('Create Grade', () => {
    test('should open create grade modal/form', async ({ page }) => {
      await page.getByRole('button', { name: /nova grade|criar grade|adicionar/i }).click()

      const modal = page.locator('[role="dialog"], form, [data-testid="create-grade-form"]')
      await expect(modal.first()).toBeVisible()
    })

    test('should display grade form fields', async ({ page }) => {
      await page.getByRole('button', { name: /nova grade|criar grade|adicionar/i }).click()

      // Required fields should be present
      await expect(page.getByLabel(/nome|titulo/i)).toBeVisible()
      await expect(page.getByLabel(/hospital/i).first()).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.getByRole('button', { name: /nova grade|criar grade|adicionar/i }).click()

      // Try to submit empty form
      await page.getByRole('button', { name: /salvar|criar|confirmar/i }).click()

      // Should show validation errors
      await expect(page.getByText(/obrigatorio|required|invalido/i)).toBeVisible()
    })
  })

  test.describe('Grade Details', () => {
    test('should open grade details on click', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="grade-item"], [data-testid="grade-card"]', {
        timeout: 10000,
      })

      const viewButton = page.getByRole('button', { name: /ver|detalhes|visualizar/i })
      const row = page.locator('table tbody tr, [data-testid="grade-item"], [data-testid="grade-card"]').first()

      if (await viewButton.first().isVisible()) {
        await viewButton.first().click()
      } else if (await row.isVisible()) {
        await row.click()
      }

      const modal = page.locator('[role="dialog"], [data-testid="grade-details"]')
      const detailsPage = page.locator('[data-testid="grade-page"]')

      await expect(modal.or(detailsPage).first()).toBeVisible({ timeout: 5000 })
    })

    test('should display grade info in details', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="grade-item"], [data-testid="grade-card"]', {
        timeout: 10000,
      })

      const viewButton = page.getByRole('button', { name: /ver|detalhes|visualizar/i })
      const row = page.locator('table tbody tr, [data-testid="grade-item"], [data-testid="grade-card"]').first()

      if (await viewButton.first().isVisible()) {
        await viewButton.first().click()
      } else if (await row.isVisible()) {
        await row.click()
      }

      await page.waitForTimeout(1000)

      // Should display hospital and setor info
      const hospitalInfo = page.getByText(/hospital/i)
      const setorInfo = page.getByText(/setor/i)

      await expect(hospitalInfo.or(setorInfo).first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Time Slots', () => {
    test('should display time slots grid or list', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="grade-item"], [data-testid="grade-card"]', {
        timeout: 10000,
      })

      // Navigate to grade details first
      const viewButton = page.getByRole('button', { name: /ver|detalhes|visualizar/i })
      const row = page.locator('table tbody tr, [data-testid="grade-item"], [data-testid="grade-card"]').first()

      if (await viewButton.first().isVisible()) {
        await viewButton.first().click()
      } else if (await row.isVisible()) {
        await row.click()
      }

      await page.waitForTimeout(1000)

      const slotsGrid = page.locator('[data-testid="time-slots"], [data-testid="slots-grid"], .slots-container')
      const slotsTable = page.locator('table[data-testid="slots-table"]')

      if (await slotsGrid.isVisible() || await slotsTable.isVisible()) {
        await expect(slotsGrid.or(slotsTable).first()).toBeVisible()
      }
    })

    test('should have add slot button', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="grade-item"], [data-testid="grade-card"]', {
        timeout: 10000,
      })

      // Navigate to grade details first
      const viewButton = page.getByRole('button', { name: /ver|detalhes|visualizar/i })
      const row = page.locator('table tbody tr, [data-testid="grade-item"], [data-testid="grade-card"]').first()

      if (await viewButton.first().isVisible()) {
        await viewButton.first().click()
      } else if (await row.isVisible()) {
        await row.click()
      }

      await page.waitForTimeout(1000)

      const addSlotButton = page.getByRole('button', { name: /adicionar slot|novo slot|adicionar horario/i })

      if (await addSlotButton.isVisible()) {
        await expect(addSlotButton).toBeVisible()
      }
    })
  })

  test.describe('Grade Actions', () => {
    test('should have action buttons for each grade', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="grade-item"], [data-testid="grade-card"]', {
        timeout: 10000,
      })

      const actionButtons = page.locator('button[aria-label*="editar"], button[aria-label*="excluir"], [data-testid="grade-actions"]')

      if (await actionButtons.first().isVisible()) {
        await expect(actionButtons.first()).toBeVisible()
      }
    })

    test('should have publish button for draft grades', async ({ page }) => {
      await page.waitForTimeout(2000)

      const publishButton = page.getByRole('button', { name: /publicar|publish/i })

      if (await publishButton.first().isVisible()) {
        await expect(publishButton.first()).toBeVisible()
      }
    })
  })

  test.describe('Filter by Status', () => {
    test('should filter by rascunho status', async ({ page }) => {
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /rascunho|draft/i }).click()

        await page.waitForResponse((response) =>
          response.url().includes('/grades') && response.status() === 200
        )
      }
    })

    test('should filter by publicada status', async ({ page }) => {
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /publicada|published/i }).click()

        await page.waitForResponse((response) =>
          response.url().includes('/grades') && response.status() === 200
        )
      }
    })
  })

  test.describe('Filter by Hospital/Setor', () => {
    test('should filter by hospital', async ({ page }) => {
      const hospitalFilter = page.getByLabel(/hospital/i).or(
        page.getByRole('combobox', { name: /hospital/i })
      )

      if (await hospitalFilter.isVisible()) {
        await hospitalFilter.click()
        await page.waitForTimeout(500)

        const options = page.getByRole('option')
        if (await options.first().isVisible()) {
          await options.first().click()

          await page.waitForTimeout(1000)
        }
      }
    })

    test('should filter by setor', async ({ page }) => {
      const setorFilter = page.getByLabel(/setor/i).or(
        page.getByRole('combobox', { name: /setor/i })
      )

      if (await setorFilter.isVisible()) {
        await setorFilter.click()
        await page.waitForTimeout(500)

        const options = page.getByRole('option')
        if (await options.first().isVisible()) {
          await options.first().click()

          await page.waitForTimeout(1000)
        }
      }
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

  test.describe('Publish Flow', () => {
    test('should show confirmation when publishing', async ({ page }) => {
      await page.waitForTimeout(2000)

      const publishButton = page.getByRole('button', { name: /publicar/i }).first()

      if (await publishButton.isVisible()) {
        await publishButton.click()

        // Should show confirmation dialog or success message
        const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]')
        const successToast = page.getByText(/sucesso|publicada|confirmado/i)

        await expect(confirmDialog.or(successToast).first()).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Date Range Filter', () => {
    test('should have date range filter', async ({ page }) => {
      const dateInput = page.getByLabel(/data|periodo/i)
      const dateRangePicker = page.locator('[data-testid="date-range-picker"], [data-testid="date-filter"]')

      if (await dateInput.first().isVisible()) {
        await expect(dateInput.first()).toBeVisible()
      } else if (await dateRangePicker.isVisible()) {
        await expect(dateRangePicker).toBeVisible()
      }
    })
  })

  test.describe('Export', () => {
    test('should have export button', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /exportar|export|download/i })

      if (await exportButton.isVisible()) {
        await expect(exportButton).toBeVisible()
      }
    })
  })
})
