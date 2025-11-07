/**
 * Authentication utilities for server-side auth checks
 */

import { cookies } from 'next/headers';

/**
 * Get authentication token from cookies
 * @returns The auth token if present, null otherwise
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token');
  return token?.value || null;
}

/**
 * Check if user is authenticated
 * @returns True if user has a valid token
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}

/**
 * Get user from token (stub - implement JWT decode in production)
 * @returns User payload from JWT
 */
export async function getCurrentUser(): Promise<any | null> {
  const token = await getAuthToken();
  if (!token) return null;

  // TODO: Implement JWT decode and validation
  // For now, return a mock user
  return { id: '1', email: 'user@example.com', role: 'CUSTOMER' };
}
