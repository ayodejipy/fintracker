import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cleanupDatabase, createTestUser, testDb } from '../utils/database'

describe('transaction API Logic Tests', () => {
  let testUserId: string

  beforeAll(async () => {
    await testDb.$connect()
    await cleanupDatabase()
  })

  afterAll(async () => {
    await cleanupDatabase()
    await testDb.$disconnect()
  })

  beforeEach(async () => {
    await cleanupDatabase()
    // Create test user
    const user = await createTestUser({
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      password: 'password123',
      monthlyIncome: 500000,
    })
    testUserId = user.id
  })

  afterEach(async () => {
    await cleanupDatabase()
  })

  describe('transaction Database Operations', () => {
    it('should create a new transaction in database', async () => {
      const transactionData = {
        userId: testUserId,
        amount: 50000,
        category: 'food',
        description: 'Grocery shopping',
        date: new Date('2024-01-15'),
        type: 'expense',
      }

      const transaction = await testDb.transaction.create({
        data: transactionData,
      })

      expect(transaction).toBeTruthy()
      expect(Number(transaction.amount)).toBe(50000)
      expect(transaction.category).toBe('food')
      expect(transaction.description).toBe('Grocery shopping')
      expect(transaction.type).toBe('expense')
      expect(transaction.userId).toBe(testUserId)
    })

    it('should validate transaction data constraints', async () => {
      // Test that we can't create transaction with invalid user ID
      const invalidTransactionData = {
        userId: 'non-existent-user-id',
        amount: 50000,
        category: 'food',
        description: 'Test transaction',
        date: new Date(),
        type: 'expense',
      }

      await expect(
        testDb.transaction.create({
          data: invalidTransactionData,
        }),
      ).rejects.toThrow()
    })

    it('should handle decimal amounts correctly', async () => {
      const transactionData = {
        userId: testUserId,
        amount: 1234.56,
        category: 'transport',
        description: 'Bus fare',
        date: new Date(),
        type: 'expense',
      }

      const transaction = await testDb.transaction.create({
        data: transactionData,
      })

      expect(Number(transaction.amount)).toBe(1234.56)
    })
  })

  describe('transaction Query Operations', () => {
    beforeEach(async () => {
      // Create test transactions
      await testDb.transaction.createMany({
        data: [
          {
            userId: testUserId,
            amount: 500000,
            category: 'savings',
            description: 'Monthly salary',
            date: new Date('2024-01-01'),
            type: 'income',
          },
          {
            userId: testUserId,
            amount: 50000,
            category: 'food',
            description: 'Groceries',
            date: new Date('2024-01-15'),
            type: 'expense',
          },
          {
            userId: testUserId,
            amount: 20000,
            category: 'transport',
            description: 'Fuel',
            date: new Date('2024-01-10'),
            type: 'expense',
          },
        ],
      })
    })

    it('should fetch user transactions with pagination', async () => {
      const transactions = await testDb.transaction.findMany({
        where: { userId: testUserId },
        orderBy: { date: 'desc' },
        take: 10,
        skip: 0,
      })

      const total = await testDb.transaction.count({
        where: { userId: testUserId },
      })

      expect(transactions).toHaveLength(3)
      expect(total).toBe(3)
    })

    it('should filter transactions by category', async () => {
      const transactions = await testDb.transaction.findMany({
        where: {
          userId: testUserId,
          category: 'food',
        },
      })

      expect(transactions).toHaveLength(1)
      expect(transactions[0].category).toBe('food')
    })

    it('should filter transactions by month', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const transactions = await testDb.transaction.findMany({
        where: {
          userId: testUserId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      expect(transactions).toHaveLength(3)
    })

    it('should filter transactions by type', async () => {
      const transactions = await testDb.transaction.findMany({
        where: {
          userId: testUserId,
          type: 'expense',
        },
      })

      expect(transactions).toHaveLength(2)
      expect(transactions.every(t => t.type === 'expense')).toBe(true)
    })

    it('should search transactions by description', async () => {
      const transactions = await testDb.transaction.findMany({
        where: {
          userId: testUserId,
          description: {
            contains: 'Groceries',
            mode: 'insensitive',
          },
        },
      })

      expect(transactions).toHaveLength(1)
      expect(transactions[0].description).toContain('Groceries')
    })
  })

  describe('transaction Individual Operations', () => {
    let transactionId: string

    beforeEach(async () => {
      const transaction = await testDb.transaction.create({
        data: {
          userId: testUserId,
          amount: 25000,
          category: 'transport',
          description: 'Bus fare',
          date: new Date('2024-01-20'),
          type: 'expense',
        },
      })
      transactionId = transaction.id
    })

    it('should fetch a specific transaction', async () => {
      const transaction = await testDb.transaction.findFirst({
        where: {
          id: transactionId,
          userId: testUserId,
        },
      })

      expect(transaction).toBeTruthy()
      expect(transaction!.id).toBe(transactionId)
      expect(Number(transaction!.amount)).toBe(25000)
    })

    it('should return null for non-existent transaction', async () => {
      const transaction = await testDb.transaction.findFirst({
        where: {
          id: 'non-existent-id',
          userId: testUserId,
        },
      })

      expect(transaction).toBeNull()
    })
  })

  describe('transaction Update Operations', () => {
    let transactionId: string

    beforeEach(async () => {
      const transaction = await testDb.transaction.create({
        data: {
          userId: testUserId,
          amount: 30000,
          category: 'food',
          description: 'Restaurant',
          date: new Date('2024-01-25'),
          type: 'expense',
        },
      })
      transactionId = transaction.id
    })

    it('should update a transaction', async () => {
      const updateData = {
        amount: 35000,
        description: 'Fine dining restaurant',
      }

      const updatedTransaction = await testDb.transaction.update({
        where: { id: transactionId },
        data: updateData,
      })

      expect(Number(updatedTransaction.amount)).toBe(35000)
      expect(updatedTransaction.description).toBe('Fine dining restaurant')

      // Verify in database
      const dbTransaction = await testDb.transaction.findUnique({
        where: { id: transactionId },
      })
      expect(Number(dbTransaction!.amount)).toBe(35000)
    })

    it('should throw error for non-existent transaction update', async () => {
      await expect(
        testDb.transaction.update({
          where: { id: 'non-existent-id' },
          data: { amount: 40000 },
        }),
      ).rejects.toThrow()
    })
  })

  describe('transaction Delete Operations', () => {
    let transactionId: string

    beforeEach(async () => {
      const transaction = await testDb.transaction.create({
        data: {
          userId: testUserId,
          amount: 15000,
          category: 'miscellaneous',
          description: 'Random expense',
          date: new Date('2024-01-30'),
          type: 'expense',
        },
      })
      transactionId = transaction.id
    })

    it('should delete a transaction', async () => {
      await testDb.transaction.delete({
        where: { id: transactionId },
      })

      // Verify deletion in database
      const dbTransaction = await testDb.transaction.findUnique({
        where: { id: transactionId },
      })
      expect(dbTransaction).toBeNull()
    })

    it('should throw error for non-existent transaction deletion', async () => {
      await expect(
        testDb.transaction.delete({
          where: { id: 'non-existent-id' },
        }),
      ).rejects.toThrow()
    })
  })

  describe('transaction Summary Operations', () => {
    beforeEach(async () => {
      // Create test transactions for summary
      await testDb.transaction.createMany({
        data: [
          {
            userId: testUserId,
            amount: 500000,
            category: 'savings',
            description: 'Salary',
            date: new Date('2024-01-01'),
            type: 'income',
          },
          {
            userId: testUserId,
            amount: 100000,
            category: 'food',
            description: 'Groceries',
            date: new Date('2024-01-15'),
            type: 'expense',
          },
          {
            userId: testUserId,
            amount: 50000,
            category: 'transport',
            description: 'Transport',
            date: new Date('2024-01-10'),
            type: 'expense',
          },
          {
            userId: testUserId,
            amount: 200000,
            category: 'rent',
            description: 'Monthly rent',
            date: new Date('2024-01-05'),
            type: 'expense',
          },
        ],
      })
    })

    it('should calculate transaction summary correctly', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const [incomeSum, expenseSum, categoryBreakdown] = await Promise.all([
        testDb.transaction.aggregate({
          where: {
            userId: testUserId,
            type: 'income',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),

        testDb.transaction.aggregate({
          where: {
            userId: testUserId,
            type: 'expense',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),

        testDb.transaction.groupBy({
          by: ['category'],
          where: {
            userId: testUserId,
            type: 'expense',
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
          _count: { id: true },
        }),
      ])

      const totalIncome = Number(incomeSum._sum.amount || 0)
      const totalExpenses = Number(expenseSum._sum.amount || 0)

      expect(totalIncome).toBe(500000)
      expect(totalExpenses).toBe(350000)
      expect(totalIncome - totalExpenses).toBe(150000)
      expect(categoryBreakdown).toHaveLength(3)
    })

    it('should group expenses by category correctly', async () => {
      const categoryBreakdown = await testDb.transaction.groupBy({
        by: ['category'],
        where: {
          userId: testUserId,
          type: 'expense',
        },
        _sum: { amount: true },
        _count: { id: true },
      })

      expect(categoryBreakdown).toHaveLength(3)

      const foodCategory = categoryBreakdown.find(c => c.category === 'food')
      expect(foodCategory).toBeTruthy()
      expect(Number(foodCategory!._sum.amount)).toBe(100000)
      expect(foodCategory!._count.id).toBe(1)
    })
  })
})
