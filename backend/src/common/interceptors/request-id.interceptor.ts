import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID Interceptor
 * Generates or extracts request ID for distributed tracing
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get or generate request ID
    const requestId = request.headers['x-request-id'] || uuidv4();

    // Attach to request for downstream use
    request.requestId = requestId;

    // Add to response headers
    response.setHeader('X-Request-Id', requestId);

    return next.handle();
  }
}
