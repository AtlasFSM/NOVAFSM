import { test, expect } from '@playwright/test';

/**
 * Critical E2E Test: Quote-to-Cash Flow
 *
 * This test covers the complete business workflow:
 * 1. Login as dispatcher
 * 2. Create a new customer
 * 3. Create a quote for that customer
 * 4. Send the quote
 * 5. Approve the quote (as admin)
 * 6. Convert quote to job
 * 7. Assign technician to job
 * 8. Complete the job
 * 9. Create invoice from completed job
 * 10. Verify invoice totals and tax calculation
 */

test.describe('Quote-to-Cash Flow', () => {
  let customerName: string;
  let quoteName: string;
  let jobNumber: string;
  let invoiceNumber: string;

  test.beforeEach(async ({ page }) => {
    // Login as dispatcher
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('dispatcher@acme.ca');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/dashboard');

    // Generate unique names for this test run
    const timestamp = Date.now();
    customerName = `Test Customer ${timestamp}`;
    quoteName = `Test Quote ${timestamp}`;
  });

  test('complete quote-to-cash workflow', async ({ page }) => {
    // Step 1: Create a new customer
    await test.step('Create customer', async () => {
      await page.goto('/dashboard/customers');
      await page.getByRole('button', { name: /add customer/i }).click();

      await page.getByLabel(/name/i).fill(customerName);
      await page.getByLabel(/email/i).fill(`customer${Date.now()}@test.com`);
      await page.getByLabel(/phone/i).fill('+1-416-555-9999');
      await page.getByLabel(/address/i).fill('123 Test Street');
      await page.getByLabel(/city/i).fill('Toronto');
      await page.getByLabel(/province/i).fill('ON');
      await page.getByLabel(/postal/i).fill('M1A 1A1');

      await page.getByRole('button', { name: /save|create/i }).click();

      // Wait for success message
      await expect(page.getByText(/customer created/i)).toBeVisible();
    });

    // Step 2: Create a quote for the customer
    await test.step('Create quote', async () => {
      await page.goto('/dashboard/quotes');
      await page.getByRole('button', { name: /create quote/i }).click();

      // Select customer (searchable dropdown)
      await page.getByLabel(/customer/i).click();
      await page.getByRole('option', { name: new RegExp(customerName, 'i') }).click();

      await page.getByLabel(/title/i).fill(quoteName);
      await page.getByLabel(/description/i).fill('Test HVAC service quote');

      // Set valid until date (30 days from now)
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);
      await page.getByLabel(/valid until/i).fill(validUntil.toISOString().split('T')[0]);

      // Add line items
      await page.getByRole('button', { name: /add line/i }).click();

      // First line: HVAC Diagnostic
      await page.getByLabel(/item.*1/i).click();
      await page.getByRole('option', { name: /hvac diagnostic/i }).click();
      await page.getByLabel(/quantity.*1/i).fill('1');
      // Price auto-filled from price list

      // Add second line: Repair Labor
      await page.getByRole('button', { name: /add line/i }).click();
      await page.getByLabel(/item.*2/i).click();
      await page.getByRole('option', { name: /hvac repair.*hourly/i }).click();
      await page.getByLabel(/quantity.*2/i).fill('3');

      // Verify totals are calculated
      await expect(page.getByText(/subtotal/i)).toBeVisible();
      await expect(page.getByText(/tax/i)).toBeVisible();
      await expect(page.getByText(/total/i)).toBeVisible();

      await page.getByRole('button', { name: /save|create quote/i }).click();

      // Wait for success and capture quote number
      await expect(page.getByText(/quote created/i)).toBeVisible();
      const quoteNumberElement = await page.locator('[data-testid="quote-number"]').textContent();
      expect(quoteNumberElement).toMatch(/Q-\d{4}-\d{6}/);
    });

    // Step 3: Send the quote
    await test.step('Send quote', async () => {
      // Should be on quote detail page
      await expect(page.getByText(/draft/i)).toBeVisible();

      await page.getByRole('button', { name: /send/i }).click();
      await page.getByRole('button', { name: /confirm/i }).click();

      // Status should change to SENT
      await expect(page.getByText(/sent/i)).toBeVisible();
    });

    // Step 4: Approve the quote (switch to admin)
    await test.step('Approve quote', async () => {
      // Logout and login as admin
      await page.getByRole('button', { name: /user menu/i }).click();
      await page.getByRole('menuitem', { name: /logout/i }).click();

      await page.goto('/login');
      await page.getByLabel(/email/i).fill('admin@acme.ca');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /login/i }).click();

      // Navigate back to quote
      await page.goto('/dashboard/quotes');
      await page.getByText(new RegExp(quoteName, 'i')).click();

      // Approve quote
      await page.getByRole('button', { name: /approve/i }).click();
      await page.getByRole('button', { name: /confirm/i }).click();

      // Status should change to APPROVED
      await expect(page.getByText(/approved/i)).toBeVisible();
    });

    // Step 5: Convert quote to job
    await test.step('Convert to job', async () => {
      await page.getByRole('button', { name: /convert to job/i }).click();

      // Fill in job details
      await page.getByLabel(/scheduled start/i).fill(
        new Date(Date.now() + 86400000).toISOString().slice(0, 16)
      ); // Tomorrow
      await page.getByLabel(/scheduled end/i).fill(
        new Date(Date.now() + 86400000 + 14400000).toISOString().slice(0, 16)
      ); // Tomorrow + 4 hours

      await page.getByRole('button', { name: /create job/i }).click();

      // Should redirect to job detail
      await expect(page).toHaveURL(/\/jobs\//);
      const jobNumberElement = await page.locator('[data-testid="job-number"]').textContent();
      expect(jobNumberElement).toMatch(/J-\d{4}-\d{6}/);
      jobNumber = jobNumberElement || '';
    });

    // Step 6: Assign technician to job
    await test.step('Assign technician', async () => {
      await page.getByRole('button', { name: /assign/i }).click();

      // Select technician
      await page.getByLabel(/technician/i).click();
      await page.getByRole('option', { name: /mike technician/i }).click();

      await page.getByRole('button', { name: /confirm/i }).click();

      // Should see assigned technician
      await expect(page.getByText(/mike technician/i)).toBeVisible();
    });

    // Step 7: Complete the job (simulate technician workflow)
    await test.step('Complete job', async () => {
      // Start job
      await page.getByRole('button', { name: /start job/i }).click();
      await page.getByRole('button', { name: /confirm/i }).click();

      await expect(page.getByText(/in progress/i)).toBeVisible();

      // Complete job
      await page.getByRole('button', { name: /complete job/i }).click();
      await page.getByRole('button', { name: /confirm/i }).click();

      await expect(page.getByText(/completed/i)).toBeVisible();
    });

    // Step 8: Create invoice from completed job
    await test.step('Create invoice', async () => {
      await page.getByRole('button', { name: /create invoice/i }).click();

      // Invoice should be pre-filled with job details
      await expect(page.getByText(/subtotal/i)).toBeVisible();

      // Verify line items match quote
      await expect(page.getByText(/hvac diagnostic/i)).toBeVisible();
      await expect(page.getByText(/hvac repair/i)).toBeVisible();

      await page.getByRole('button', { name: /create invoice/i }).click();

      // Should redirect to invoice detail
      await expect(page).toHaveURL(/\/invoices\//);
      const invoiceNumberElement = await page.locator('[data-testid="invoice-number"]').textContent();
      expect(invoiceNumberElement).toMatch(/INV-\d{4}-\d{6}/);
      invoiceNumber = invoiceNumberElement || '';
    });

    // Step 9: Verify invoice totals
    await test.step('Verify invoice totals', async () => {
      // Verify customer name
      await expect(page.getByText(new RegExp(customerName, 'i'))).toBeVisible();

      // Verify tax calculation (HST 13% in Ontario)
      const subtotalElement = await page.locator('[data-testid="invoice-subtotal"]').textContent();
      const taxTotalElement = await page.locator('[data-testid="invoice-tax"]').textContent();
      const totalElement = await page.locator('[data-testid="invoice-total"]').textContent();

      const subtotal = parseFloat(subtotalElement?.replace(/[^0-9.]/g, '') || '0');
      const taxTotal = parseFloat(taxTotalElement?.replace(/[^0-9.]/g, '') || '0');
      const total = parseFloat(totalElement?.replace(/[^0-9.]/g, '') || '0');

      // Verify tax calculation (HST 13%)
      expect(taxTotal).toBeCloseTo(subtotal * 0.13, 2);
      expect(total).toBeCloseTo(subtotal + taxTotal, 2);

      // Expected: HVAC Diagnostic (125) + HVAC Repair 3hrs (285) = 410
      // Tax: 410 * 0.13 = 53.30
      // Total: 463.30
      expect(subtotal).toBeCloseTo(410, 2);
      expect(taxTotal).toBeCloseTo(53.30, 2);
      expect(total).toBeCloseTo(463.30, 2);
    });

    // Step 10: Verify multi-tenant isolation
    await test.step('Verify tenant isolation', async () => {
      // Logout from Acme
      await page.getByRole('button', { name: /user menu/i }).click();
      await page.getByRole('menuitem', { name: /logout/i }).click();

      // Login to Coastal (different tenant)
      await page.goto('/login');
      await page.getByLabel(/email/i).fill('admin@coastal-services.com');
      await page.getByLabel(/password/i).fill('Password123!');
      await page.getByRole('button', { name: /login/i }).click();

      // Navigate to customers
      await page.goto('/dashboard/customers');

      // Should NOT see the Acme customer we just created
      await expect(page.getByText(new RegExp(customerName, 'i'))).not.toBeVisible();

      // Navigate to quotes
      await page.goto('/dashboard/quotes');

      // Should NOT see the Acme quote
      await expect(page.getByText(new RegExp(quoteName, 'i'))).not.toBeVisible();
    });
  });

  test('should handle quote rejection workflow', async ({ page }) => {
    // Create a customer and quote (simplified)
    await page.goto('/dashboard/quotes');
    await page.getByRole('button', { name: /create quote/i }).click();

    // Fill minimum required fields
    await page.getByLabel(/customer/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/title/i).fill('Test Rejection Quote');

    // Add one line item
    await page.getByRole('button', { name: /add line/i }).click();
    await page.getByLabel(/item/i).click();
    await page.getByRole('option').first().click();
    await page.getByLabel(/quantity/i).fill('1');

    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByText(/quote created/i)).toBeVisible();

    // Send quote
    await page.getByRole('button', { name: /send/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Reject quote
    await page.getByRole('button', { name: /reject/i }).click();
    await page.getByLabel(/reason/i).fill('Customer declined - too expensive');
    await page.getByRole('button', { name: /confirm/i }).click();

    // Should show REJECTED status
    await expect(page.getByText(/rejected/i)).toBeVisible();

    // Convert button should be disabled for rejected quotes
    await expect(page.getByRole('button', { name: /convert/i })).toBeDisabled();
  });
});
