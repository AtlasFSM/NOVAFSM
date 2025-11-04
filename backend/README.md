# NoVaFSM Backend API

Multi-tenant Field Service Management backend built with NestJS, Prisma, PostgreSQL, and Redis.

## Tech Stack

- **Framework**: NestJS 10 with TypeScript 5 (strict mode)
- **Database**: PostgreSQL 15 + PostGIS
- **ORM**: Prisma 5
- **Cache/Queues**: Redis 7 + BullMQ
- **Authentication**: RS256 JWT with JWKS, optional MFA (TOTP)
- **WebSockets**: Socket.IO for real-time updates
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

## Features

- ✅ Multi-tenant data isolation (tenant middleware)
- ✅ RS256 JWT authentication with refresh tokens
- ✅ Role-based access control (RBAC)
- ✅ MFA support (TOTP/Authenticator apps)
- ✅ Comprehensive modules: Auth, Users, CRM, Pricing, Quotes, Jobs, Invoicing, Inventory, Time & Expense
- ✅ Real-time WebSocket notifications
- ✅ Sequential document numbering (Q-YYYY-######)
- ✅ Tax calculation engine
- ✅ S3/MinIO file management with presigned URLs
- ✅ Audit logging
- ✅ Event outbox pattern with BullMQ
- ✅ Health checks (liveness/readiness)
- ✅ Rate limiting
- ✅ Request ID propagation

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local infrastructure)
- OpenSSL (for generating JWT keys)

## Quick Start

### 1. Install Dependencies

```bash
npm ci
```

### 2. Start Infrastructure

```bash
cd ..
docker compose -f infrastructure/docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL 15 + PostGIS on port 5432
- Redis 7 on port 6379
- MinIO on ports 9000 (API) and 9001 (Console)

### 3. Generate RSA Keys for JWT

```bash
chmod +x scripts/generate-keys.sh
./scripts/generate-keys.sh
```

Copy the output keys to your `.env` file.

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` (from step 3)
- `DATABASE_URL` (default should work with Docker Compose)
- Other settings as needed

### 5. Run Database Migrations

```bash
npm run db:migrate:dev
```

This creates all tables based on the Prisma schema.

### 6. Seed Database

```bash
npm run seed
```

This creates 2 demo tenants with:
- 40 customers (20 per tenant)
- 20 quotes, 30 jobs, 10 invoices
- Users with varying roles
- Price lists and inventory

**Demo Credentials** (password: `Password123!`):

**Tenant 1 - Acme Field Services (CAD)**
- Admin: `admin@acme.ca`
- Dispatcher: `dispatcher@acme.ca`
- Technician 1: `tech1@acme.ca`
- Technician 2: `tech2@acme.ca`

**Tenant 2 - Coastal Services LLC (USD)**
- Admin: `admin@coastal-services.com`
- Dispatcher: `dispatch@coastal-services.com`
- Technician: `tech1@coastal-services.com`

### 7. Start Development Server

```bash
npm run start:dev
```

The API will be available at:
- **API Base**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/docs/openapi.json
- **Health Check**: http://localhost:3000/api/v1/health
- **JWKS Endpoint**: http://localhost:3000/api/v1/auth/jwks

## Project Structure

```
backend/
├── src/
│   ├── modules/              # Feature modules
│   │   ├── auth/            # Authentication (JWT, MFA, refresh tokens)
│   │   ├── users/           # User management
│   │   ├── customers/       # CRM (Customers + Sites)
│   │   ├── pricing/         # Price Lists & Items
│   │   ├── quotes/          # Quotations with workflow
│   │   ├── jobs/            # Jobs/Work Orders + Scheduling
│   │   ├── invoices/        # Invoicing & Billing
│   │   ├── inventory/       # Inventory management
│   │   ├── time-expense/    # Time & Expense tracking
│   │   ├── files/           # S3/MinIO file management
│   │   ├── audit/           # Audit logging
│   │   ├── outbox/          # Event outbox (BullMQ)
│   │   └── health/          # Health checks
│   ├── common/              # Shared utilities
│   │   ├── decorators/      # @CurrentUser, @Roles, @Public
│   │   ├── guards/          # JWT, Roles guards
│   │   ├── interceptors/    # Tenant, RequestID
│   │   ├── filters/         # Global exception filter
│   │   └── prisma/          # Prisma service with tenant middleware
│   ├── config/              # Configuration
│   ├── app.module.ts        # Root module
│   └── main.ts              # Bootstrap
├── prisma/
│   ├── schema.prisma        # Database schema (17 models)
│   ├── migrations/          # Database migrations
│   └── seed.ts              # Seed script
├── test/                    # Tests
└── scripts/                 # Utility scripts
```

