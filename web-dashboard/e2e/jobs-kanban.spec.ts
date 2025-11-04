import { test, expect } from '@playwright/test';

test.describe('Jobs Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    // Login as dispatcher
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('dispatcher@acme.ca');
    await page.getByLabel(/password/i).fill('Password123!');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display jobs in Kanban columns by status', async ({ page }) => {
    await page.goto('/dashboard/jobs');

    // Wait for Kanban board to load
    await expect(page.getByText(/scheduled/i)).toBeVisible();
    await expect(page.getByText(/in progress/i)).toBeVisible();
    await expect(page.getByText(/completed/i)).toBeVisible();

    // Verify at least one job card is visible
    await expect(page.locator('[data-testid="job-card"]').first()).toBeVisible();
  });

  test('should drag and drop job between columns', async ({ page }) => {
    await page.goto('/dashboard/jobs');

    // Find a job in SCHEDULED column
    const scheduledColumn = page.locator('[data-column="SCHEDULED"]');
    const jobCard = scheduledColumn.locator('[data-testid="job-card"]').first();

    // Get job number for verification
    const jobNumber = await jobCard.locator('[data-testid="job-number"]').textContent();

    // Drag job to IN_PROGRESS column
    const inProgressColumn = page.locator('[data-column="IN_PROGRESS"]');
    await jobCard.dragTo(inProgressColumn);

    // Wait for API call to complete
    await page.waitForResponse((response) =>
      response.url().includes('/api/v1/jobs') && response.status() === 200
    );

    // Verify job moved to new column
    const movedJob = inProgressColumn.getByText(jobNumber!);
    await expect(movedJob).toBeVisible();
  });

  test('should switch between Kanban and Table view', async ({ page }) => {
    await page.goto('/dashboard/jobs');

    // Should default to Kanban view
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();

    // Switch to Table view
    await page.getByRole('button', { name: /table view/i }).click();

    // Should show data table
    await expect(page.locator('[data-testid="jobs-table"]')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /number/i })).toBeVisible();

    // Switch back to Kanban
    await page.getByRole('button', { name: /kanban view/i }).click();
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
  });

  test('should filter jobs by technician', async ({ page }) => {
    await page.goto('/dashboard/jobs');

    // Open filter dropdown
    await page.getByLabel(/filter by technician/i).click();

    // Select a technician
    await page.getByRole('option', { name: /mike technician/i }).click();

    // Wait for filter to apply
    await page.waitForResponse((response) =>
      response.url().includes('/api/v1/jobs') && response.url().includes('technicianId')
    );

    // Verify only Mike's jobs are shown
    const jobCards = page.locator('[data-testid="job-card"]');
    const count = await jobCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify all visible jobs have Mike assigned
    for (let i = 0; i < count; i++) {
      const card = jobCards.nth(i);
      await expect(card.getByText(/mike/i)).toBeVisible();
    }
  });

  test('should create new job from Kanban', async ({ page }) => {
    await page.goto('/dashboard/jobs');

    await page.getByRole('button', { name: /create job/i }).click();

    // Fill job form
    const timestamp = Date.now();
    await page.getByLabel(/customer/i).click();
    await page.getByRole('option').first().click();

    await page.getByLabel(/title/i).fill(`E2E Test Job ${timestamp}`);
    await page.getByLabel(/description/i).fill('Created from E2E test');

    // Set scheduled times
    const tomorrow = new Date(Date.now() + 86400000);
    await page.getByLabel(/scheduled start/i).fill(tomorrow.toISOString().slice(0, 16));

    const endTime = new Date(tomorrow.getTime() + 14400000); // +4 hours
    await page.getByLabel(/scheduled end/i).fill(endTime.toISOString().slice(0, 16));

    // Select priority
    await page.getByLabel(/priority/i).click();
    await page.getByRole('option', { name: /high/i }).click();

    await page.getByRole('button', { name: /create job/i }).click();

    // Should redirect to job detail
    await expect(page).toHaveURL(/\/jobs\//);
    await expect(page.getByText(/scheduled/i)).toBeVisible();
  });

  test('should show real-time WebSocket updates', async ({ page, context }) => {
    await page.goto('/dashboard/jobs');

    // Open job detail in current page
    const jobCard = page.locator('[data-testid="job-card"]').first();
    const jobNumber = await jobCard.locator('[data-testid="job-number"]').textContent();
    await jobCard.click();

    // Open a second page (simulating another dispatcher)
    const page2 = await context.newPage();
    await page2.goto('/login');
    await page2.getByLabel(/email/i).fill('admin@acme.ca');
    await page2.getByLabel(/password/i).fill('Password123!');
    await page2.getByRole('button', { name: /login/i }).click();
    await page2.goto('/dashboard/jobs');

    // Assign technician on page 1
    await page.getByRole('button', { name: /assign/i }).click();
    await page.getByLabel(/technician/i).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Wait for WebSocket message
    await page2.waitForTimeout(2000); // Allow time for WebSocket event

    // Verify job updated on page 2 (via WebSocket)
    const updatedJob = page2.getByText(jobNumber!);
    await expect(updatedJob).toBeVisible();

    // Close second page
    await page2.close();
  });

  test('should detect schedule conflicts', async ({ page }) => {
    await page.goto('/dashboard/jobs');
    await page.getByRole('button', { name: /create job/i }).click();

    // Select customer and technician
    await page.getByLabel(/customer/i).click();
    await page.getByRole('option').first().click();

    await page.getByLabel(/technician/i).click();
    const technicianOption = page.getByRole('option', { name: /mike/i });
    await technicianOption.click();

    // Set time that conflicts with existing job
    const now = new Date();
    await page.getByLabel(/scheduled start/i).fill(now.toISOString().slice(0, 16));

    // Should show conflict warning
    await expect(page.getByText(/conflict|already scheduled/i)).toBeVisible({ timeout: 5000 });

    // Should still allow creating with warning
    await expect(page.getByRole('button', { name: /create anyway/i })).toBeVisible();
  });

  test('should show job timeline and history', async ({ page }) => {
    await page.goto('/dashboard/jobs');

    // Click on a completed job
    const completedColumn = page.locator('[data-column="COMPLETED"]');
    const jobCard = completedColumn.locator('[data-testid="job-card"]').first();
    await jobCard.click();

    // Should show job detail page
    await expect(page.getByRole('heading', { name: /job detail/i })).toBeVisible();

    // Verify timeline section exists
    await expect(page.getByText(/timeline|history/i)).toBeVisible();

    // Should show status changes
    await expect(page.getByText(/created/i)).toBeVisible();
    await expect(page.getByText(/started/i)).toBeVisible();
    await expect(page.getByText(/completed/i)).toBeVisible();

    // Verify time entries
    await expect(page.getByText(/time entries/i)).toBeVisible();

    // Verify check-in/check-out locations if available
    const checkInSection = page.locator('[data-testid="check-in-location"]');
    if (await checkInSection.isVisible()) {
      await expect(checkInSection).toContainText(/latitude|longitude/i);
    }
  });
});
