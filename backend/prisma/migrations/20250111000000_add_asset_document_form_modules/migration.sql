-- CreateTable: Asset & Equipment Tracking
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "name" TEXT NOT NULL,
    "serialNumber" TEXT,
    "model" TEXT,
    "vendor" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(12,2),
    "warrantyExpires" TIMESTAMP(3),
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3),
    "assignedToType" TEXT,
    "assignedToId" UUID,
    "customerId" UUID,
    "siteId" UUID,
    "jobId" UUID,
    "technicianId" UUID,
    "geoLocation" JSONB,
    "hourlyRate" DECIMAL(12,2),
    "dailyRate" DECIMAL(12,2),
    "specifications" JSONB NOT NULL DEFAULT '{}',
    "maintenanceLogs" JSONB NOT NULL DEFAULT '[]',
    "usageHistory" JSONB NOT NULL DEFAULT '[]',
    "qrCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Document Management System
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Bucket" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" UUID,
    "virtualPath" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "entityType" TEXT,
    "entityId" UUID,
    "customerId" UUID,
    "siteId" UUID,
    "jobId" UUID,
    "quoteId" UUID,
    "invoiceId" UUID,
    "assetId" UUID,
    "uploadedById" UUID,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "checksum" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Form Templates
CREATE TABLE "form_templates" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "logic" JSONB NOT NULL DEFAULT '{}',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Form Assignments
CREATE TABLE "form_assignments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "assignedType" TEXT NOT NULL,
    "assignedToId" UUID,
    "jobId" UUID,
    "siteId" UUID,
    "assetId" UUID,
    "assignedById" UUID,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Form Responses
CREATE TABLE "form_responses" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "assignmentId" UUID,
    "responses" JSONB NOT NULL DEFAULT '{}',
    "submittedById" UUID,
    "submittedAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "deviceInfo" JSONB,
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "score" INTEGER,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assets_tenantId_status_idx" ON "assets"("tenantId", "status");
CREATE INDEX "assets_tenantId_category_idx" ON "assets"("tenantId", "category");
CREATE INDEX "assets_tenantId_assignedToType_assignedToId_idx" ON "assets"("tenantId", "assignedToType", "assignedToId");
CREATE INDEX "assets_tenantId_customerId_idx" ON "assets"("tenantId", "customerId");
CREATE INDEX "assets_tenantId_serialNumber_idx" ON "assets"("tenantId", "serialNumber");

CREATE INDEX "documents_tenantId_entityType_entityId_idx" ON "documents"("tenantId", "entityType", "entityId");
CREATE INDEX "documents_tenantId_customerId_idx" ON "documents"("tenantId", "customerId");
CREATE INDEX "documents_tenantId_s3Key_idx" ON "documents"("tenantId", "s3Key");
CREATE INDEX "documents_tenantId_createdAt_idx" ON "documents"("tenantId", "createdAt");
CREATE INDEX "documents_tenantId_expiresAt_idx" ON "documents"("tenantId", "expiresAt");

CREATE INDEX "form_templates_tenantId_isActive_idx" ON "form_templates"("tenantId", "isActive");
CREATE INDEX "form_templates_tenantId_category_idx" ON "form_templates"("tenantId", "category");

CREATE INDEX "form_assignments_tenantId_templateId_idx" ON "form_assignments"("tenantId", "templateId");
CREATE INDEX "form_assignments_tenantId_assignedType_assignedToId_idx" ON "form_assignments"("tenantId", "assignedType", "assignedToId");
CREATE INDEX "form_assignments_tenantId_status_idx" ON "form_assignments"("tenantId", "status");
CREATE INDEX "form_assignments_tenantId_dueDate_idx" ON "form_assignments"("tenantId", "dueDate");

CREATE UNIQUE INDEX "form_responses_assignmentId_key" ON "form_responses"("assignmentId");
CREATE INDEX "form_responses_tenantId_templateId_idx" ON "form_responses"("tenantId", "templateId");
CREATE INDEX "form_responses_tenantId_status_idx" ON "form_responses"("tenantId", "status");
CREATE INDEX "form_responses_tenantId_submittedAt_idx" ON "form_responses"("tenantId", "submittedAt");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assets" ADD CONSTRAINT "assets_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "assets" ADD CONSTRAINT "assets_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "assets" ADD CONSTRAINT "assets_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "documents" ADD CONSTRAINT "documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_assignments" ADD CONSTRAINT "form_assignments_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "form_assignments" ADD CONSTRAINT "form_assignments_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "form_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "form_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
