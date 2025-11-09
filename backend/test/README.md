# Backend Testing Documentation

This directory contains the test infrastructure for the NoVaFSM backend API.

## Test Types

### Unit Tests (`*.spec.ts`)
- Located in `src/` directory alongside source files
- Test individual components, services, and controllers in isolation
- Run with: `npm run test`
- Coverage: `npm run test:cov`

### Integration Tests (`*.integration-spec.ts`)
- Located in `test/` directory
- Test multiple components working together
- Use test containers for dependencies (PostgreSQL, Redis)
- Run with: `npm run test:integration`
- Config: `test/jest-integration.config.js`

### E2E Tests (`*.e2e-spec.ts`)
- Located in `test/` directory
- Test complete application flows from API perspective
- Use supertest for HTTP requests
- Run with: `npm run test:e2e`
- Config: `test/jest-e2e.json`

## Directory Structure

```
backend/
├── src/
│   └── **/*.spec.ts         # Unit tests
├── test/
│   ├── *.integration-spec.ts # Integration tests
│   ├── *.e2e-spec.ts        # E2E tests
│   ├── setup-integration.ts  # Integration test setup
│   ├── setup-e2e.ts         # E2E test setup
│   ├── jest-integration.config.js
│   └── jest-e2e.json
└── package.json
```

## Running Tests

```bash
# Unit tests
npm run test               # Run all unit tests
npm run test:watch         # Watch mode
npm run test:cov          # With coverage

# Integration tests
npm run test:integration  # Run all integration tests

# E2E tests
npm run test:e2e          # Run all e2e tests

# All tests
npm run test && npm run test:integration && npm run test:e2e
```

## CI/CD Integration

The GitHub Actions workflows automatically run:
1. Unit tests with coverage reporting
2. Integration tests (using testcontainers)
3. Type checking
4. Linting

## Writing Tests

### Unit Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

### Integration Test Example

```typescript
describe('CustomersModule Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create customer', async () => {
    // Test implementation
  });
});
```

### E2E Test Example

```typescript
describe('/api/v1/customers (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // Setup app
  });

  it('GET /api/v1/customers should return customers', () => {
    return request(app.getHttpServer())
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});
```

## Test Coverage Goals

- **Unit Tests**: >80% coverage
- **Integration Tests**: Critical business flows
- **E2E Tests**: Main user journeys

## Database for Testing

Integration and E2E tests use:
- **Testcontainers**: Automatically spins up PostgreSQL and Redis
- **Separate Test DB**: Each test suite gets isolated database
- **Automatic Cleanup**: Containers removed after tests complete

## Environment Variables

Test environment variables are set in:
- `test/setup-integration.ts` for integration tests
- `test/setup-e2e.ts` for e2e tests

Default test values:
- `NODE_ENV=test`
- `DATABASE_URL=postgresql://test:test@localhost:5432/novafsm_test`
- `REDIS_HOST=localhost`
- `REDIS_PORT=6379`

## Troubleshooting

### Tests timing out
- Increase timeout in jest config: `testTimeout: 30000`
- Check database connections
- Verify testcontainers are starting correctly

### Database connection errors
- Ensure Docker is running (for testcontainers)
- Check DATABASE_URL environment variable
- Verify Prisma schema is migrated

### Import errors
- Run `npm run db:generate` to generate Prisma client
- Check `moduleNameMapper` in jest config
