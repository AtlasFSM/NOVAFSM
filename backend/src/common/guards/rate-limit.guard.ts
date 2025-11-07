import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

/**
 * Rate Limiting Guard
 *
 * Implements per-tenant rate limiting using Redis
 * Rate limits are configurable per endpoint using @RateLimit decorator
 *
 * Algorithm: Token Bucket with sliding window
 * - Each tenant gets a bucket of tokens
 * - Tokens are consumed on each request
 * - Tokens refill at a constant rate
 * - If bucket is empty, request is rejected with 429 Too Many Requests
 */

export interface RateLimitOptions {
  points: number; // Number of requests allowed
  duration: number; // Time window in seconds
  keyPrefix?: string; // Optional key prefix
}

export const RATE_LIMIT_KEY = 'rate_limit';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private redis: Redis;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    // Initialize Redis connection
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.redis.on('error', (err) => {
      console.error('Redis rate limit connection error:', err);
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get rate limit options from decorator
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    // If no rate limit decorator, allow request
    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip rate limiting for unauthenticated requests (handled by auth guard)
    if (!user || !user.tenantId) {
      return true;
    }

    const { points, duration, keyPrefix = 'ratelimit' } = rateLimitOptions;

    // Generate rate limit key: ratelimit:{tenantId}:{endpoint}
    const endpoint = `${request.method}:${request.route?.path || request.url}`;
    const key = `${keyPrefix}:${user.tenantId}:${endpoint}`;

    try {
      // Check and consume rate limit using Redis
      const result = await this.consumePoints(key, points, duration);

      // Add rate limit headers to response
      const response = context.switchToHttp().getResponse();
      response.setHeader('X-RateLimit-Limit', points);
      response.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));
      response.setHeader('X-RateLimit-Reset', result.resetTime);

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        response.setHeader('Retry-After', retryAfter);

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests. Please try again later.',
            error: 'Too Many Requests',
            retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      // If Redis is down, allow request but log error
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Rate limit Redis error, allowing request:', error);
      return true;
    }
  }

  /**
   * Token bucket algorithm implementation using Redis
   *
   * Returns:
   * - allowed: boolean (whether request is allowed)
   * - remaining: number (tokens remaining)
   * - resetTime: number (timestamp when tokens refill)
   */
  private async consumePoints(
    key: string,
    maxPoints: number,
    durationSeconds: number,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const windowStart = now - durationSeconds * 1000;

    // Use Redis sorted set for sliding window
    // Score is timestamp, value is request ID
    const requestId = `${now}:${Math.random()}`;

    // Lua script for atomic rate limit check
    const luaScript = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local window_start = tonumber(ARGV[2])
      local max_points = tonumber(ARGV[3])
      local duration_ms = tonumber(ARGV[4])
      local request_id = ARGV[5]

      -- Remove old requests outside the time window
      redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

      -- Count requests in current window
      local current_count = redis.call('ZCARD', key)

      if current_count < max_points then
        -- Add new request
        redis.call('ZADD', key, now, request_id)
        -- Set expiration
        redis.call('PEXPIRE', key, duration_ms)
        return {1, max_points - current_count - 1, now + duration_ms}
      else
        -- Rate limit exceeded
        -- Get reset time (oldest request + duration)
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local reset_time = tonumber(oldest[2]) + duration_ms
        return {0, 0, reset_time}
      end
    `;

    const result = (await this.redis.eval(
      luaScript,
      1,
      key,
      now.toString(),
      windowStart.toString(),
      maxPoints.toString(),
      (durationSeconds * 1000).toString(),
      requestId,
    )) as [number, number, number];

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetTime: result[2],
    };
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
