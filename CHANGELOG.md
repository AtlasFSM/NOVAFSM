# Changelog

All notable changes to the NoVaFSM project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Fixed mobile app dependency issue: replaced invalid `expo-net-info` package with `@react-native-community/netinfo@^11.3.1`
- Resolved npm install blocking issue that prevented workspace dependencies installation

### Added
- Created CHANGELOG.md to track project releases and changes

## [0.9.0] - 2025-11-04

### Added
- **Assets Management Module** - Complete CRUD for equipment and asset tracking
  - Asset controller with full REST API
  - Asset service with tenant isolation
  - Asset DTOs (create, update, assign)
  - Unit tests for asset service
- **Documents Module** - Document management system
  - Document upload and metadata management
  - Integration with file storage service
  - Document categorization and linking
- **Forms Module** - Dynamic form builder and response system
  - Form template creation and management
  - Form assignment to jobs/assets
  - Form response collection and storage
- Added 3 new web dashboard pages: Assets, Documents, Forms
- Extended Prisma schema with 5 new models: Asset, Document, FormTemplate, FormAssignment, FormResponse

### Changed
- Updated organization relationships to include assets, documents, and forms
- Enhanced backend module count from 17 to 20 modules

## [0.8.0] - 2025-11-03

### Added
- **Complete Web Dashboard CRUD Pages** (7 pages)
  - Customer management: list, detail, create, edit pages
  - Quote management: list, detail, create pages with line items
  - Jobs Kanban board with drag-and-drop functionality
  - Schedule calendar with weekly view and technician filtering
  - Invoice list with status tracking
  - Inventory management with stock alerts
  - Settings page with profile, organization, notifications, security tabs

### Changed
- Web dashboard now has 100% feature coverage for core FSM operations
- Improved UI/UX consistency across all dashboard pages

## [0.7.0] - 2025-11-02

### Added
- **Organizations Module** - Multi-tenant organization management
  - Full CRUD operations for organizations
  - Organization statistics and metrics
  - Tenant-scoped data isolation
- **Sites Module** - Customer site management
  - Site CRUD with geocoding support
  - Primary site designation
  - Customer relationship management
- **Schedule Module** - Advanced scheduling system
  - Conflict detection for overlapping appointments
  - Technician availability checking
  - Utilization tracking and reporting

### Changed
- Enhanced backend with 3 critical enterprise modules
- Improved multi-tenant architecture enforcement

## [0.6.0] - 2025-11-01

### Added
- **Analytics and Reporting Dashboard**
  - Revenue charts and financial metrics
  - Job status distribution visualizations
  - Top customers by revenue
  - Technician performance metrics
  - Interactive charts using Recharts library
- **Email Notification System**
  - Professional PDF generation for quotes and invoices
  - Automated email sending on quote/invoice creation
  - Email templates with company branding
  - PDF attachments with detailed line items
- **Customer Portal**
  - Public quote viewing interface
  - Invoice access for customers
  - Status tracking for quotes and invoices

## [0.5.0] - 2025-10-31

### Added
- **Mobile Photo and Signature Capture**
  - Camera integration for job site photos
  - Image picker for gallery selection
  - Digital signature capture with canvas
  - Offline-first storage with SQLite
  - Background sync with S3 presigned URLs
  - Idempotency-based deduplication
- Mobile screens: Login, Jobs List, Job Detail
- SQLite database for offline job data

### Changed
- Enhanced mobile app with offline-first capabilities
- Improved job completion workflow with photo/signature requirements

## [0.4.0] - 2025-10-25

### Added
- **Complete Infrastructure Setup**
  - 14 Kubernetes manifests for production deployment
  - Docker Compose development environment (PostgreSQL, Redis, MinIO)
  - GitHub Actions CI/CD pipeline with 6 jobs
  - Security scanning with Trivy and Snyk
  - Horizontal Pod Autoscaling and Pod Disruption Budgets
- **E2E Test Suites**
  - Authentication flow tests
  - Quote-to-cash workflow tests
  - Kanban board interaction tests
  - Multi-tenant isolation tests

### Changed
- Project now production-ready with complete DevOps infrastructure
- Automated testing and deployment pipelines

## [0.3.0] - 2025-10-20

### Added
- **Web Dashboard Foundation** (Next.js 14)
  - Dashboard home page with KPI cards
  - Recent activity widgets
  - Quick action shortcuts
  - Responsive sidebar navigation
  - Header with user menu
  - Breadcrumb navigation
- shadcn/ui component library integration
- API client with JWT authentication interceptors

### Changed
- Migrated to Next.js 14 App Router architecture
- Improved TypeScript type safety across frontend

## [0.2.0] - 2025-10-15

### Added
- **15 Backend Modules** (NestJS 10)
  - Authentication (JWT RS256, MFA, JWKS endpoint)
  - User management with RBAC
  - Customer and CRM functionality
  - Pricing lists and items
  - Quote workflow (DRAFT → SENT → APPROVED)
  - Job/work order management
  - Invoice generation with tax calculation
  - Inventory tracking
  - Time and expense tracking
  - File uploads with S3/MinIO
  - Audit logging
  - Outbox event pattern with BullMQ
  - Email service integration
  - Health check endpoints
- **Prisma Database Schema** (PostgreSQL 15)
  - 21 models with full multi-tenant support
  - Tenant-scoped unique constraints
  - Comprehensive relationships and indexes
- Comprehensive seed data (2 tenants, 40 customers, 20 quotes, 30 jobs, 10 invoices)

### Security
- RS256 JWT with access and refresh tokens
- Token blacklisting via Redis
- Bcrypt password hashing (cost: 12)
- Role-based access control (5 roles)
- Optional TOTP MFA support

## [0.1.0] - 2025-10-10

### Added
- Initial monorepo structure with npm workspaces
- Project foundation and architecture decisions
- README with project overview
- Basic TypeScript configuration
- ESLint and Prettier setup
- Git repository initialization

### Infrastructure
- Docker setup for local development
- PostgreSQL 15 with PostGIS extension
- Redis 7 for caching and queuing
- MinIO for S3-compatible file storage

---

## Release Notes

### Version Numbering
- **Major version (1.0.0)**: Breaking API changes, major feature releases
- **Minor version (0.x.0)**: New features, non-breaking changes
- **Patch version (0.0.x)**: Bug fixes, security patches

### Supported Versions
- Latest release: Always supported
- Previous minor version: Security fixes only
- Older versions: Not supported

### Upgrade Path
See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed upgrade instructions.

---

## Links
- [Project Repository](https://github.com/AtlasFSM/NOVAFSM)
- [Documentation](./README.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Verification Report](./VERIFICATION_REPORT.md)
- [Completion Checklist](./COMPLETION_CHECKLIST.md)
