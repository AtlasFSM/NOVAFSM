import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/prisma/prisma.service';

describe('Multi-Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenant1Token: string;
  let tenant2Token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Get tokens for two different tenants
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'tenant1@test.com', password: 'password123' });
    tenant1Token = res1.body.access_token;

    const res2 = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'tenant2@test.com', password: 'password123' });
    tenant2Token = res2.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should isolate customers between tenants', async () => {
    // Create customer in tenant 1
    const customer1 = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${tenant1Token}`)
      .send({ name: 'Tenant 1 Customer', email: 'customer1@test.com' })
      .expect(201);

    // Tenant 2 should not see tenant 1's customer
    const customers = await request(app.getHttpServer())
      .get('/api/v1/customers')
      .set('Authorization', `Bearer ${tenant2Token}`)
      .expect(200);

    expect(customers.body.data.find((c: any) => c.id === customer1.body.id)).toBeUndefined();
  });

  it('should prevent cross-tenant data access', async () => {
    // Try to access tenant 1 customer with tenant 2 token
    await request(app.getHttpServer())
      .get('/api/v1/customers/tenant1-customer-id')
      .set('Authorization', `Bearer ${tenant2Token}`)
      .expect(404);
  });
});
