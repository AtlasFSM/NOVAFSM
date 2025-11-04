# NoVaFSM - Multi-Tenant Field Service Management Platform

Production-ready, greenfield ERP-grade Field Service Management system built as a modular monolith.

## 🏗️ Architecture

- **Backend**: NestJS 10 + Prisma 5 + PostgreSQL 15 + Redis 7
- **Web**: Next.js 14 (App Router) + Tailwind + shadcn/ui
- **Mobile**: Expo React Native (offline-first)
- **Infrastructure**: Docker Compose (local), Kubernetes (EKS-ready)

## 📁 Monorepo Structure

```
novafsm/
├── backend/           # NestJS API server
├── web-dashboard/     # Next.js 14 web application
├── mobile/            # Expo React Native mobile app
├── infrastructure/    # Docker Compose, K8s manifests, Terraform
├── .github/          # CI/CD workflows
└── docs/             # Architecture and API documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- AWS CLI (for production deployment)

### Local Development

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd NOVAFSM
```

2. **Start infrastructure services**:
```bash
docker compose -f infrastructure/docker-compose.dev.yml up -d
```

3. **Backend setup**:
```bash
cd backend
npm ci
cp .env.example .env
npm run db:migrate
npm run seed
npm run start:dev
```

4. **Web dashboard**:
```bash
cd web-dashboard
npm ci
cp .env.example .env
npm run dev
```

5. **Mobile app**:
```bash
cd mobile
npm ci
npx expo start
```

### Access Points

- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/docs
- **Web Dashboard**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO Console**: http://localhost:9001

## 🔑 Key Features

### Multi-Tenancy
- Complete data isolation per organization
- Tenant-scoped unique constraints
- Middleware-enforced tenant filtering

### Authentication & Authorization
- RS256 JWT (Access + Refresh tokens)
- JWKS endpoint for token verification
- Role-based access control (SUPER_ADMIN, ADMIN, DISPATCHER, TECHNICIAN, CUSTOMER)
- Optional TOTP MFA
- Token blacklisting via Redis

### Core Modules
1. **CRM** - Customers & Sites management
2. **Pricing** - Price Lists & Items
3. **Quotations** - Draft → Send → Approve → Convert workflow
4. **Jobs** - Work order management with scheduling
5. **Scheduling** - Calendar with conflict detection
6. **Invoicing** - Billing with tax calculation
7. **Inventory** - Basic stock tracking
8. **Time & Expense** - Timesheets and mileage
9. **File Management** - S3 presigned uploads
10. **Audit Logging** - Complete audit trail
11. **Real-time Updates** - WebSocket push notifications

### Mobile Offline-First
- SQLite local database
- Background sync with conflict resolution
- Idempotency-key based deduplication
- Photo capture and signature collection

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test              # Unit tests
npm run test:integration  # Integration tests with Testcontainers
npm run test:cov          # Coverage report (target: 80%+)

# Web E2E tests
cd web-dashboard
npm run test:e2e          # Playwright tests
```

## 🏗️ Production Deployment

### AWS Infrastructure Required
- EKS cluster (Kubernetes 1.28+)
- RDS PostgreSQL 15 with PostGIS
- ElastiCache Redis 7
- S3 buckets for file uploads
- ECR for Docker images
- Route53 + ACM/cert-manager for TLS
- AWS Secrets Manager for secrets

### Deploy to EKS

1. **Configure AWS credentials**:
```bash
aws configure
```

2. **Push images to ECR** (handled by CI/CD):
```bash
# See .github/workflows/ci-cd.yml
```

3. **Apply Kubernetes manifests**:
```bash
kubectl apply -f infrastructure/k8s/namespace.yml
kubectl apply -f infrastructure/k8s/secrets.yml
kubectl apply -f infrastructure/k8s/
```

4. **Verify deployment**:
```bash
kubectl get pods -n production
kubectl rollout status deployment/novafsm-api -n production
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 📊 Monitoring & Observability

- OpenTelemetry instrumentation (HTTP + Prisma)
- Request ID propagation
- Health checks: `/api/v1/health` (liveness), `/api/v1/health/ready` (readiness)
- PII redaction in logs
- 0.1% sampling rate for traces

## 🔒 Security

- Helmet + CSP headers
- CORS whitelist
- Input validation (class-validator)
- Bcrypt password hashing (cost: 12)
- No secrets in code (environment variables only)
- Audit logging for all mutations
- HTTPS enforced in production

## 💰 Multi-Currency Support

- CAD and USD supported
- Tenant-level default currency
- No foreign exchange conversion in MVP

## 📄 License

Proprietary - All Rights Reserved

## 🤝 Support

For issues and questions, contact the development team.

---

**Version**: 1.0.0-MVP
**Last Updated**: 2025-11-03
