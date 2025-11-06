import { cookies } from 'next/headers';

/**
 * Server-side function to get the authentication token
 * This works in Server Components and API Routes
 */
export async function getAuthToken(): Promise<string | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value || null;
  return token;
}

/**
 * Server-side function to get user from token
 * In a real app, you'd decode the JWT here
 */
export async function getUserFromToken(token: string | null) {
  if (!token) return null;

  // TODO: Decode JWT and return user data
  // For now, return a mock structure
  try {
    // You would typically decode the JWT here
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // return decoded;
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}
