/**
 * Setup file for integration tests
 * This file runs before all integration tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/novafsm_test';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';

// Extend default test timeout for integration tests
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Any global setup for integration tests
  console.log('🚀 Starting integration tests...');
});

afterAll(async () => {
  // Any global cleanup for integration tests
  console.log('✅ Integration tests completed');
});
