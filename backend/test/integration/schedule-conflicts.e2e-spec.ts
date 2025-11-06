import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Schedule Conflict Detection (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let technicianId: string;
  let customerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'dispatcher@test.com', password: 'password123' });
    token = res.body.access_token;

    const userRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    technicianId = userRes.body.id;

    const customerRes = await request(app.getHttpServer())
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Customer', email: 'customer@test.com' });
    customerId = customerRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should detect overlapping job schedules', async () => {
    const start = new Date();
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    // Create first job
    await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        title: 'Job 1',
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        assignedTechnicianId: technicianId,
      })
      .expect(201);

    // Try to create overlapping job
    const conflictStart = new Date(start.getTime() + 30 * 60 * 1000);
    const conflictEnd = new Date(end.getTime() + 30 * 60 * 1000);

    await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        title: 'Job 2',
        scheduledStart: conflictStart.toISOString(),
        scheduledEnd: conflictEnd.toISOString(),
        assignedTechnicianId: technicianId,
      })
      .expect(409); // Conflict
  });
});
