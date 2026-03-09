# Prompt: Add a New CRUD Module

Use this prompt template when asking Claude to implement a new feature module in NoVaFSM.

---

## Prompt Template

```
Add a new `<MODULE_NAME>` module to the NoVaFSM backend following the existing patterns.

### Requirements:
1. **Prisma Model** — add to `backend/prisma/schema.prisma`:
   - Include `id`, `organizationId`, `createdAt`, `updatedAt`
   - Fields: <LIST YOUR FIELDS>
   - Relations: <LIST RELATIONS>

2. **NestJS Module** — create `backend/src/<module>/`:
   - `<module>.module.ts` — imports PrismaModule, declares controller + service
   - `<module>.service.ts` — CRUD methods, all scoped by `organizationId`
   - `<module>.controller.ts` — REST endpoints: GET /, GET /:id, POST /, PATCH /:id, DELETE /:id
   - `dto/create-<module>.dto.ts` — class-validator decorated
   - `dto/update-<module>.dto.ts` — PartialType of create DTO

3. **Register** the module in `backend/src/app.module.ts`

4. **Web Dashboard Page** — create `web-dashboard/src/app/(dashboard)/<module>/page.tsx`:
   - Data table with columns for key fields
   - Create/Edit modal using shadcn Dialog + react-hook-form
   - Delete confirmation dialog

Follow the exact same patterns as the existing `jobs` or `customers` modules.
```

---

## Example Usage

```
Add a new `maintenance-schedules` module to NoVaFSM.

Prisma Model fields:
- name: String
- description: String?
- frequency: Enum (DAILY, WEEKLY, MONTHLY, QUARTERLY, ANNUAL)
- nextDueDate: DateTime
- assetId: String (relation to Asset)
- assignedToId: String? (relation to User)
```
