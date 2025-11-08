import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/modules/prisma/prisma.service';

describe('Auth Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
        });
    });

    it('should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'wrong' })
        .expect(401);
    });

    it('should validate request body', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'invalid-email' })
        .expect(400);
    });
  });

  describe('/api/v1/auth/me (GET)', () => {
    it('should return current user with valid token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@test.com', password: 'password123' });

      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.access_token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('role');
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });
  });
});
