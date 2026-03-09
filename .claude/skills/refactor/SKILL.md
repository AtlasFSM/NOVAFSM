# Refactor Skill

## Purpose
Safely refactor NoVaFSM code while preserving behavior and maintaining NestJS/Next.js patterns.

## Workflow

1. **Read the target file(s)** completely before making changes
2. **Identify refactor scope**: single function, module, or cross-cutting concern
3. **Check for existing tests** that cover the code being changed
4. **Apply refactoring**:
   - Extract repeated logic into shared services or utilities
   - Rename for clarity following project conventions (camelCase services, PascalCase classes)
   - Split large files: controllers >200 LOC, services >500 LOC
5. **Verify no imports are broken** after moving code
6. **Run relevant tests** to confirm behavior is preserved

## NoVaFSM Conventions

- Services: `*.service.ts` — business logic only
- Controllers: `*.controller.ts` — HTTP routing and DTO validation only
- DTOs: `*.dto.ts` — class-validator decorated request/response shapes
- Entities/Models: defined in `prisma/schema.prisma`
- Frontend hooks: `use*.ts` in `web-dashboard/src/hooks/`
- Frontend components: PascalCase `.tsx` files
