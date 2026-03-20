import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string;
  // details is NEVER sent in production to prevent information leakage
  details?: string;
  timestamp: string;
  path: string;
  requestId?: string;
}

/**
 * Global HTTP Exception Filter
 *
 * Security design:
 *   - Stack traces are NEVER forwarded to HTTP clients.
 *   - Validation field details are only surfaced in non-production.
 *   - Internal error messages (from unhandled errors) are replaced with a
 *     generic message in the response; the real message is logged server-side.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isProd = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    // FIXED: original code was `response<Request, Response>(ctx.getResponse())`
    // which attempted to call the local variable as a generic function —
    // a TypeError crash on every exception path.
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    let details: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (exceptionResponse.message) {
        message = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message.join(', ')
          : exceptionResponse.message;

        // Only include field-level validation details in non-production
        if (!this.isProd) {
          const rawDetails = exceptionResponse.details ?? exceptionResponse.error;
          if (rawDetails) {
            details =
              typeof rawDetails === 'string' ? rawDetails : JSON.stringify(rawDetails);
          }
        }
      }

      errorCode = this.mapStatusToErrorCode(status);
    } else if (exception instanceof Error) {
      // Log the real message server-side but never forward it to clients
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      // message stays 'Internal server error'
    } else {
      this.logger.error(`Unknown exception type: ${JSON.stringify(exception)}`);
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      errorCode,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.headers['x-request-id'] as string | undefined,
    };

    this.logger.warn(
      `HTTP ${status} [${errorCode}] ${request.method} ${request.url} — ${message}`,
    );

    response.status(status).json(errorResponse);
  }

  private mapStatusToErrorCode(status: number): string {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };

    return codeMap[status] ?? 'UNKNOWN_ERROR';
  }
}
