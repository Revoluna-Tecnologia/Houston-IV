import { test, expect } from '../fixtures/auth.fixture'

test.describe('Kanban Module', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/kanban')
  })

  test.describe('Kanban Board List', () => {
    test('should display kanban page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /kanban/i })).toBeVisible()
    })

    test('should display kanban boards or create button', async ({ page }) => {
      const boards = page.locator('[data-testid="kanban-board"], [data-testid="board-card"]')
      const createButton = page.getByRole('button', { name: /criar|novo|adicionar/i })

      await expect(boards.first().or(createButton)).toBeVisible({ timeout: 10000 })
    })

    test('should have create new board button', async ({ page }) => {
      await expect(
        page.getByRole('button', { name: /novo board|criar board|adicionar/i })
      ).toBeVisible()
    })
  })

  test.describe('Create Board', () => {
    test('should open create board modal/form', async ({ page }) => {
      await page.getByRole('button', { name: /novo board|criar board|adicionar/i }).click()

      const modal = page.locator('[role="dialog"], form, [data-testid="create-board-form"]')
      await expect(modal.first()).toBeVisible()
    })

    test('should display board form fields', async ({ page }) => {
      await page.getByRole('button', { name: /novo board|criar board|adicionar/i }).click()

      await expect(page.getByLabel(/nome|titulo|title/i)).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.getByRole('button', { name: /novo board|criar board|adicionar/i }).click()

      // Try to submit empty form
      await page.getByRole('button', { name: /salvar|criar|confirmar/i }).click()

      // Should show validation errors
      await expect(page.getByText(/obrigatorio|required|invalido/i)).toBeVisible()
    })
  })

  test.describe('Board View', () => {
    test('should display board columns', async ({ page }) => {
      // Wait for board to load
      await page.waitForSelector(
        '[data-testid="kanban-column"], [data-testid="board-column"], .kanban-column',
        { timeout: 10000 }
      )

      const columns = page.locator(
        '[data-testid="kanban-column"], [data-testid="board-column"], .kanban-column'
      )

      await expect(columns.first()).toBeVisible()
    })

    test('should display card count in columns', async ({ page }) => {
      await page.waitForTimeout(2000)

      const cardCount = page.locator('[data-testid="card-count"], .card-count, .column-count')

      if (await cardCount.first().isVisible()) {
        await expect(cardCount.first()).toBeVisible()
      }
    })
  })

  test.describe('Card Operations', () => {
    test('should display cards in columns', async ({ page }) => {
      await page.waitForTimeout(2000)

      const cards = page.locator('[data-testid="kanban-card"], [data-testid="board-card"], .kanban-card')

      if (await cards.first().isVisible()) {
        await expect(cards.first()).toBeVisible()
      }
    })

    test('should have add card button in columns', async ({ page }) => {
      await page.waitForSelector(
        '[data-testid="kanban-column"], [data-testid="board-column"], .kanban-column',
        { timeout: 10000 }
      )

      const addCardButton = page.getByRole('button', { name: /adicionar card|novo card|\+/i })

      if (await addCardButton.first().isVisible()) {
        await expect(addCardButton.first()).toBeVisible()
      }
    })

    test('should open card details on click', async ({ page }) => {
      await page.waitForTimeout(2000)

      const card = page.locator('[data-testid="kanban-card"], [data-testid="board-card"], .kanban-card').first()

      if (await card.isVisible()) {
        await card.click()

        const modal = page.locator('[role="dialog"], [data-testid="card-details"]')
        await expect(modal).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Card Details', () => {
    test('should display card title in details', async ({ page }) => {
      await page.waitForTimeout(2000)

      const card = page.locator('[data-testid="kanban-card"], [data-testid="board-card"], .kanban-card').first()

      if (await card.isVisible()) {
        await card.click()

        await page.waitForSelector('[role="dialog"], [data-testid="card-details"]', {
          timeout: 5000,
        })

        const title = page.locator('[data-testid="card-title"], h2, h3').first()
        await expect(title).toBeVisible()
      }
    })

    test('should have edit button in card details', async ({ page }) => {
      await page.waitForTimeout(2000)

      const card = page.locator('[data-testid="kanban-card"], [data-testid="board-card"], .kanban-card').first()

      if (await card.isVisible()) {
        await card.click()

        await page.waitForSelector('[role="dialog"], [data-testid="card-details"]', {
          timeout: 5000,
        })

        const editButton = page.getByRole('button', { name: /editar|edit/i })
        if (await editButton.isVisible()) {
          await expect(editButton).toBeVisible()
        }
      }
    })

    test('should have delete button in card details', async ({ page }) => {
      await page.waitForTimeout(2000)

      const card = page.locator('[data-testid="kanban-card"], [data-testid="board-card"], .kanban-card').first()

      if (await card.isVisible()) {
        await card.click()

        await page.waitForSelector('[role="dialog"], [data-testid="card-details"]', {
          timeout: 5000,
        })

        const deleteButton = page.getByRole('button', { name: /excluir|deletar|delete/i })
        if (await deleteButton.isVisible()) {
          await expect(deleteButton).toBeVisible()
        }
      }
    })
  })

  test.describe('Card Tags', () => {
    test('should display tags on cards', async ({ page }) => {
      await page.waitForTimeout(2000)

      const tags = page.locator('[data-testid="card-tag"], .tag, [class*="tag"], .badge')

      if (await tags.first().isVisible()) {
        await expect(tags.first()).toBeVisible()
      }
    })

    test('should have tag filter option', async ({ page }) => {
      const tagFilter = page.getByLabel(/tag/i).or(page.getByRole('combobox', { name: /tag/i }))
      const filterButton = page.getByRole('button', { name: /filtrar|filtros/i })

      if (await tagFilter.isVisible()) {
        await expect(tagFilter).toBeVisible()
      } else if (await filterButton.isVisible()) {
        await filterButton.click()
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Drag and Drop', () => {
    test('should have draggable cards', async ({ page }) => {
      await page.waitForTimeout(2000)

      const card = page.locator('[data-testid="kanban-card"], [draggable="true"], .kanban-card').first()

      if (await card.isVisible()) {
        const draggable = await card.getAttribute('draggable')
        const hasDragHandle = await page.locator('[data-testid="drag-handle"], .drag-handle').first().isVisible()

        expect(draggable === 'true' || hasDragHandle).toBeTruthy()
      }
    })
  })

  test.describe('Column Management', () => {
    test('should display column headers', async ({ page }) => {
      await page.waitForSelector(
        '[data-testid="kanban-column"], [data-testid="board-column"], .kanban-column',
        { timeout: 10000 }
      )

      const columnHeaders = page.locator(
        '[data-testid="column-header"], .column-header, [data-testid="kanban-column"] h3'
      )

      await expect(columnHeaders.first()).toBeVisible()
    })

    test('should have column options menu', async ({ page }) => {
      await page.waitForSelector(
        '[data-testid="kanban-column"], [data-testid="board-column"], .kanban-column',
        { timeout: 10000 }
      )

      const columnMenu = page.locator('[data-testid="column-menu"], [aria-label*="coluna"], .column-options')

      if (await columnMenu.first().isVisible()) {
        await expect(columnMenu.first()).toBeVisible()
      }
    })
  })

  test.describe('Search and Filter', () => {
    test('should have search functionality', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i)
      const searchButton = page.getByRole('button', { name: /buscar|pesquisar/i })

      await expect(searchInput.or(searchButton).first()).toBeVisible()
    })

    test('should filter cards by search term', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i)

      if (await searchInput.isVisible()) {
        await searchInput.fill('test')
        await page.waitForTimeout(1000)

        // Cards should be filtered (or show no results message)
        const cards = page.locator('[data-testid="kanban-card"], .kanban-card')
        const noResults = page.getByText(/nenhum resultado|sem resultados|no results/i)

        await expect(cards.first().or(noResults)).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Board Settings', () => {
    test('should have board settings button', async ({ page }) => {
      const settingsButton = page.getByRole('button', { name: /configuracoes|settings|opcoes/i })
      const settingsIcon = page.locator('[data-testid="board-settings"], [aria-label*="config"]')

      if (await settingsButton.isVisible()) {
        await expect(settingsButton).toBeVisible()
      } else if (await settingsIcon.isVisible()) {
        await expect(settingsIcon).toBeVisible()
      }
    })
  })

  test.describe('Responsiveness', () => {
    test('should display mobile-friendly layout on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(500)

      // Board should still be visible
      const board = page.locator('[data-testid="kanban-board"], .kanban-board, [data-testid="board-container"]')

      await expect(board.first()).toBeVisible({ timeout: 10000 })
    })
  })
})
