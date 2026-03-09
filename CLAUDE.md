# NoVaFSM - Claude Code Context

## Project Overview

NoVaFSM is a **multi-tenant Field Service Management (FSM) platform** — a production-ready, greenfield ERP-grade system built as a modular monolith.

**Tech Stack:**
- **Backend**: NestJS 10 + Prisma 5 + PostgreSQL 15 + Redis 7
- **Web Dashboard**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- **Mobile**: Expo React Native (offline-first, planned)
- **Infrastructure**: Docker Compose, Kubernetes (planned), GitHub Actions CI/CD (planned)

## Repository Structure

```
NOVAFSM/
├── backend/          # NestJS API server (121 files, ~13k LOC)
│   ├── src/          # Feature modules (auth, users, crm, jobs, invoices, etc.)
│   ├── prisma/       # Database schema and migrations
│   └── scripts/      # Utility scripts
├── web-dashboard/    # Next.js 14 web frontend
│   ├── src/          # Pages, components, hooks, lib
│   └── e2e/          # Playwright E2E tests
├── mobile/           # Expo React Native app (in progress)
├── infrastructure/   # Docker, Kubernetes, CI/CD configs
├── docs/             # Architecture, decisions, runbooks
└── tools/            # Developer scripts and prompts
```

## Key Architecture Decisions

- **Multi-tenancy**: Row-level isolation via `organizationId` on all entities
- **Auth**: RS256 JWT with MFA support, refresh token rotation
- **Real-time**: WebSocket gateway for live job/dispatch updates
- **Outbox Pattern**: Reliable event publishing for inter-module communication
- **API Docs**: OpenAPI/Swagger auto-generated at `/api/docs`

## Development Commands

```bash
# Backend
cd backend && npm run start:dev      # Start dev server (port 3000)
cd backend && npm run test           # Run unit tests
cd backend && npm run test:e2e       # Run E2E tests
cd backend && npx prisma studio      # Open Prisma Studio

# Web Dashboard
cd web-dashboard && npm run dev      # Start dev server (port 3001)
cd web-dashboard && npm run test     # Run Playwright tests
cd web-dashboard && npm run build    # Production build

# Database
docker-compose up -d postgres redis  # Start dependencies
cd backend && npx prisma migrate dev # Run migrations
cd backend && npm run seed           # Seed test data
```

## Backend Modules (Complete)

| Module | Description |
|--------|-------------|
| Auth | JWT login/logout, MFA, refresh tokens |
| Users | User management, roles, permissions |
| Organizations | Multi-tenant org management |
| Sites | Customer site/location management |
| CRM | Customer relationship management |
| Pricing | Service pricing and rate cards |
| Quotes | Quote generation and approval |
| Jobs | Field service job scheduling/dispatch |
| Invoices | Billing and invoice management |
| Inventory | Parts and equipment tracking |
| Time/Expense | Technician time and expense tracking |
| Files | Document and attachment management |
| Assets | Equipment asset registry |
| Documents | Document management system |
| Forms | Digital field forms |
| Audit | Activity audit logging |
| Outbox | Reliable event publishing |

## Web Dashboard Pages (Complete)

All CRUD pages implemented for: Organizations, Sites, Users, Customers, Quotes, Jobs, Invoices, Inventory, Time Entries, Expenses, Assets, Documents, Forms.

## Current Status

- **Backend**: 100% complete — 121 files, 13,059 lines
- **Web Dashboard**: 100% complete — all CRUD pages implemented
- **Mobile**: In progress — Expo project structure created
- **Infrastructure**: Docker Compose complete; Kubernetes/CI-CD pending
- **Tests**: Playwright E2E structure in place; unit tests pending

## Important Constraints

- Always maintain `organizationId` scoping on all database queries
- JWT secrets stored in environment variables (never hardcode)
- Use Prisma transactions for multi-step operations
- Follow NestJS module boundaries — no cross-module direct imports
- shadcn/ui components live in `web-dashboard/src/components/ui/`

## Environment Variables

See `backend/.env.example` and `web-dashboard/.env.example` for required variables.

Key backend vars: `DATABASE_URL`, `REDIS_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`
Key frontend vars: `NEXT_PUBLIC_API_URL`
