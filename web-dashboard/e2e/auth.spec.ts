import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page for unauthenticated user', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /novafsm/i })).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in login form
    await page.getByLabel(/email/i).fill('admin@acme.ca');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /login/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@acme.ca');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /logout/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('should register new organization', async ({ page }) => {
    await page.goto('/register');

    const timestamp = Date.now();
    await page.getByLabel(/organization name/i).fill(`Test Org ${timestamp}`);
    await page.getByLabel(/email/i).fill(`admin${timestamp}@test.com`);
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByLabel(/first name/i).fill('Test');
    await page.getByLabel(/last name/i).fill('Admin');

    await page.getByRole('button', { name: /register/i }).click();

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
  });
});
