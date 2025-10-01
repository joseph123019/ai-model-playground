// E2E Test Setup
// This file runs before all E2E tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';

// Suppress console warnings during tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  // Filter out known warnings
  const message = args[0]?.toString() || '';
  if (
    message.includes('Prisma') ||
    message.includes('deprecated') ||
    message.includes('experimental')
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Global test timeout
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
  // Allow time for cleanup
  await new Promise(resolve => setTimeout(resolve, 500));
});
