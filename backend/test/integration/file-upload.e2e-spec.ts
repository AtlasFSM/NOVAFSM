import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('File Upload with Presigned URLs (e2e)', () => {
  let app: INestApplication;
  let token: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('should generate presigned upload URL', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/documents/upload-url')
      .set('Authorization', `Bearer ${token}`)
      .send({ fileName: 'document.pdf', contentType: 'application/pdf' })
      .expect(201);

    expect(res.body).toHaveProperty('uploadUrl');
    expect(res.body).toHaveProperty('key');
    expect(res.body.uploadUrl).toContain('https://');
  });

  it('should confirm document upload with idempotency key', async () => {
    const uploadUrlRes = await request(app.getHttpServer())
      .post('/api/v1/documents/upload-url')
      .set('Authorization', `Bearer ${token}`)
      .send({ fileName: 'doc.pdf', contentType: 'application/pdf' });

    const idempotencyKey = 'test-idempotency-' + Date.now();

    // First request
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        name: 'Document',
        type: 'REPORT',
        url: uploadUrlRes.body.key,
      })
      .expect(201);

    // Duplicate request with same idempotency key should return same result
    const res2 = await request(app.getHttpServer())
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        name: 'Document',
        type: 'REPORT',
        url: uploadUrlRes.body.key,
      })
      .expect(201);

    expect(res1.body.id).toBe(res2.body.id);
  });
});
