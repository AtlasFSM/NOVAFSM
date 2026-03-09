# Prompt: Write Tests for a Module

Use this prompt template to generate tests for an existing NoVaFSM module.

---

## Prompt Template

```
Write comprehensive tests for the `<MODULE_NAME>` module in NoVaFSM.

### Test Types Needed:

1. **Unit Tests** (`backend/src/<module>/<module>.service.spec.ts`):
   - Mock `PrismaService` using jest.mock
   - Test each service method: findAll, findOne, create, update, remove
   - Verify `organizationId` is always included in where clauses
   - Test error cases: NotFoundException for missing records

2. **Controller Tests** (`backend/src/<module>/<module>.controller.spec.ts`):
   - Use NestJS `Test.createTestingModule`
   - Mock the service layer
   - Test HTTP status codes and response shapes

3. **E2E Tests** (if applicable, `web-dashboard/e2e/<module>.spec.ts`):
   - Use Playwright
   - Test: load list page, create new record, edit record, delete record
   - Use data-testid attributes for selectors

Follow the NestJS testing patterns. Use `@nestjs/testing` and Jest.
```

---

## Key Testing Patterns

```typescript
// Service test pattern
describe('<Module>Service', () => {
  let service: <Module>Service;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        <Module>Service,
        { provide: PrismaService, useValue: mockDeep<PrismaClient>() },
      ],
    }).compile();
    service = module.get(<Module>Service);
    prisma = module.get(PrismaService);
  });

  it('findAll scopes by organizationId', async () => {
    prisma.<entity>.findMany.mockResolvedValue([]);
    await service.findAll('org-123');
    expect(prisma.<entity>.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-123' },
    });
  });
});
```
