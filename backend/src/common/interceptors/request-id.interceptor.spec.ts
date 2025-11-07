import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { RequestIdInterceptor } from './request-id.interceptor';

describe('RequestIdInterceptor', () => {
  let interceptor: RequestIdInterceptor;

  const mockCallHandler: CallHandler = {
    handle: jest.fn(() => of({ success: true, data: {} })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestIdInterceptor],
    }).compile();

    interceptor = module.get<RequestIdInterceptor>(RequestIdInterceptor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should generate and set request ID header', (done) => {
      const mockSetHeader = jest.fn();
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
          }),
          getResponse: jest.fn().mockReturnValue({
            setHeader: mockSetHeader,
          }),
        }),
      } as unknown as ExecutionContext;

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (result) => {
          expect(mockSetHeader).toHaveBeenCalledWith(
            'X-Request-Id',
            expect.any(String),
          );
          expect(result).toEqual({ success: true, data: {} });
          done();
        },
        error: done,
      });
    });

    it('should use existing X-Request-Id from request headers', (done) => {
      const existingRequestId = 'existing-request-123';
      const mockSetHeader = jest.fn();
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              'x-request-id': existingRequestId,
            },
          }),
          getResponse: jest.fn().mockReturnValue({
            setHeader: mockSetHeader,
          }),
        }),
      } as unknown as ExecutionContext;

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(mockSetHeader).toHaveBeenCalledWith('X-Request-Id', existingRequestId);
          done();
        },
        error: done,
      });
    });

    it('should generate UUID if no request ID provided', (done) => {
      const mockSetHeader = jest.fn();
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
          }),
          getResponse: jest.fn().mockReturnValue({
            setHeader: mockSetHeader,
          }),
        }),
      } as unknown as ExecutionContext;

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const requestId = mockSetHeader.mock.calls[0][1];
          expect(requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
          done();
        },
        error: done,
      });
    });

    it('should attach request ID to request object', (done) => {
      const mockRequest = { headers: {} };
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
          getResponse: jest.fn().mockReturnValue({
            setHeader: jest.fn(),
          }),
        }),
      } as unknown as ExecutionContext;

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect((mockRequest as any).requestId).toBeDefined();
          expect((mockRequest as any).requestId).toMatch(/^[0-9a-f-]+$/i);
          done();
        },
        error: done,
      });
    });
  });
});