## API Modules

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new organization
- `POST /login` - Login with MFA support
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout and blacklist token
- `GET /me` - Get current user
- `POST /mfa/enable` - Enable MFA
- `POST /mfa/verify` - Verify MFA code
- `POST /mfa/disable` - Disable MFA
- `GET /jwks` - Get JWKS for token verification

### Users (`/api/v1/users`)
- Full CRUD for user management
- Role-based permissions
- Password management

### Customers (`/api/v1/customers`)
- CRUD operations
- Search functionality
- Import/export stubs

### Sites (`/api/v1/customers/:customerId/sites`)
- Manage customer sites
- Location-based services

### Pricing (`/api/v1/pricing`)
- **Price Lists**: `/price-lists`
- **Price Items**: `/price-items`
- Support for multiple currencies (CAD, USD)

### Quotes (`/api/v1/quotes`)
- Create with auto-numbering
- Workflow: DRAFT → SENT → APPROVED/REJECTED
- Tax calculation
- Convert to Job or Invoice
- Optimistic locking (version control)

### Jobs (`/api/v1/jobs`)
- Work order management
- Technician assignment with WebSocket notifications
- Conflict detection
- Check-in/check-out with location
- Status workflow

### Invoices (`/api/v1/invoices`)
- Create from jobs or quotes
- PDF generation (stub)
- Payment tracking

### Inventory (`/api/v1/inventory`)
- Stock management
- Usage tracking per job

### Time & Expense (`/api/v1/time-entries`, `/api/v1/expense-entries`)
- Time tracking per job
- Expense recording with receipts

### Files (`/api/v1/files`)
- Presigned upload/download URLs
- S3/MinIO integration

## Development

### Run Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# Coverage
npm run test:cov
```

### Lint & Format

```bash
npm run lint
npm run format
```

### Type Check

```bash
npm run typecheck
```

### Database Operations

```bash
# Generate Prisma Client
npm run db:generate

# Create new migration
npm run db:migrate:dev

# Deploy migrations (production)
npm run db:migrate

# Open Prisma Studio (GUI)
npm run db:studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Multi-Tenancy

All database queries are automatically filtered by `tenantId` using Prisma middleware. The tenant context is set via the `TenantInterceptor` which extracts `tenantId` from the JWT payload.

**Key Points:**
- Every model (except Organization and TokenBlacklist) has a `tenantId` field
- Unique constraints include `tenantId` (e.g., `@@unique([tenantId, email])`)
- Middleware injects `tenantId` on all read/write operations
- Cross-tenant queries are impossible without explicit bypass (for SUPER_ADMIN)

## Security

- **Password Hashing**: bcrypt with 12 rounds
- **JWT**: RS256 algorithm with public key verification
- **MFA**: TOTP (compatible with Google Authenticator, Authy, etc.)
- **Refresh Tokens**: Hashed and stored, blacklist on logout
- **Rate Limiting**: Configurable per endpoint
- **CORS**: Whitelist only
- **Helmet**: CSP headers enabled
- **Input Validation**: class-validator on all DTOs
- **Audit Logging**: All mutations logged with user context

## WebSocket Events

The Jobs module emits real-time events via Socket.IO:

- `job.assigned` - When a technician is assigned
- `job.updated` - When job status changes
- `technician.location` - Location updates (future)

Clients join rooms:
- `tenant:${tenantId}` - Tenant-wide events
- `tech:${technicianId}` - Technician-specific events

## Environment Variables

See `.env.example` for all available configuration options.

Key settings:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` - RS256 key pair
- `S3_BUCKET`, `S3_ENDPOINT` - S3/MinIO configuration
- `CORS_ORIGINS` - Allowed origins (comma-separated)
- `BCRYPT_ROUNDS` - Password hashing cost (default: 12)

## Production Deployment

### Docker Build

```bash
docker build -t novafsm-api:latest .
```

### Environment

- Use AWS Secrets Manager for sensitive values
- Set `NODE_ENV=production`
- Configure RDS (PostgreSQL), ElastiCache (Redis), S3
- Set up CloudWatch for logs
- Enable OpenTelemetry exporter

### Health Checks

- **Liveness**: `GET /api/v1/health` (always returns 200 if app is running)
- **Readiness**: `GET /api/v1/health/ready` (checks DB connection)

### Migrations

Run migrations before deploying:

```bash
npm run db:migrate
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View logs
docker logs novafsm-postgres

# Test connection
psql postgresql://novafsm:novafsm_dev_pass@localhost:5432/novafsm
```

### Redis Connection Issues

```bash
# Check if Redis is running
docker ps | grep redis

# Test connection
redis-cli -h localhost -p 6379 ping
```

### MinIO Access Issues

```bash
# Access MinIO Console
open http://localhost:9001

# Login: minioadmin / minioadmin
# Ensure bucket 'novafsm-uploads' exists
```

## License

Proprietary - All Rights Reserved
