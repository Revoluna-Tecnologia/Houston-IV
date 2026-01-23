import { test as base, expect } from '@playwright/test';

/**
 * Test user credentials for E2E tests
 * These should match users created in the test database seed
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@houston.test',
    password: 'Admin@123456',
    name: 'Admin User',
    role: 'administrador',
  },
  gestor: {
    email: 'gestor@houston.test',
    password: 'Gestor@123456',
    name: 'Gestor User',
    role: 'gestor',
  },
  coordenador: {
    email: 'coordenador@houston.test',
    password: 'Coordenador@123456',
    name: 'Coordenador User',
    role: 'coordenador',
  },
  escalista: {
    email: 'escalista@houston.test',
    password: 'Escalista@123456',
    name: 'Escalista User',
    role: 'escalista',
  },
};

export type UserRole = keyof typeof TEST_USERS;

/**
 * Extended test fixture with authentication helpers
 */
export const test = base.extend<{
  /**
   * Login as a specific user role
   */
  loginAs: (role: UserRole) => Promise<void>;
  /**
   * Logout the current user
   */
  logout: () => Promise<void>;
}>({
  loginAs: async ({ page }, use) => {
    const loginAs = async (role: UserRole) => {
      const user = TEST_USERS[role];

      await page.goto('/auth/login');
      await page.getByLabel(/e-mail/i).fill(user.email);
      await page.getByLabel(/senha/i).fill(user.password);
      await page.getByRole('button', { name: /entrar/i }).click();

      // Wait for redirect to dashboard
      await page.waitForURL('/', { timeout: 10000 });

      // Verify we're logged in
      await expect(page.locator('body')).not.toContainText('Entrar');
    };

    await use(loginAs);
  },

  logout: async ({ page }, use) => {
    const logout = async () => {
      // Click on user menu and logout
      await page.getByRole('button', { name: /menu/i }).click();
      await page.getByRole('menuitem', { name: /sair/i }).click();

      // Wait for redirect to login
      await page.waitForURL('/auth/login', { timeout: 10000 });
    };

    await use(logout);
  },
});

export { expect };
