import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test.describe('Page Rendering', () => {
    test('should display login form elements', async ({ page }) => {
      // Check for email input
      await expect(page.getByLabel(/e-mail/i)).toBeVisible();

      // Check for password input
      await expect(page.getByLabel(/senha/i)).toBeVisible();

      // Check for remember me checkbox
      await expect(page.getByLabel(/lembrar de mim/i)).toBeVisible();

      // Check for submit button
      await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();

      // Check for forgot password link
      await expect(page.getByText(/esqueci minha senha/i)).toBeVisible();
    });

    test('should display social login buttons', async ({ page }) => {
      // Google, Microsoft, and Magic Link buttons should be visible
      const socialButtons = page.locator('button[type="button"]').filter({
        has: page.locator('svg'),
      });

      await expect(socialButtons).toHaveCount(3);
    });
  });

  test.describe('Form Validation', () => {
    test('should show error for empty email', async ({ page }) => {
      await page.getByLabel(/senha/i).fill('password123');
      await page.getByRole('button', { name: /entrar/i }).click();

      await expect(page.getByText(/e-mail invalido/i)).toBeVisible();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.getByLabel(/e-mail/i).fill('invalid-email');
      await page.getByLabel(/senha/i).fill('password123');
      await page.getByRole('button', { name: /entrar/i }).click();

      await expect(page.getByText(/e-mail invalido/i)).toBeVisible();
    });

    test('should show error for short password', async ({ page }) => {
      await page.getByLabel(/e-mail/i).fill('test@example.com');
      await page.getByLabel(/senha/i).fill('1234567'); // 7 chars, min is 8
      await page.getByRole('button', { name: /entrar/i }).click();

      await expect(
        page.getByText(/a senha deve ter no minimo 8 caracteres/i)
      ).toBeVisible();
    });
  });

  test.describe('Form Submission', () => {
    test('should show loading state during submission', async ({ page }) => {
      await page.getByLabel(/e-mail/i).fill('test@example.com');
      await page.getByLabel(/senha/i).fill('password123');

      // Click and immediately check for loading state
      const submitPromise = page
        .getByRole('button', { name: /entrar/i })
        .click();

      // The button should show loading text or be disabled
      await expect(
        page.getByRole('button', { name: /entrando/i })
      ).toBeVisible();

      await submitPromise;
    });

    test('should show error message for invalid credentials', async ({
      page,
    }) => {
      await page.getByLabel(/e-mail/i).fill('invalid@example.com');
      await page.getByLabel(/senha/i).fill('wrongpassword123');
      await page.getByRole('button', { name: /entrar/i }).click();

      // Wait for error message
      await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to forgot password page', async ({ page }) => {
      await page.getByText(/esqueci minha senha/i).click();

      await expect(page).toHaveURL('/auth/forgot-password');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper form labels', async ({ page }) => {
      // All inputs should have associated labels
      const emailInput = page.getByLabel(/e-mail/i);
      const passwordInput = page.getByLabel(/senha/i);

      await expect(emailInput).toHaveAttribute('type', 'email');
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/e-mail/i)).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/senha/i)).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(page.getByLabel(/lembrar de mim/i)).toBeFocused();
    });
  });
});
