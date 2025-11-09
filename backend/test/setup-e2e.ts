/**
 * Setup file for end-to-end tests
 * This file runs before all e2e tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-e2e-tests';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/novafsm_e2e_test';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.PORT = '3333'; // Use different port for e2e tests

// Extend default test timeout for e2e tests
jest.setTimeout(60000);

// Global test setup
beforeAll(async () => {
  // Any global setup for e2e tests
  console.log('🚀 Starting e2e tests...');
});

afterAll(async () => {
  // Any global cleanup for e2e tests
  console.log('✅ E2E tests completed');
});
