// Jest setup for server-side tests (API routes, services, database)

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key'

// Mock better-sqlite3 for tests
jest.mock('better-sqlite3', () => {
  const mockDb = {
    prepare: jest.fn().mockReturnThis(),
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    close: jest.fn(),
    exec: jest.fn(),
  }
  
  return jest.fn(() => mockDb)
})

// Global test utilities for server tests
global.console = {
  ...console,
  // Suppress logs during tests unless they're errors
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error, // Keep errors visible
}

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})