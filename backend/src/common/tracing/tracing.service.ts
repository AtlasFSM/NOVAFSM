import { Injectable } from '@nestjs/common';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class TracingService {
  private tracer = trace.getTracer('novafsm-api');

  startSpan(name: string, attributes?: Record<string, any>) {
    return this.tracer.startSpan(name, { attributes });
  }

  recordException(span: any, error: Error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
  }

  async traceAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const span = this.startSpan(name);
    try {
      const result = await fn();
      span.end();
      return result;
    } catch (error) {
      this.recordException(span, error as Error);
      span.end();
      throw error;
    }
  }
}
