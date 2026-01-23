import { test as setup, expect } from '@playwright/test'
import { TEST_USERS } from './fixtures/auth.fixture'

const STORAGE_STATE = 'playwright/.auth/admin.json'

setup('authenticate as admin', async ({ page }) => {
  // Navigate to login page
  await page.goto('/auth/login')

  // Fill in credentials
  await page.getByLabel(/e-mail/i).fill(TEST_USERS.admin.email)
  await page.getByLabel(/senha/i).fill(TEST_USERS.admin.password)

  // Submit form
  await page.getByRole('button', { name: /entrar/i }).click()

  // Wait for successful login (redirect to dashboard)
  await page.waitForURL('/', { timeout: 30000 })

  // Verify we're logged in
  await expect(page.locator('body')).not.toContainText(/login|entrar/i)

  // Save storage state for reuse
  await page.context().storageState({ path: STORAGE_STATE })
})
