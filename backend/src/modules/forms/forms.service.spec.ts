import { Test } from '@nestjs/testing';
import { FormsService } from './forms.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FormsService', () => {
  let service: FormsService;
  const mockPrisma = {
    form: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    formTemplate: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [FormsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<FormsService>(FormsService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('should create form from template', async () => {
    mockPrisma.formTemplate.findFirst.mockResolvedValue({ id: 'tmpl1', fields: [] });
    mockPrisma.form.create.mockResolvedValue({ id: 'f1', status: 'DRAFT' });
    const result = await service.create('t1', { templateId: 'tmpl1' });
    expect(result.status).toBe('DRAFT');
  });

  it('should submit form', async () => {
    mockPrisma.form.findFirst.mockResolvedValue({ id: 'f1', status: 'DRAFT' });
    mockPrisma.form.update.mockResolvedValue({ id: 'f1', status: 'SUBMITTED' });
    const result = await service.submit('t1', 'f1');
    expect(result.status).toBe('SUBMITTED');
  });
});
