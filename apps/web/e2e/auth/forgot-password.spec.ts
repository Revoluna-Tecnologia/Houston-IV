import { test, expect } from '@playwright/test';

test.describe('Forgot Password Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/forgot-password');
  });

  test.describe('Page Rendering', () => {
    test('should display forgot password form', async ({ page }) => {
      // Check for email input
      await expect(page.getByLabel(/e-mail/i)).toBeVisible();

      // Check for submit button
      await expect(
        page.getByRole('button', { name: /enviar|recuperar|redefinir/i })
      ).toBeVisible();
    });

    test('should have a link back to login', async ({ page }) => {
      await expect(page.getByText(/voltar|login|entrar/i)).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test('should show error for empty email', async ({ page }) => {
      await page
        .getByRole('button', { name: /enviar|recuperar|redefinir/i })
        .click();

      await expect(page.getByText(/e-mail.*invalido|obrigat/i)).toBeVisible();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.getByLabel(/e-mail/i).fill('invalid-email');
      await page
        .getByRole('button', { name: /enviar|recuperar|redefinir/i })
        .click();

      await expect(page.getByText(/e-mail.*invalido/i)).toBeVisible();
    });
  });

  test.describe('Form Submission', () => {
    test('should show success message after submitting valid email', async ({
      page,
    }) => {
      await page.getByLabel(/e-mail/i).fill('test@example.com');
      await page
        .getByRole('button', { name: /enviar|recuperar|redefinir/i })
        .click();

      // Wait for success message or redirect
      await expect(
        page.getByText(/enviamos|verifique|e-mail enviado/i)
      ).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to login page', async ({ page }) => {
      await page.getByText(/voltar|login/i).click();

      await expect(page).toHaveURL('/auth/login');
    });
  });
});
