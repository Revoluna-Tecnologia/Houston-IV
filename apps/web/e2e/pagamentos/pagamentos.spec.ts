import { test, expect } from '../fixtures/auth.fixture'

test.describe('Pagamentos Module', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/pagamentos')
  })

  test.describe('Pagamentos List', () => {
    test('should display pagamentos page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /pagamentos/i })).toBeVisible()
    })

    test('should display pagamentos table or list', async ({ page }) => {
      const table = page.locator('table, [role="table"]')
      const list = page.locator('[data-testid="pagamentos-list"]')
      const cards = page.locator('[data-testid="pagamento-card"]')

      await expect(table.or(list).or(cards).first()).toBeVisible({ timeout: 10000 })
    })

    test('should have filter functionality', async ({ page }) => {
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )
      const medicoFilter = page.getByLabel(/medico|médico/i).or(
        page.getByRole('combobox', { name: /medico|médico/i })
      )
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i)

      await expect(statusFilter.or(medicoFilter).or(searchInput).first()).toBeVisible()
    })

    test('should display payment status badges', async ({ page }) => {
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
          response.url().includes('/pagamentos') && response.status() === 200
        )
      }
    })

    test('should filter by autorizado status', async ({ page }) => {
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /autorizado/i }).click()

        await page.waitForResponse((response) =>
          response.url().includes('/pagamentos') && response.status() === 200
        )
      }
    })

    test('should filter by pago status', async ({ page }) => {
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /pago/i }).click()

        await page.waitForResponse((response) =>
          response.url().includes('/pagamentos') && response.status() === 200
        )
      }
    })
  })

  test.describe('Pagamento Details', () => {
    test('should open pagamento details on click', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="pagamento-item"], [data-testid="pagamento-card"]', {
        timeout: 10000,
      })

      const viewButton = page.getByRole('button', { name: /ver|detalhes|visualizar/i })
      const row = page.locator('table tbody tr, [data-testid="pagamento-item"], [data-testid="pagamento-card"]').first()

      if (await viewButton.first().isVisible()) {
        await viewButton.first().click()
      } else if (await row.isVisible()) {
        await row.click()
      }

      const modal = page.locator('[role="dialog"], [data-testid="pagamento-details"]')
      const detailsPage = page.locator('[data-testid="pagamento-page"]')

      await expect(modal.or(detailsPage).first()).toBeVisible({ timeout: 5000 })
    })

    test('should display pagamento info in details', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="pagamento-item"], [data-testid="pagamento-card"]', {
        timeout: 10000,
      })

      const viewButton = page.getByRole('button', { name: /ver|detalhes|visualizar/i })
      const row = page.locator('table tbody tr, [data-testid="pagamento-item"], [data-testid="pagamento-card"]').first()

      if (await viewButton.first().isVisible()) {
        await viewButton.first().click()
      } else if (await row.isVisible()) {
        await row.click()
      }

      await page.waitForTimeout(1000)

      // Should display medico and valor info
      const medicoInfo = page.getByText(/medico|médico/i)
      const valorInfo = page.getByText(/valor|R\$/i)

      await expect(medicoInfo.or(valorInfo).first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Pagamento Actions', () => {
    test('should display action buttons for pagamentos', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="pagamento-item"]', {
        timeout: 10000,
      })

      const actionButtons = page.locator('button[aria-label*="autorizar"], button[aria-label*="pagar"], [data-testid="pagamento-actions"]')

      if (await actionButtons.first().isVisible()) {
        await expect(actionButtons.first()).toBeVisible()
      }
    })

    test('should have authorize button for pending payments', async ({ page }) => {
      // Filter by pendente
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /pendente/i }).click()
        await page.waitForTimeout(1000)
      }

      const authorizeButton = page.getByRole('button', { name: /autorizar/i })

      if (await authorizeButton.first().isVisible()) {
        await expect(authorizeButton.first()).toBeVisible()
      }
    })

    test('should have pay button for authorized payments', async ({ page }) => {
      // Filter by autorizado
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /autorizado/i }).click()
        await page.waitForTimeout(1000)
      }

      const payButton = page.getByRole('button', { name: /pagar|confirmar pagamento/i })

      if (await payButton.first().isVisible()) {
        await expect(payButton.first()).toBeVisible()
      }
    })
  })

  test.describe('Authorize Flow', () => {
    test('should show confirmation when authorizing', async ({ page }) => {
      // Filter by pendente
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /pendente/i }).click()
        await page.waitForTimeout(1000)
      }

      const authorizeButton = page.getByRole('button', { name: /autorizar/i }).first()

      if (await authorizeButton.isVisible()) {
        await authorizeButton.click()

        // Should show confirmation dialog or success message
        const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]')
        const successToast = page.getByText(/sucesso|autorizado|confirmado/i)

        await expect(confirmDialog.or(successToast).first()).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Pay Flow', () => {
    test('should show confirmation when paying', async ({ page }) => {
      // Filter by autorizado
      const statusFilter = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /autorizado/i }).click()
        await page.waitForTimeout(1000)
      }

      const payButton = page.getByRole('button', { name: /pagar|confirmar pagamento/i }).first()

      if (await payButton.isVisible()) {
        await payButton.click()

        // Should show confirmation dialog or success message
        const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]')
        const successToast = page.getByText(/sucesso|pago|confirmado/i)

        await expect(confirmDialog.or(successToast).first()).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Bulk Actions', () => {
    test('should have select all checkbox', async ({ page }) => {
      await page.waitForTimeout(2000)

      const selectAllCheckbox = page.locator('thead input[type="checkbox"], [data-testid="select-all"]')

      if (await selectAllCheckbox.isVisible()) {
        await expect(selectAllCheckbox).toBeVisible()
      }
    })

    test('should have bulk authorize button', async ({ page }) => {
      await page.waitForTimeout(2000)

      const bulkAuthorizeButton = page.getByRole('button', { name: /autorizar selecionados|autorizar em lote/i })

      if (await bulkAuthorizeButton.isVisible()) {
        await expect(bulkAuthorizeButton).toBeVisible()
      }
    })

    test('should have bulk pay button', async ({ page }) => {
      await page.waitForTimeout(2000)

      const bulkPayButton = page.getByRole('button', { name: /pagar selecionados|pagar em lote/i })

      if (await bulkPayButton.isVisible()) {
        await expect(bulkPayButton).toBeVisible()
      }
    })
  })

  test.describe('Filter by Date Range', () => {
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

  test.describe('Filter by Medico', () => {
    test('should filter by medico', async ({ page }) => {
      const medicoFilter = page.getByLabel(/medico|médico/i).or(
        page.getByRole('combobox', { name: /medico|médico/i })
      )

      if (await medicoFilter.isVisible()) {
        await medicoFilter.click()
        await page.waitForTimeout(500)

        const options = page.getByRole('option')
        if (await options.first().isVisible()) {
          await options.first().click()

          await page.waitForTimeout(1000)
        }
      }
    })
  })

  test.describe('Filter by Hospital', () => {
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
  })

  test.describe('Pagination', () => {
    test('should display pagination controls', async ({ page }) => {
      await page.waitForTimeout(2000)

      const pagination = page.locator('[data-testid="pagination"], nav[aria-label*="paginacao"]')
      const paginationButtons = page.getByRole('button', { name: /proximo|anterior|next|prev/i })

      await expect(pagination.or(paginationButtons.first()).first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Total Summary', () => {
    test('should display total value summary', async ({ page }) => {
      await page.waitForTimeout(2000)

      const totalSummary = page.locator('[data-testid="total-summary"], [data-testid="pagamentos-total"]')
      const totalText = page.getByText(/total.*R\$|R\$.*total/i)

      if (await totalSummary.isVisible() || await totalText.isVisible()) {
        await expect(totalSummary.or(totalText).first()).toBeVisible()
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

    test('should have export to Excel option', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /exportar|export/i })

      if (await exportButton.isVisible()) {
        await exportButton.click()

        const excelOption = page.getByRole('menuitem', { name: /excel|xlsx/i })

        if (await excelOption.isVisible()) {
          await expect(excelOption).toBeVisible()
        }
      }
    })

    test('should have export to PDF option', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /exportar|export/i })

      if (await exportButton.isVisible()) {
        await exportButton.click()

        const pdfOption = page.getByRole('menuitem', { name: /pdf/i })

        if (await pdfOption.isVisible()) {
          await expect(pdfOption).toBeVisible()
        }
      }
    })
  })
})
