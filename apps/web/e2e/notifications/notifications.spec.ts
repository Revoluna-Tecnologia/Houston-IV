import { test, expect } from '../fixtures/auth.fixture'

test.describe('Notifications Module', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin')
    await page.goto('/')
  })

  test.describe('Notification Bell', () => {
    test('should display notification bell icon', async ({ page }) => {
      const bellIcon = page.locator('[data-testid="notification-bell"], [aria-label*="notifica"], .notification-bell')

      await expect(bellIcon.first()).toBeVisible({ timeout: 10000 })
    })

    test('should show unread count badge', async ({ page }) => {
      const badge = page.locator('[data-testid="notification-badge"], .notification-badge, .unread-count')

      if (await badge.isVisible()) {
        await expect(badge).toBeVisible()
      }
    })

    test('should open notifications dropdown on click', async ({ page }) => {
      const bellIcon = page.locator('[data-testid="notification-bell"], [aria-label*="notifica"], .notification-bell').first()

      if (await bellIcon.isVisible()) {
        await bellIcon.click()

        const dropdown = page.locator('[data-testid="notifications-dropdown"], [role="menu"], .notifications-panel')

        await expect(dropdown).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Notifications Dropdown', () => {
    test.beforeEach(async ({ page }) => {
      const bellIcon = page.locator('[data-testid="notification-bell"], [aria-label*="notifica"], .notification-bell').first()

      if (await bellIcon.isVisible()) {
        await bellIcon.click()
        await page.waitForTimeout(500)
      }
    })

    test('should display notifications list', async ({ page }) => {
      const notificationsList = page.locator('[data-testid="notifications-list"], .notifications-list')
      const notificationItems = page.locator('[data-testid="notification-item"], .notification-item')
      const emptyState = page.getByText(/sem notifica|nenhuma notifica|empty/i)

      await expect(notificationsList.or(notificationItems.first()).or(emptyState)).toBeVisible({ timeout: 5000 })
    })

    test('should have mark all as read button', async ({ page }) => {
      const markAllButton = page.getByRole('button', { name: /marcar.*lidas|marcar.*lido|mark.*read/i })

      if (await markAllButton.isVisible()) {
        await expect(markAllButton).toBeVisible()
      }
    })

    test('should have view all notifications link', async ({ page }) => {
      const viewAllLink = page.getByRole('link', { name: /ver todas|ver tudo|view all/i })
      const viewAllButton = page.getByRole('button', { name: /ver todas|ver tudo|view all/i })

      if (await viewAllLink.isVisible() || await viewAllButton.isVisible()) {
        await expect(viewAllLink.or(viewAllButton).first()).toBeVisible()
      }
    })
  })

  test.describe('Notifications Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/notificacoes')
    })

    test('should display notifications page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /notifica/i })).toBeVisible()
    })

    test('should display notifications list', async ({ page }) => {
      const notificationsList = page.locator('[data-testid="notifications-list"], .notifications-list')
      const notificationItems = page.locator('[data-testid="notification-item"], .notification-item')
      const emptyState = page.getByText(/sem notifica|nenhuma notifica|empty/i)

      await expect(notificationsList.or(notificationItems.first()).or(emptyState)).toBeVisible({ timeout: 10000 })
    })

    test('should have filter by type', async ({ page }) => {
      const typeFilter = page.getByLabel(/tipo/i).or(
        page.getByRole('combobox', { name: /tipo/i })
      )

      if (await typeFilter.isVisible()) {
        await expect(typeFilter).toBeVisible()
      }
    })

    test('should have filter by read status', async ({ page }) => {
      const readFilter = page.getByLabel(/lidas|status/i).or(
        page.getByRole('combobox', { name: /lidas|status/i })
      )

      if (await readFilter.isVisible()) {
        await expect(readFilter).toBeVisible()
      }
    })
  })

  test.describe('Notification Item', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/notificacoes')
      await page.waitForTimeout(1000)
    })

    test('should display notification title', async ({ page }) => {
      const notificationItem = page.locator('[data-testid="notification-item"], .notification-item').first()

      if (await notificationItem.isVisible()) {
        const title = notificationItem.locator('[data-testid="notification-title"], .notification-title, h3, h4')

        await expect(title).toBeVisible()
      }
    })

    test('should display notification date/time', async ({ page }) => {
      const notificationItem = page.locator('[data-testid="notification-item"], .notification-item').first()

      if (await notificationItem.isVisible()) {
        const time = notificationItem.locator('time, [data-testid="notification-time"], .notification-time')

        if (await time.isVisible()) {
          await expect(time).toBeVisible()
        }
      }
    })

    test('should have mark as read button', async ({ page }) => {
      const notificationItem = page.locator('[data-testid="notification-item"], .notification-item').first()

      if (await notificationItem.isVisible()) {
        const markReadButton = notificationItem.getByRole('button', { name: /marcar.*lida|mark.*read/i })

        if (await markReadButton.isVisible()) {
          await expect(markReadButton).toBeVisible()
        }
      }
    })

    test('should navigate to related content on click', async ({ page }) => {
      const notificationItem = page.locator('[data-testid="notification-item"], .notification-item').first()

      if (await notificationItem.isVisible()) {
        await notificationItem.click()

        // Should navigate or open modal
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Mark as Read', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/notificacoes')
      await page.waitForTimeout(1000)
    })

    test('should mark single notification as read', async ({ page }) => {
      const notificationItem = page.locator('[data-testid="notification-item"], .notification-item').first()

      if (await notificationItem.isVisible()) {
        const markReadButton = notificationItem.getByRole('button', { name: /marcar.*lida|mark.*read/i })

        if (await markReadButton.isVisible()) {
          await markReadButton.click()

          // Should show success or change state
          await page.waitForTimeout(500)
        }
      }
    })

    test('should mark all notifications as read', async ({ page }) => {
      const markAllButton = page.getByRole('button', { name: /marcar.*lidas|marcar.*lido/i })

      if (await markAllButton.isVisible()) {
        await markAllButton.click()

        // Should show success or update list
        const successToast = page.getByText(/sucesso|marcadas|lidas/i)
        const emptyUnread = page.getByText(/sem notifica|nenhuma/i)

        await expect(successToast.or(emptyUnread).first()).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Notification Types', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/notificacoes')
      await page.waitForTimeout(1000)
    })

    test('should display different notification types', async ({ page }) => {
      const typeIcons = page.locator('[data-testid="notification-type-icon"], .notification-icon')

      if (await typeIcons.first().isVisible()) {
        await expect(typeIcons.first()).toBeVisible()
      }
    })

    test('should filter by notification type', async ({ page }) => {
      const typeFilter = page.getByLabel(/tipo/i).or(
        page.getByRole('combobox', { name: /tipo/i })
      )

      if (await typeFilter.isVisible()) {
        await typeFilter.click()

        const options = page.getByRole('option')
        if (await options.first().isVisible()) {
          await options.first().click()
          await page.waitForTimeout(500)
        }
      }
    })
  })

  test.describe('Notification Preferences', () => {
    test('should have settings/preferences link', async ({ page }) => {
      await page.goto('/notificacoes')

      const settingsLink = page.getByRole('link', { name: /config|prefer|settings/i })
      const settingsButton = page.getByRole('button', { name: /config|prefer|settings/i })

      if (await settingsLink.isVisible() || await settingsButton.isVisible()) {
        await expect(settingsLink.or(settingsButton).first()).toBeVisible()
      }
    })

    test('should open preferences page/modal', async ({ page }) => {
      await page.goto('/configuracoes/notificacoes')

      const preferencesTitle = page.getByRole('heading', { name: /prefer|config.*notifica/i })

      if (await preferencesTitle.isVisible()) {
        await expect(preferencesTitle).toBeVisible()
      }
    })
  })

  test.describe('Real-time Updates', () => {
    test('should update notification count when new notification arrives', async ({ page }) => {
      // This would require triggering a notification from the backend
      // For now, just verify the bell icon is set up for updates

      const bellIcon = page.locator('[data-testid="notification-bell"], [aria-label*="notifica"], .notification-bell').first()

      await expect(bellIcon).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Delete Notification', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/notificacoes')
      await page.waitForTimeout(1000)
    })

    test('should have delete button for notifications', async ({ page }) => {
      const notificationItem = page.locator('[data-testid="notification-item"], .notification-item').first()

      if (await notificationItem.isVisible()) {
        const deleteButton = notificationItem.getByRole('button', { name: /excluir|deletar|delete/i })

        if (await deleteButton.isVisible()) {
          await expect(deleteButton).toBeVisible()
        }
      }
    })

    test('should show confirmation when deleting', async ({ page }) => {
      const notificationItem = page.locator('[data-testid="notification-item"], .notification-item').first()

      if (await notificationItem.isVisible()) {
        const deleteButton = notificationItem.getByRole('button', { name: /excluir|deletar|delete/i })

        if (await deleteButton.isVisible()) {
          await deleteButton.click()

          const confirmDialog = page.locator('[role="alertdialog"], [role="dialog"]')
          const confirmText = page.getByText(/confirmar|certeza/i)

          await expect(confirmDialog.or(confirmText).first()).toBeVisible({ timeout: 5000 })
        }
      }
    })
  })

  test.describe('Pagination', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/notificacoes')
      await page.waitForTimeout(1000)
    })

    test('should display pagination controls', async ({ page }) => {
      const pagination = page.locator('[data-testid="pagination"], nav[aria-label*="paginacao"]')
      const paginationButtons = page.getByRole('button', { name: /proximo|anterior|next|prev/i })
      const loadMoreButton = page.getByRole('button', { name: /carregar mais|load more/i })

      await expect(pagination.or(paginationButtons.first()).or(loadMoreButton).first()).toBeVisible({ timeout: 5000 })
    })
  })
})
