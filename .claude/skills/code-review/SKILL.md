# Code Review Skill

## Purpose
Perform structured code reviews for NoVaFSM pull requests and changesets.

## Workflow

1. **Read changed files** using Read and Grep tools
2. **Check for security issues**:
   - SQL injection via raw Prisma queries
   - Missing `organizationId` scoping on DB queries
   - Hardcoded secrets or credentials
   - Missing input validation (class-validator decorators)
3. **Check for architecture violations**:
   - Cross-module imports bypassing NestJS module system
   - Business logic in controllers (should be in services)
   - Missing error handling / HTTP exception filters
4. **Check frontend patterns**:
   - Server vs client component usage (`'use client'` directive)
   - API calls going through `/api` routes or direct fetch
   - Proper loading and error states
5. **Summarize findings** with file:line references and severity (High/Medium/Low)

## Output Format

```
## Code Review Summary

### High Priority
- [file:line] Issue description

### Medium Priority
- [file:line] Issue description

### Low Priority / Suggestions
- [file:line] Suggestion
```
