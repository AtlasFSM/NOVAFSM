# NoVaFSM Architecture

## System Overview

NoVaFSM is a multi-tenant Field Service Management platform built as a **modular monolith**. Each domain is a self-contained NestJS module with its own controllers, services, and DTOs. All modules share a single Prisma-managed PostgreSQL database with row-level tenant isolation.

```
┌─────────────────────────────────────────────────────────┐
│                     Clients                              │
│          Web (Next.js 14)    Mobile (Expo RN)           │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS / WebSocket
┌────────────────────▼────────────────────────────────────┐
│              NestJS API Gateway (port 3000)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │   Auth   │ │   CRM    │ │   Jobs   │ │Invoices  │  │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Inventory│ │  Files   │ │  Audit   │ │  Outbox  │  │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼───────┐        ┌───────▼───────┐
│  PostgreSQL   │        │     Redis     │
│  (Prisma ORM) │        │  (Cache/Bull) │
└───────────────┘        └───────────────┘
```

## Multi-Tenancy Model

Every database entity includes `organizationId` (foreign key to `Organization`). All service methods accept and enforce `organizationId` from the authenticated JWT context.

```typescript
// Pattern enforced across all services
async findAll(organizationId: string): Promise<Entity[]> {
  return this.prisma.entity.findMany({
    where: { organizationId }, // REQUIRED — never omit
  });
}
```

## Authentication Flow

1. `POST /auth/login` → validates credentials → returns `accessToken` (15min) + `refreshToken` (7d)
2. Tokens are RS256 JWT signed with private key, verified with public key
3. `JwtAuthGuard` on all protected routes extracts `organizationId` and `userId` from token
4. `POST /auth/refresh` → rotates refresh token → returns new access token
5. MFA: TOTP-based, enrolled via `/auth/mfa/setup`, verified on login

## Real-time Updates

WebSocket gateway (`/ws`) broadcasts job status changes, dispatch events, and notifications to connected clients. Clients subscribe to their `organizationId` room on connect.

## Outbox Pattern

Long-running or cross-module side effects are published via the Outbox module:
1. Service writes event to `OutboxEvent` table within same transaction
2. Background processor polls and dispatches events to handlers
3. Ensures at-least-once delivery even on process crash

## Frontend Architecture (Next.js 14)

- **App Router** — all pages under `src/app/`
- **Server Components** by default; `'use client'` only for interactive UI
- **API Layer** — all backend calls via `src/lib/api.ts` (typed fetch wrapper)
- **Auth** — JWT stored in httpOnly cookie, refreshed transparently
- **UI Components** — shadcn/ui base components in `src/components/ui/`

## Database Schema (Key Entities)

```
Organization ──< User
Organization ──< Site
Organization ──< Customer ──< Quote ──< Job ──< Invoice
Organization ──< InventoryItem
Job ──< TimeEntry
Job ──< Expense
Job ──< AssetAssignment
```

## Infrastructure

- **Development**: `docker-compose.yml` spins up PostgreSQL + Redis
- **Production**: Kubernetes manifests (planned) in `infrastructure/k8s/`
- **CI/CD**: GitHub Actions (planned) in `.github/workflows/`
- **Container**: Multi-stage Dockerfiles in `backend/` and `web-dashboard/`
