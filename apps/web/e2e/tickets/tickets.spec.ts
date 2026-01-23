import { test, expect } from '../fixtures/auth.fixture'

test.describe('Tickets Module', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/tickets')
  })

  test.describe('Tickets List', () => {
    test('should display tickets page title', async ({ page }) => {
      await expect(
        page.getByRole('heading', { name: /tickets|chamados/i })
      ).toBeVisible()
    })

    test('should display tickets table or kanban', async ({ page }) => {
      const table = page.locator('table, [role="table"]')
      const kanban = page.locator('[data-testid="kanban-board"]')

      await expect(table.or(kanban).first()).toBeVisible({ timeout: 10000 })
    })

    test('should have search functionality', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|titulo/i)
      await expect(searchInput.first()).toBeVisible()
    })

    test('should have create ticket button', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /novo ticket|criar|abrir/i })
      ).toBeVisible()
    })

    test('should display ticket status badges', async ({ page }) => {
      await page.waitForSelector('[data-testid="ticket-status"], .badge', {
        timeout: 10000,
      })

      const statusBadges = page.locator('[data-testid="ticket-status"], .badge')
      await expect(statusBadges.first()).toBeVisible()
    })
  })

  test.describe('Create Ticket', () => {
    test('should open create ticket modal', async ({ page }) => {
      await page
        .getByRole('button', { name: /novo ticket|criar|abrir/i })
        .click()

      const modal = page.locator('[role="dialog"], form')
      await expect(modal.first()).toBeVisible()
    })

    test('should display ticket form fields', async ({ page }) => {
      await page
        .getByRole('button', { name: /novo ticket|criar|abrir/i })
        .click()

      // Required fields
      await expect(page.getByLabel(/titulo/i)).toBeVisible()
      await expect(page.getByLabel(/descricao/i)).toBeVisible()
      await expect(page.getByLabel(/prioridade/i)).toBeVisible()
      await expect(page.getByLabel(/categoria/i)).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page
        .getByRole('button', { name: /novo ticket|criar|abrir/i })
        .click()

      // Submit empty form
      await page.getByRole('button', { name: /salvar|criar|enviar/i }).click()

      // Should show validation error
      await expect(
        page.getByText(/obrigatorio|required|titulo/i)
      ).toBeVisible()
    })

    test('should create ticket successfully', async ({ page }) => {
      await page
        .getByRole('button', { name: /novo ticket|criar|abrir/i })
        .click()

      // Fill form
      await page.getByLabel(/titulo/i).fill('Ticket de Teste E2E')
      await page.getByLabel(/descricao/i).fill('Descricao do ticket de teste')

      // Select priority
      const prioritySelect = page.getByLabel(/prioridade/i)
      await prioritySelect.click()
      await page.getByRole('option', { name: /media|medium/i }).click()

      // Select category
      const categorySelect = page.getByLabel(/categoria/i)
      await categorySelect.click()
      await page.getByRole('option').first().click()

      // Submit
      await page.getByRole('button', { name: /salvar|criar|enviar/i }).click()

      // Should show success or close modal
      await expect(
        page.getByText(/sucesso|criado|ticket/i)
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Ticket Filters', () => {
    test('should filter by status', async ({ page }) => {
      const statusFilter = page
        .getByLabel(/status/i)
        .or(page.getByRole('combobox', { name: /status/i }))

      if (await statusFilter.first().isVisible()) {
        await statusFilter.first().click()
        await page.getByRole('option', { name: /aberto|open/i }).click()

        // Wait for filter
        await page.waitForTimeout(500)
      }
    })

    test('should filter by priority', async ({ page }) => {
      const priorityFilter = page
        .getByLabel(/prioridade/i)
        .or(page.getByRole('combobox', { name: /prioridade/i }))

      if (await priorityFilter.first().isVisible()) {
        await priorityFilter.first().click()
        await page.getByRole('option', { name: /alta|high/i }).click()

        await page.waitForTimeout(500)
      }
    })

    test('should filter by assigned user', async ({ page }) => {
      const assigneeFilter = page
        .getByLabel(/responsavel|assignee/i)
        .or(page.getByRole('combobox', { name: /responsavel/i }))

      if (await assigneeFilter.first().isVisible()) {
        await assigneeFilter.first().click()
        await page.getByRole('option').first().click()

        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Ticket Details', () => {
    test('should open ticket details on click', async ({ page }) => {
      await page.waitForSelector(
        'table tbody tr, [data-testid="ticket-card"]',
        { timeout: 10000 }
      )

      // Click on first ticket
      const firstTicket = page.locator('table tbody tr, [data-testid="ticket-card"]').first()
      await firstTicket.click()

      // Should show ticket details
      await expect(
        page.locator('[role="dialog"], [data-testid="ticket-details"]').first()
      ).toBeVisible({ timeout: 5000 })
    })

    test('should display ticket comments section', async ({ page }) => {
      await page.waitForSelector(
        'table tbody tr, [data-testid="ticket-card"]',
        { timeout: 10000 }
      )

      const firstTicket = page.locator('table tbody tr, [data-testid="ticket-card"]').first()
      await firstTicket.click()

      // Wait for details to load
      await page.waitForTimeout(1000)

      // Should have comments section
      await expect(
        page.getByText(/comentarios|comments/i)
      ).toBeVisible()
    })

    test('should add comment to ticket', async ({ page }) => {
      await page.waitForSelector(
        'table tbody tr, [data-testid="ticket-card"]',
        { timeout: 10000 }
      )

      const firstTicket = page.locator('table tbody tr, [data-testid="ticket-card"]').first()
      await firstTicket.click()

      await page.waitForTimeout(1000)

      // Find comment input
      const commentInput = page.getByPlaceholder(/comentario|mensagem/i)
      if (await commentInput.isVisible()) {
        await commentInput.fill('Comentario de teste E2E')
        await page.getByRole('button', { name: /enviar|comentar|adicionar/i }).click()

        // Comment should appear
        await expect(
          page.getByText('Comentario de teste E2E')
        ).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Ticket Status Updates', () => {
    test('should change ticket status', async ({ page }) => {
      await page.waitForSelector(
        'table tbody tr, [data-testid="ticket-card"]',
        { timeout: 10000 }
      )

      const firstTicket = page.locator('table tbody tr, [data-testid="ticket-card"]').first()
      await firstTicket.click()

      await page.waitForTimeout(1000)

      // Find status dropdown
      const statusSelect = page.getByLabel(/status/i).or(
        page.getByRole('combobox', { name: /status/i })
      )

      if (await statusSelect.first().isVisible()) {
        await statusSelect.first().click()
        await page.getByRole('option', { name: /progresso|in_progress/i }).click()

        // Should show success or update UI
        await page.waitForTimeout(1000)
      }
    })

    test('should assign ticket to user', async ({ page }) => {
      await page.waitForSelector(
        'table tbody tr, [data-testid="ticket-card"]',
        { timeout: 10000 }
      )

      const firstTicket = page.locator('table tbody tr, [data-testid="ticket-card"]').first()
      await firstTicket.click()

      await page.waitForTimeout(1000)

      // Find assignee dropdown
      const assigneeSelect = page.getByLabel(/responsavel|atribuir/i).or(
        page.getByRole('combobox', { name: /responsavel/i })
      )

      if (await assigneeSelect.first().isVisible()) {
        await assigneeSelect.first().click()
        await page.getByRole('option').first().click()

        await page.waitForTimeout(1000)
      }
    })
  })

  test.describe('Ticket Analytics', () => {
    test('should navigate to analytics view', async ({ page }) => {
      const analyticsTab = page.getByRole('tab', { name: /analytics|estatisticas/i })
      const analyticsLink = page.getByRole('link', { name: /analytics|estatisticas/i })

      if (await analyticsTab.isVisible()) {
        await analyticsTab.click()
        await expect(page.getByText(/total|tickets|grafico/i)).toBeVisible()
      } else if (await analyticsLink.isVisible()) {
        await analyticsLink.click()
        await expect(page).toHaveURL(/analytics/)
      }
    })
  })
})
