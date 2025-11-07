import { SetMetadata } from '@nestjs/common';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../guards/rate-limit.guard';

/**
 * Rate Limit Decorator
 *
 * Apply to controller methods to enforce rate limiting per tenant
 *
 * @param points - Number of requests allowed in the time window
 * @param duration - Time window in seconds
 * @param keyPrefix - Optional key prefix for Redis (default: 'ratelimit')
 *
 * @example
 * // Allow 100 requests per minute
 * @RateLimit({ points: 100, duration: 60 })
 * @Get()
 * async findAll() {
 *   return this.service.findAll();
 * }
 *
 * @example
 * // Allow 10 requests per hour for expensive operations
 * @RateLimit({ points: 10, duration: 3600 })
 * @Post('export')
 * async exportData() {
 *   return this.service.exportData();
 * }
 *
 * @example
 * // Custom key prefix
 * @RateLimit({ points: 5, duration: 60, keyPrefix: 'api:search' })
 * @Get('search')
 * async search() {
 *   return this.service.search();
 * }
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  /**
   * Standard API endpoints: 1000 requests per hour
   */
  STANDARD: { points: 1000, duration: 3600 },

  /**
   * Search endpoints: 100 requests per minute
   */
  SEARCH: { points: 100, duration: 60 },

  /**
   * Expensive operations (exports, reports): 10 requests per hour
   */
  EXPENSIVE: { points: 10, duration: 3600 },

  /**
   * Authentication endpoints: 5 requests per minute
   */
  AUTH: { points: 5, duration: 60 },

  /**
   * Write operations: 200 requests per hour
   */
  WRITE: { points: 200, duration: 3600 },

  /**
   * Read operations: 2000 requests per hour
   */
  READ: { points: 2000, duration: 3600 },

  /**
   * Strict limits for sensitive operations: 3 requests per minute
   */
  STRICT: { points: 3, duration: 60 },
};
