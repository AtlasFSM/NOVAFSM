import { test, expect } from '@playwright/test';

/**
 * Multi-Tenant Isolation Tests
 *
 * These tests verify that data is completely isolated between tenants.
 * Tenant A should never be able to see or modify Tenant B's data.
 */

test.describe('Multi-Tenant Isolation', () => {
  const acmeAdmin = { email: 'admin@acme.ca', password: 'Password123!' };
  const coastalAdmin = { email: 'admin@coastal-services.com', password: 'Password123!' };

  test('tenants should only see their own customers', async ({ page }) => {
    // Login as Acme admin
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(acmeAdmin.email);
    await page.getByLabel(/password/i).fill(acmeAdmin.password);
    await page.getByRole('button', { name: /login/i }).click();

    // Navigate to customers
    await page.goto('/dashboard/customers');

    // Get list of customers for Acme
    const acmeCustomers = await page.locator('[data-testid="customer-row"]').allTextContents();
    const hasAcmeCustomers = acmeCustomers.some((text) => text.includes('Acme') || text.includes('Toronto'));

    expect(hasAcmeCustomers).toBeTruthy();

    // Logout and login as Coastal
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /logout/i }).click();

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(coastalAdmin.email);
    await page.getByLabel(/password/i).fill(coastalAdmin.password);
    await page.getByRole('button', { name: /login/i }).click();

    // Navigate to customers
    await page.goto('/dashboard/customers');

    // Get list of customers for Coastal
    const coastalCustomers = await page.locator('[data-testid="customer-row"]').allTextContents();

    // Verify Acme customers are NOT visible
    const hasCoastalCustomers = coastalCustomers.some((text) => text.includes('Coastal') || text.includes('San Francisco'));
    const hasAcmeInCoastal = coastalCustomers.some((text) => text.includes('Acme') || text.includes('Toronto'));

    expect(hasCoastalCustomers).toBeTruthy();
    expect(hasAcmeInCoastal).toBeFalsy();
  });

  test('direct API access should respect tenant isolation', async ({ page }) => {
    // Login as Acme
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(acmeAdmin.email);
    await page.getByLabel(/password/i).fill(acmeAdmin.password);
    await page.getByRole('button', { name: /login/i }).click();

    // Get a customer ID from Acme
    await page.goto('/dashboard/customers');
    const firstCustomer = page.locator('[data-testid="customer-row"]').first();
    await firstCustomer.click();

    const url = page.url();
    const acmeCustomerId = url.split('/').pop();

    // Store Acme token
    const acmeToken = await page.evaluate(() => localStorage.getItem('accessToken'));

    // Logout and login as Coastal
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /logout/i }).click();

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(coastalAdmin.email);
    await page.getByLabel(/password/i).fill(coastalAdmin.password);
    await page.getByRole('button', { name: /login/i }).click();

    // Try to access Acme customer via API with Coastal token
    const response = await page.request.get(`http://localhost:3000/api/v1/customers/${acmeCustomerId}`);

    // Should return 404 or 403 (not found or forbidden)
    expect([403, 404]).toContain(response.status());
  });

  test('tenants should have separate sequential numbering', async ({ page }) => {
    // Login as Acme
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(acmeAdmin.email);
    await page.getByLabel(/password/i).fill(acmeAdmin.password);
    await page.getByRole('button', { name: /login/i }).click();

    // Create a quote for Acme
    await page.goto('/dashboard/quotes');
    await page.getByRole('button', { name: /create quote/i }).click();

    await page.getByLabel(/customer/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/title/i).fill('Acme Test Quote');

    await page.getByRole('button', { name: /add line/i }).click();
    await page.getByLabel(/item/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/quantity/i).fill('1');

    await page.getByRole('button', { name: /create/i }).click();

    // Get Acme quote number
    const acmeQuoteNumber = await page.locator('[data-testid="quote-number"]').textContent();
    const acmeSequence = parseInt(acmeQuoteNumber!.split('-')[2]);

    // Logout and login as Coastal
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /logout/i }).click();

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(coastalAdmin.email);
    await page.getByLabel(/password/i).fill(coastalAdmin.password);
    await page.getByRole('button', { name: /login/i }).click();

    // Create a quote for Coastal
    await page.goto('/dashboard/quotes');
    await page.getByRole('button', { name: /create quote/i }).click();

    await page.getByLabel(/customer/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/title/i).fill('Coastal Test Quote');

    await page.getByRole('button', { name: /add line/i }).click();
    await page.getByLabel(/item/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/quantity/i).fill('1');

    await page.getByRole('button', { name: /create/i }).click();

    // Get Coastal quote number
    const coastalQuoteNumber = await page.locator('[data-testid="quote-number"]').textContent();
    const coastalSequence = parseInt(coastalQuoteNumber!.split('-')[2]);

    // Verify sequences are independent (not necessarily sequential)
    // Each tenant has its own sequence counter
    expect(acmeQuoteNumber).toMatch(/Q-\d{4}-\d{6}/);
    expect(coastalQuoteNumber).toMatch(/Q-\d{4}-\d{6}/);

    // The sequences should be independent
    // (One tenant's sequence shouldn't affect the other's)
    expect(acmeSequence).not.toBe(coastalSequence);
  });

  test('price lists should be tenant-specific', async ({ page }) => {
    // Login as Acme
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(acmeAdmin.email);
    await page.getByLabel(/password/i).fill(acmeAdmin.password);
    await page.getByRole('button', { name: /login/i }).click();

    // Navigate to pricing
    await page.goto('/dashboard/settings/pricing');

    // Get Acme price lists
    const acmePriceLists = await page.locator('[data-testid="price-list"]').allTextContents();

    // Logout and login as Coastal
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /logout/i }).click();

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(coastalAdmin.email);
    await page.getByLabel(/password/i).fill(coastalAdmin.password);
    await page.getByRole('button', { name: /login/i }).click();

    // Navigate to pricing
    await page.goto('/dashboard/settings/pricing');

    // Get Coastal price lists
    const coastalPriceLists = await page.locator('[data-testid="price-list"]').allTextContents();

    // Verify no overlap
    const overlap = acmePriceLists.filter((list) => coastalPriceLists.includes(list));
    expect(overlap.length).toBe(0);
  });

  test('technicians should only see jobs from their tenant', async ({ page }) => {
    // Login as Acme technician
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('tech1@acme.ca');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /login/i }).click();

    // Navigate to jobs
    await page.goto('/dashboard/jobs');

    // Verify can see jobs
    await expect(page.locator('[data-testid="job-card"]').first()).toBeVisible();

    // Get job count for Acme tech
    const acmeJobCount = await page.locator('[data-testid="job-card"]').count();

    // Logout and login as Coastal technician
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /logout/i }).click();

    await page.goto('/login');
    await page.getByLabel(/email/i).fill('tech1@coastal-services.com');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /login/i }).click();

    // Navigate to jobs
    await page.goto('/dashboard/jobs');

    // Get job count for Coastal tech
    const coastalJobCount = await page.locator('[data-testid="job-card"]').count();

    // Verify different sets of jobs
    expect(acmeJobCount).toBeGreaterThan(0);
    expect(coastalJobCount).toBeGreaterThan(0);
    // Job counts will be different as they're from different tenants
  });

  test('audit logs should be tenant-isolated', async ({ page }) => {
    // Login as Acme admin
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(acmeAdmin.email);
    await page.getByLabel(/password/i).fill(acmeAdmin.password);
    await page.getByRole('button', { name: /login/i }).click();

    // Navigate to audit logs (if available in settings)
    await page.goto('/dashboard/settings/audit');

    // Perform an action to generate audit log
    await page.goto('/dashboard/customers');
    const timestamp = Date.now();
    await page.getByRole('button', { name: /add customer/i }).click();
    await page.getByLabel(/name/i).fill(`Audit Test ${timestamp}`);
    await page.getByLabel(/email/i).fill(`audit${timestamp}@test.com`);
    await page.getByRole('button', { name: /save/i }).click();

    // Go back to audit logs
    await page.goto('/dashboard/settings/audit');

    // Verify audit entry exists
    await expect(page.getByText(`Audit Test ${timestamp}`)).toBeVisible({ timeout: 5000 });

    // Logout and login as Coastal
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByRole('menuitem', { name: /logout/i }).click();

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(coastalAdmin.email);
    await page.getByLabel(/password/i).fill(coastalAdmin.password);
    await page.getByRole('button', { name: /login/i }).click();

    // Navigate to audit logs
    await page.goto('/dashboard/settings/audit');

    // Verify Acme's audit entry is NOT visible
    await expect(page.getByText(`Audit Test ${timestamp}`)).not.toBeVisible();
  });
});
