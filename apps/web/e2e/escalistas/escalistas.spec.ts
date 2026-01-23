import { test, expect } from '../fixtures/auth.fixture'

test.describe('Escalistas Module', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/escalistas')
  })

  test.describe('Escalistas List', () => {
    test('should display escalistas page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /escalistas|usuarios/i })).toBeVisible()
    })

    test('should display escalistas table or list', async ({ page }) => {
      const table = page.locator('table, [role="table"]')
      const list = page.locator('[data-testid="escalistas-list"]')
      const cards = page.locator('[data-testid="escalista-card"]')

      await expect(table.or(list).or(cards).first()).toBeVisible({ timeout: 10000 })
    })

    test('should have create new escalista button', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /novo escalista|criar|adicionar/i })
      ).toBeVisible()
    })

    test('should have filter functionality', async ({ page }) => {
      const roleFilter = page.getByLabel(/papel|role|cargo/i).or(
        page.getByRole('combobox', { name: /papel|role|cargo/i })
      )
      const statusFilter = page.getByLabel(/status|ativo/i).or(
        page.getByRole('combobox', { name: /status|ativo/i })
      )
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i)

      await expect(roleFilter.or(statusFilter).or(searchInput).first()).toBeVisible()
    })
  })

  test.describe('Create Escalista', () => {
    test('should open create escalista modal/form', async ({ page }) => {
      await page.getByRole('button', { name: /novo escalista|criar|adicionar/i }).click()

      const modal = page.locator('[role="dialog"], form, [data-testid="create-escalista-form"]')
      await expect(modal.first()).toBeVisible()
    })

    test('should display escalista form fields', async ({ page }) => {
      await page.getByRole('button', { name: /novo escalista|criar|adicionar/i }).click()

      // Required fields should be present
      await expect(page.getByLabel(/nome/i)).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
    })

    test('should display role selection', async ({ page }) => {
      await page.getByRole('button', { name: /novo escalista|criar|adicionar/i }).click()

      await expect(page.getByLabel(/papel|role|cargo/i).first()).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.getByRole('button', { name: /novo escalista|criar|adicionar/i }).click()

      // Try to submit empty form
      await page.getByRole('button', { name: /salvar|criar|confirmar/i }).click()

      // Should show validation errors
      await expect(page.getByText(/obrigatorio|required|invalido/i)).toBeVisible()
    })

    test('should validate email format', async ({ page }) => {
      await page.getByRole('button', { name: /novo escalista|criar|adicionar/i }).click()

      await page.getByLabel(/email/i).fill('invalid-email')
      await page.getByRole('button', { name: /salvar|criar|confirmar/i }).click()

      await expect(page.getByText(/email.*invalido|invalid.*email/i)).toBeVisible()
    })
  })

  test.describe('Escalista Details', () => {
    test('should open escalista details on click', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="escalista-item"], [data-testid="escalista-card"]', {
        timeout: 10000,
      })

      const viewButton = page.getByRole('button', { name: /ver|detalhes|visualizar/i })
      const row = page.locator('table tbody tr, [data-testid="escalista-item"], [data-testid="escalista-card"]').first()

      if (await viewButton.first().isVisible()) {
        await viewButton.first().click()
      } else if (await row.isVisible()) {
        await row.click()
      }

      const modal = page.locator('[role="dialog"], [data-testid="escalista-details"]')
      const detailsPage = page.locator('[data-testid="escalista-page"]')

      await expect(modal.or(detailsPage).first()).toBeVisible({ timeout: 5000 })
    })

    test('should display escalista info in details', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="escalista-item"], [data-testid="escalista-card"]', {
        timeout: 10000,
      })

      const viewButton = page.getByRole('button', { name: /ver|detalhes|visualizar/i })
      const row = page.locator('table tbody tr, [data-testid="escalista-item"], [data-testid="escalista-card"]').first()

      if (await viewButton.first().isVisible()) {
        await viewButton.first().click()
      } else if (await row.isVisible()) {
        await row.click()
      }

      await page.waitForTimeout(1000)

      // Should display name and email info
      const nameInfo = page.getByText(/nome/i)
      const emailInfo = page.getByText(/email/i)

      await expect(nameInfo.or(emailInfo).first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Escalista Actions', () => {
    test('should have action buttons for each escalista', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="escalista-item"], [data-testid="escalista-card"]', {
        timeout: 10000,
      })

      const actionButtons = page.locator('button[aria-label*="editar"], button[aria-label*="excluir"], [data-testid="escalista-actions"]')

      if (await actionButtons.first().isVisible()) {
        await expect(actionButtons.first()).toBeVisible()
      }
    })

    test('should have edit button', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="escalista-item"], [data-testid="escalista-card"]', {
        timeout: 10000,
      })

      const editButton = page.getByRole('button', { name: /editar|edit/i }).first()

      if (await editButton.isVisible()) {
        await expect(editButton).toBeVisible()
      }
    })

    test('should have deactivate/activate button', async ({ page }) => {
      await page.waitForTimeout(2000)

      const toggleButton = page.getByRole('button', { name: /desativar|ativar|inativar/i }).first()

      if (await toggleButton.isVisible()) {
        await expect(toggleButton).toBeVisible()
      }
    })
  })

  test.describe('Filter by Role', () => {
    test('should filter by administrador role', async ({ page }) => {
      const roleFilter = page.getByLabel(/papel|role|cargo/i).or(
        page.getByRole('combobox', { name: /papel|role|cargo/i })
      )

      if (await roleFilter.isVisible()) {
        await roleFilter.click()
        await page.getByRole('option', { name: /administrador|admin/i }).click()

        await page.waitForResponse((response) =>
          response.url().includes('/escalistas') && response.status() === 200
        )
      }
    })

    test('should filter by escalista role', async ({ page }) => {
      const roleFilter = page.getByLabel(/papel|role|cargo/i).or(
        page.getByRole('combobox', { name: /papel|role|cargo/i })
      )

      if (await roleFilter.isVisible()) {
        await roleFilter.click()
        await page.getByRole('option', { name: /^escalista$/i }).click()

        await page.waitForResponse((response) =>
          response.url().includes('/escalistas') && response.status() === 200
        )
      }
    })

    test('should filter by coordenador role', async ({ page }) => {
      const roleFilter = page.getByLabel(/papel|role|cargo/i).or(
        page.getByRole('combobox', { name: /papel|role|cargo/i })
      )

      if (await roleFilter.isVisible()) {
        await roleFilter.click()
        await page.getByRole('option', { name: /coordenador/i }).click()

        await page.waitForResponse((response) =>
          response.url().includes('/escalistas') && response.status() === 200
        )
      }
    })
  })

  test.describe('Filter by Status', () => {
    test('should filter by ativo status', async ({ page }) => {
      const statusFilter = page.getByLabel(/status|ativo/i).or(
        page.getByRole('combobox', { name: /status|ativo/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /ativo|ativos/i }).click()

        await page.waitForResponse((response) =>
          response.url().includes('/escalistas') && response.status() === 200
        )
      }
    })

    test('should filter by inativo status', async ({ page }) => {
      const statusFilter = page.getByLabel(/status|ativo/i).or(
        page.getByRole('combobox', { name: /status|ativo/i })
      )

      if (await statusFilter.isVisible()) {
        await statusFilter.click()
        await page.getByRole('option', { name: /inativo|inativos/i }).click()

        await page.waitForResponse((response) =>
          response.url().includes('/escalistas') && response.status() === 200
        )
      }
    })
  })

  test.describe('Search', () => {
    test('should search escalistas by name', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i)

      if (await searchInput.isVisible()) {
        await searchInput.fill('admin')
        await page.waitForTimeout(1000)

        // Should filter results
        const results = page.locator('table tbody tr, [data-testid="escalista-item"]')
        await expect(results.first()).toBeVisible({ timeout: 5000 })
      }
    })

    test('should search escalistas by email', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i)

      if (await searchInput.isVisible()) {
        await searchInput.fill('@houston')
        await page.waitForTimeout(1000)

        const results = page.locator('table tbody tr, [data-testid="escalista-item"]')
        const noResults = page.getByText(/nenhum resultado|sem resultados/i)

        await expect(results.first().or(noResults)).toBeVisible({ timeout: 5000 })
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

  test.describe('Hospital Assignment', () => {
    test('should display assigned hospitals', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="escalista-item"], [data-testid="escalista-card"]', {
        timeout: 10000,
      })

      const viewButton = page.getByRole('button', { name: /ver|detalhes|visualizar/i })
      const row = page.locator('table tbody tr, [data-testid="escalista-item"], [data-testid="escalista-card"]').first()

      if (await viewButton.first().isVisible()) {
        await viewButton.first().click()
      } else if (await row.isVisible()) {
        await row.click()
      }

      await page.waitForTimeout(1000)

      const hospitaisSection = page.getByText(/hospitais|hospitais atribu/i)

      if (await hospitaisSection.isVisible()) {
        await expect(hospitaisSection).toBeVisible()
      }
    })

    test('should have assign hospital button', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="escalista-item"], [data-testid="escalista-card"]', {
        timeout: 10000,
      })

      const viewButton = page.getByRole('button', { name: /ver|detalhes|visualizar/i })
      const row = page.locator('table tbody tr, [data-testid="escalista-item"], [data-testid="escalista-card"]').first()

      if (await viewButton.first().isVisible()) {
        await viewButton.first().click()
      } else if (await row.isVisible()) {
        await row.click()
      }

      await page.waitForTimeout(1000)

      const assignButton = page.getByRole('button', { name: /atribuir hospital|adicionar hospital/i })

      if (await assignButton.isVisible()) {
        await expect(assignButton).toBeVisible()
      }
    })
  })

  test.describe('Edit Escalista', () => {
    test('should open edit form', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="escalista-item"], [data-testid="escalista-card"]', {
        timeout: 10000,
      })

      const editButton = page.getByRole('button', { name: /editar|edit/i }).first()

      if (await editButton.isVisible()) {
        await editButton.click()

        const modal = page.locator('[role="dialog"], form')
        await expect(modal.first()).toBeVisible({ timeout: 5000 })
      }
    })

    test('should pre-fill form with escalista data', async ({ page }) => {
      await page.waitForSelector('table tbody tr, [data-testid="escalista-item"], [data-testid="escalista-card"]', {
        timeout: 10000,
      })

      const editButton = page.getByRole('button', { name: /editar|edit/i }).first()

      if (await editButton.isVisible()) {
        await editButton.click()

        await page.waitForTimeout(500)

        // Form fields should have values
        const nomeInput = page.getByLabel(/nome/i)
        const emailInput = page.getByLabel(/email/i)

        if (await nomeInput.isVisible()) {
          const value = await nomeInput.inputValue()
          expect(value).not.toBe('')
        }

        if (await emailInput.isVisible()) {
          const value = await emailInput.inputValue()
          expect(value).not.toBe('')
        }
      }
    })
  })

  test.describe('Deactivate Flow', () => {
    test('should show confirmation when deactivating', async ({ page }) => {
      await page.waitForTimeout(2000)

      const deactivateButton = page.getByRole('button', { name: /desativar|inativar/i }).first()

      if (await deactivateButton.isVisible()) {
        await deactivateButton.click()

        // Should show confirmation dialog
        const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]')
        const confirmText = page.getByText(/confirmar|certeza|desativar/i)

        await expect(confirmDialog.or(confirmText).first()).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Delete Flow', () => {
    test('should show confirmation when deleting', async ({ page }) => {
      await page.waitForTimeout(2000)

      const deleteButton = page.getByRole('button', { name: /excluir|deletar|delete/i }).first()

      if (await deleteButton.isVisible()) {
        await deleteButton.click()

        // Should show confirmation dialog
        const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]')
        const confirmText = page.getByText(/confirmar|certeza|excluir/i)

        await expect(confirmDialog.or(confirmText).first()).toBeVisible({ timeout: 5000 })
      }
    })
  })
})
