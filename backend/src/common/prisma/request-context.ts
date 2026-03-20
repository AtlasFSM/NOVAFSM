import { AsyncLocalStorage } from 'async_hooks';

/**
 * Per-request AsyncLocalStorage store.
 *
 * Solves the race condition where PrismaService stored tenantId as a singleton
 * class property: in a concurrent Node.js server, Request A could overwrite
 * Request B's tenantId, causing cross-tenant data access.
 *
 * AsyncLocalStorage binds a value to an async execution context (like a
 * thread-local in other languages) so each concurrent request has its own
 * isolated store regardless of how many parallel requests are in flight.
 */
export interface RequestStore {
  tenantId: string | null;
}

export const requestContext = new AsyncLocalStorage<RequestStore>();

/**
 * Helper: get the tenantId for the current async context.
 * Returns null if called outside of a request (e.g. background jobs).
 */
export function getCurrentTenantId(): string | null {
  return requestContext.getStore()?.tenantId ?? null;
}
