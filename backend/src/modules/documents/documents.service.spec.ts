import { Test } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  const mockPrisma = {
    document: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };
  const mockFiles = { generatePresignedUploadUrl: jest.fn(), deleteFile: jest.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FilesService, useValue: mockFiles },
      ],
    }).compile();
    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  it('should generate upload URL', async () => {
    mockFiles.generatePresignedUploadUrl.mockResolvedValue({ uploadUrl: 'https://s3.url', key: 'doc.pdf' });
    const result = await service.getUploadUrl('t1', { fileName: 'doc.pdf', contentType: 'application/pdf' });
    expect(result.uploadUrl).toBeDefined();
  });

  it('should create document record', async () => {
    mockPrisma.document.create.mockResolvedValue({ id: 'd1', name: 'Document' });
    const result = await service.create('t1', { name: 'Document', type: 'INVOICE', url: 'https://s3.url' });
    expect(result.id).toBe('d1');
  });

  it('should delete document and file', async () => {
    mockPrisma.document.findFirst.mockResolvedValue({ id: 'd1', url: 'https://s3.url/key' });
    mockPrisma.document.delete.mockResolvedValue({ id: 'd1' });
    mockFiles.deleteFile.mockResolvedValue(undefined);
    await service.remove('t1', 'd1');
    expect(mockFiles.deleteFile).toHaveBeenCalled();
  });
});
