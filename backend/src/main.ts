import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 3000);
  const host = configService.get<string>('app.host', '0.0.0.0');
  const corsOrigins = configService.get<string[]>('cors.origins', ['http://localhost:3001']);

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'Idempotency-Key',
      'If-Match',
    ],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // OpenAPI/Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NoVaFSM API')
    .setDescription('Multi-tenant Field Service Management Platform API')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token',
      },
      'JWT',
    )
    .addTag('auth', 'Authentication & Authorization')
    .addTag('customers', 'Customer Management')
    .addTag('sites', 'Site Management')
    .addTag('pricing', 'Price Lists & Items')
    .addTag('quotes', 'Quotations/Estimates')
    .addTag('jobs', 'Jobs/Work Orders')
    .addTag('invoices', 'Invoicing & Billing')
    .addTag('inventory', 'Inventory Management')
    .addTag('time-expense', 'Time & Expense Tracking')
    .addTag('files', 'File Management')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'NoVaFSM API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // Serve OpenAPI JSON
  app.getHttpAdapter().get('/docs/openapi.json', (req, res) => {
    res.json(document);
  });

  await app.listen(port, host);

  logger.log(`🚀 NoVaFSM API running on http://${host}:${port}`);
  logger.log(`📚 API Documentation: http://${host}:${port}/docs`);
  logger.log(`📄 OpenAPI JSON: http://${host}:${port}/docs/openapi.json`);
  logger.log(`🌍 Environment: ${configService.get('app.nodeEnv')}`);
}

bootstrap();
