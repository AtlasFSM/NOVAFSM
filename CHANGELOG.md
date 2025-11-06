# Changelog

All notable changes to the NoVaFSM project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-15

### Added

#### Backend
- Multi-tenant architecture with tenant isolation at database level
- RESTful API with OpenAPI 3.0 documentation
- JWT-based authentication with refresh tokens
- RBAC with roles: ADMIN, DISPATCHER, TECHNICIAN, CUSTOMER
- Modules: Auth, Users, Organizations, Customers, Sites, Jobs, Quotes, Invoices, Inventory, Assets, Documents, Forms, Pricing, Schedule, Time & Expense
- Real-time updates via WebSocket (Socket.IO)
- File upload with S3 presigned URLs and idempotency keys
- Background job processing with Bull/BullMQ
- Optimistic locking for conflict detection (version field)
- Audit logging for compliance
- Rate limiting and security headers (Helmet)
- Comprehensive test suite: 40+ unit tests, 5 integration tests (≥80% coverage)

#### Web Dashboard
- Next.js 14 App Router with TypeScript
- Responsive UI with Shadcn/UI components and Tailwind CSS
- Pages: Dashboard, Customers, Jobs, Quotes, Invoices, Schedule, Inventory, Assets, Documents, Forms, Pricing, Time & Expense, Technicians, Sites, Organizations, Settings
- Real-time job status updates
- Kanban board for job management
- Interactive scheduling with conflict detection
- Quote-to-Job-to-Invoice workflow
- Customer portal for viewing quotes/invoices
- Role-based access control
- Dark mode support

#### Mobile App
- React Native with Expo SDK 51
- Offline-first architecture with SQLite
- Background sync with idempotency
- Screens: Jobs, Assets, Documents, Forms, Map, Profile
- Photo capture and document upload
- Digital signature collection
- Time tracking with clock in/out
- Offline queue for operations
- Network status indicators
- Geolocation for job check-in/out

#### Infrastructure
- AWS Terraform IaC for production deployment
- EKS cluster with auto-scaling (2-10 nodes)
- RDS PostgreSQL 15 with multi-AZ, automated backups
- ElastiCache Redis for caching and sessions
- S3 for file uploads with versioning
- ECR for container images
- Secrets Manager for credentials
- VPC with NAT gateways, public/private subnets
- CloudWatch logging and monitoring

#### Documentation
- Comprehensive README with architecture overview
- API documentation (OpenAPI/Swagger)
- Entity Relationship Diagram (ERD)
- Sequence diagrams for key flows
- Contributing guidelines
- Terraform deployment guide
- API versioning strategy

### Security
- All passwords hashed with bcrypt
- Encryption at rest (RDS, S3, Redis)
- Transit encryption (HTTPS, Redis TLS)
- Security headers (Helmet)
- CORS configuration
- Rate limiting
- SQL injection prevention (Prisma ORM)
- XSS protection
- CSRF tokens

### Performance
- Database indexing on frequently queried fields
- Redis caching for frequently accessed data
- Background job processing for heavy operations
- Optimistic locking to prevent race conditions
- Connection pooling
- CDN-ready static assets

## [Unreleased]

### Planned
- Mobile app iOS/Android native builds
- Advanced reporting and analytics
- Email notifications
- SMS notifications
- Payment gateway integration (Stripe)
- PDF generation for quotes/invoices
- Advanced scheduling optimization
- Mobile offline maps
- Push notifications
- Multi-language support (i18n)

[1.0.0]: https://github.com/AtlasFSM/NOVAFSM/releases/tag/v1.0.0
