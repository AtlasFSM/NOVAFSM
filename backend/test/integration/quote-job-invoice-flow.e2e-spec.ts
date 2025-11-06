import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Quote → Job → Invoice Flow (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let customerId: string;
  let quoteId: string;
  let jobId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    token = res.body.access_token;

    // Create customer
    const customerRes = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Customer', email: 'customer@test.com' });
    customerId = customerRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create quote', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
      })
      .expect(201);

    quoteId = res.body.id;
    expect(res.body.status).toBe('DRAFT');
  });

  it('should convert quote to job', async () => {
    // Approve quote first
    await request(app.getHttpServer())
      .post(`/api/v1/quotes/${quoteId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // Convert to job
    const res = await request(app.getHttpServer())
      .post(`/api/v1/quotes/${quoteId}/convert-to-job`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        scheduledStart: new Date().toISOString(),
        scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    jobId = res.body.id;
    expect(res.body.quoteId).toBe(quoteId);
  });

  it('should create invoice from completed job', async () => {
    // Complete job
    await request(app.getHttpServer())
      .patch(`/api/v1/jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'COMPLETED' })
      .expect(200);

    // Create invoice
    const res = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobId,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    expect(res.body.jobId).toBe(jobId);
    expect(res.body.status).toBe('DRAFT');
  });
});
