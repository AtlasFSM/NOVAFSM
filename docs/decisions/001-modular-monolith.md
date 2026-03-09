# ADR 001: Modular Monolith over Microservices

## Status
Accepted

## Context
NoVaFSM needs a backend architecture that supports multiple business domains (CRM, Jobs, Invoices, Inventory, etc.) while remaining maintainable by a small team and deployable as a single unit during early stages.

## Decision
Use a **modular monolith** with NestJS modules as domain boundaries instead of separate microservices.

## Rationale
- Single deployment unit simplifies DevOps for early-stage product
- NestJS module system enforces domain boundaries at code level
- Prisma transactions work naturally across domains in a single process
- Can extract modules to microservices later if scaling demands it

## Consequences
- All modules share the same database and process
- Horizontal scaling requires running multiple instances behind a load balancer
- Module boundary violations are caught by code review, not by network isolation
