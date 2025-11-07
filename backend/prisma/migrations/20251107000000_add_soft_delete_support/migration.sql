-- AddSoftDelete: Add deletedAt column to all main business entities

-- Organizations
ALTER TABLE "organizations" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Users
ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Technicians
ALTER TABLE "technicians" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Customers
ALTER TABLE "customers" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Sites
ALTER TABLE "sites" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Price Lists
ALTER TABLE "price_lists" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Price Items
ALTER TABLE "price_items" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Tax Rates
ALTER TABLE "tax_rates" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Quotes
ALTER TABLE "quotes" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Quote Lines
ALTER TABLE "quote_lines" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Jobs
ALTER TABLE "jobs" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Invoices
ALTER TABLE "invoices" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Inventory Items
ALTER TABLE "inventory_items" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Time Entries
ALTER TABLE "time_entries" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Expense Entries
ALTER TABLE "expense_entries" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Assets
ALTER TABLE "assets" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Documents
ALTER TABLE "documents" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Form Templates
ALTER TABLE "form_templates" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Form Assignments
ALTER TABLE "form_assignments" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Form Responses
ALTER TABLE "form_responses" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add indexes for deletedAt columns to improve query performance
CREATE INDEX "organizations_deletedAt_idx" ON "organizations"("deletedAt");
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");
CREATE INDEX "customers_deletedAt_idx" ON "customers"("deletedAt");
CREATE INDEX "sites_deletedAt_idx" ON "sites"("deletedAt");
CREATE INDEX "quotes_deletedAt_idx" ON "quotes"("deletedAt");
CREATE INDEX "jobs_deletedAt_idx" ON "jobs"("deletedAt");
CREATE INDEX "invoices_deletedAt_idx" ON "invoices"("deletedAt");
CREATE INDEX "inventory_items_deletedAt_idx" ON "inventory_items"("deletedAt");
CREATE INDEX "assets_deletedAt_idx" ON "assets"("deletedAt");
CREATE INDEX "documents_deletedAt_idx" ON "documents"("deletedAt");
CREATE INDEX "form_templates_deletedAt_idx" ON "form_templates"("deletedAt");
