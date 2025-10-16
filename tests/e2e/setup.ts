import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { db } from '~/utils/database'

// Test database setup
beforeAll(async () => {
  // Ensure we're using test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Tests must use a test database')
  }

  // Clean and setup test database
  await setupTestDatabase()
})

afterAll(async () => {
  // Clean up test database
  await cleanupTestDatabase()
  await db.$disconnect()
})

beforeEach(async () => {
  // Clean data before each test
  await cleanupTestData()
})

afterEach(async () => {
  // Clean data after each test
  await cleanupTestData()
})

// Database setup functions
async function setupTestDatabase() {
  try {
    // Create test tables if they don't exist
    await db.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`

    // Reset sequences
    await db.$executeRaw`
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
        LOOP
          EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
        END LOOP;
      END $$;
    `
  }
  catch (error) {
    console.warn('Database setup warning:', error)
  }
}

async function cleanupTestDatabase() {
  try {
    // Drop all test data
    await cleanupTestData()
  }
  catch (error) {
    console.warn('Database cleanup warning:', error)
  }
}

async function cleanupTestData() {
  try {
    // Delete in correct order to respect foreign key constraints
    await db.notification.deleteMany()
    await db.notificationPreferences.deleteMany()
    await db.transaction.deleteMany()
    await db.budget.deleteMany()
    await db.loan.deleteMany()
    await db.savingsGoal.deleteMany()
    await db.user.deleteMany()
  }
  catch (error) {
    console.warn('Data cleanup warning:', error)
  }
}

// Test data factories
export async function createTestUser(overrides: Partial<any> = {}) {
  const userData = {
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    password: 'hashedpassword123',
    monthlyIncome: 100000,
    currency: 'NGN',
    ...overrides,
  }

  return await db.user.create({
    data: userData,
  })
}

export async function createTestTransaction(userId: string, overrides: Partial<any> = {}) {
  const transactionData = {
    userId,
    amount: 5000,
    category: 'food',
    description: 'Test transaction',
    date: new Date(),
    type: 'expense',
    ...overrides,
  }

  return await db.transaction.create({
    data: transactionData,
  })
}

export async function createTestBudget(userId: string, overrides: Partial<any> = {}) {
  const budgetData = {
    userId,
    category: 'food',
    monthlyLimit: 20000,
    currentSpent: 5000,
    month: '2024-01',
    ...overrides,
  }

  return await db.budget.create({
    data: budgetData,
  })
}

export async function createTestLoan(userId: string, overrides: Partial<any> = {}) {
  const loanData = {
    userId,
    name: 'Test Loan',
    initialAmount: 100000,
    currentBalance: 80000,
    monthlyPayment: 10000,
    interestRate: 12.5,
    startDate: new Date('2024-01-01'),
    ...overrides,
  }

  return await db.loan.create({
    data: loanData,
  })
}

export async function createTestSavingsGoal(userId: string, overrides: Partial<any> = {}) {
  const futureDate = new Date()
  futureDate.setFullYear(futureDate.getFullYear() + 1)

  const savingsGoalData = {
    userId,
    name: 'Test Savings Goal',
    targetAmount: 500000,
    currentAmount: 50000,
    targetDate: futureDate,
    monthlyContribution: 25000,
    ...overrides,
  }

  return await db.savingsGoal.create({
    data: savingsGoalData,
  })
}

// Test utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const generateTestEmail = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`

export const generateTestData = {
  user: (overrides = {}) => ({
    email: generateTestEmail(),
    name: 'Test User',
    password: 'TestPassword123!',
    monthlyIncome: 100000,
    currency: 'NGN',
    ...overrides,
  }),

  transaction: (overrides = {}) => ({
    amount: Math.floor(Math.random() * 10000) + 1000,
    category: ['food', 'transport', 'housing', 'entertainment'][Math.floor(Math.random() * 4)],
    description: 'Test transaction',
    date: new Date(),
    type: Math.random() > 0.5 ? 'expense' : 'income',
    ...overrides,
  }),

  budget: (overrides = {}) => ({
    category: 'food',
    monthlyLimit: 20000,
    month: '2024-01',
    ...overrides,
  }),

  loan: (overrides = {}) => ({
    name: 'Test Loan',
    initialAmount: 100000,
    currentBalance: 80000,
    monthlyPayment: 10000,
    interestRate: 12.5,
    startDate: new Date('2024-01-01'),
    ...overrides,
  }),

  savingsGoal: (overrides = {}) => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)

    return {
      name: 'Test Savings Goal',
      targetAmount: 500000,
      currentAmount: 50000,
      targetDate: futureDate,
      monthlyContribution: 25000,
      ...overrides,
    }
  },
}
