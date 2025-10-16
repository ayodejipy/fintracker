import { PrismaClient } from '@prisma/client'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

// Create a test database client using PostgreSQL
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL?.replace('personal_finance_db', 'personal_finance_test_db'),
    },
  },
})

// Counter for unique identifiers
let testCounter = 0

// Test user factory
export async function createTestUser(overrides: Partial<any> = {}) {
  testCounter++
  return await testDb.user.create({
    data: {
      email: `test-${testCounter}-${Date.now()}@example.com`,
      name: 'Test User',
      password: 'hashedpassword123', // Mock hashed password for tests
      monthlyIncome: 500000,
      currency: 'NGN',
      ...overrides,
    },
  })
}

// Test transaction factory
export async function createTestTransaction(userId: string, overrides: Partial<any> = {}) {
  return await testDb.transaction.create({
    data: {
      userId,
      amount: 10000,
      category: 'food',
      description: 'Test transaction',
      date: new Date(),
      type: 'expense',
      ...overrides,
    },
  })
}

// Test loan factory
export async function createTestLoan(userId: string, overrides: Partial<any> = {}) {
  return await testDb.loan.create({
    data: {
      userId,
      name: 'Test Loan',
      initialAmount: 100000,
      currentBalance: 80000,
      monthlyPayment: 10000,
      interestRate: 0.15,
      startDate: new Date(),
      ...overrides,
    },
  })
}

// Test budget factory
export async function createTestBudget(userId: string, overrides: Partial<any> = {}) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  return await testDb.budget.create({
    data: {
      userId,
      category: 'food',
      monthlyLimit: 50000,
      currentSpent: 0,
      month: currentMonth,
      ...overrides,
    },
  })
}

// Test savings goal factory
export async function createTestSavingsGoal(userId: string, overrides: Partial<any> = {}) {
  return await testDb.savingsGoal.create({
    data: {
      userId,
      name: 'Test Goal',
      targetAmount: 100000,
      currentAmount: 0,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      monthlyContribution: 10000,
      ...overrides,
    },
  })
}

// Database cleanup utilities - proper order to handle foreign key constraints
export async function cleanupDatabase() {
  try {
    // Delete in reverse order of dependencies to avoid foreign key constraint violations
    await testDb.transaction.deleteMany()
    await testDb.loan.deleteMany()
    await testDb.budget.deleteMany()
    await testDb.savingsGoal.deleteMany()
    await testDb.user.deleteMany()
  }
  catch (error) {
    console.warn('Cleanup warning:', error)
    // If cleanup fails, try to continue - this might happen if tables are already empty
  }
}

// Reset the test counter
export function resetTestCounter() {
  testCounter = 0
}

// Setup and teardown hooks
export function setupTestDatabase() {
  beforeAll(async () => {
    // Connect to test database
    await testDb.$connect()
    // Initial cleanup
    await cleanupDatabase()
    resetTestCounter()
  })

  beforeEach(async () => {
    // Clean up before each test
    await cleanupDatabase()
  })

  afterEach(async () => {
    // Clean up after each test
    await cleanupDatabase()
  })

  afterAll(async () => {
    // Final cleanup and disconnect
    await cleanupDatabase()
    await testDb.$disconnect()
  })
}
