# ADR 002: Row-Level Multi-Tenancy

## Status
Accepted

## Context
NoVaFSM must serve multiple organizations (tenants) from a single deployment, with strict data isolation between tenants.

## Decision
Use **row-level multi-tenancy**: all entities include an `organizationId` column, and all queries filter by `organizationId` extracted from the authenticated user's JWT.

## Rationale
- Simpler than schema-per-tenant or database-per-tenant
- Single schema to migrate and maintain
- Prisma ORM makes it straightforward to enforce at the service layer
- Sufficient isolation for B2B SaaS at this scale

## Consequences
- Every service method must include `organizationId` in its `where` clause — requires discipline and code review vigilance
- A missing `organizationId` filter is a data leak bug — mitigated by `JwtAuthGuard` always populating it from the token
- Cross-tenant reports (admin analytics) require a separate privileged service role
