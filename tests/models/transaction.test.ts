import { describe, expect, it } from 'vitest'
import { createTestTransaction, createTestUser, setupTestDatabase, testDb } from '../utils/database'

describe('transaction Model', () => {
  setupTestDatabase()

  describe('transaction Creation', () => {
    it('should create a transaction with valid data', async () => {
      const user = await createTestUser()
      const transactionData = {
        userId: user.id,
        amount: 15000,
        category: 'transport',
        description: 'Uber ride',
        date: new Date('2024-01-15'),
        type: 'expense' as const,
      }

      const transaction = await testDb.transaction.create({
        data: transactionData,
      })

      expect(transaction).toMatchObject({
        userId: user.id,
        amount: expect.any(Object), // Prisma Decimal
        category: transactionData.category,
        description: transactionData.description,
        date: transactionData.date,
        type: transactionData.type,
      })
      expect(transaction.id).toBeDefined()
      expect(transaction.createdAt).toBeInstanceOf(Date)
    })

    it('should create income transaction', async () => {
      const user = await createTestUser()
      const transaction = await testDb.transaction.create({
        data: {
          userId: user.id,
          amount: 500000,
          category: 'miscellaneous',
          description: 'Monthly Salary',
          date: new Date(),
          type: 'income',
        },
      })

      expect(transaction.type).toBe('income')
    })

    it('should create expense transaction', async () => {
      const user = await createTestUser()
      const transaction = await testDb.transaction.create({
        data: {
          userId: user.id,
          amount: 25000,
          category: 'food',
          description: 'Groceries',
          date: new Date(),
          type: 'expense',
        },
      })

      expect(transaction.type).toBe('expense')
    })
  })

  describe('transaction Relationships', () => {
    it('should belong to a user', async () => {
      const user = await createTestUser()
      const transaction = await createTestTransaction(user.id)

      const transactionWithUser = await testDb.transaction.findUnique({
        where: { id: transaction.id },
        include: { user: true },
      })

      expect(transactionWithUser?.user.id).toBe(user.id)
      expect(transactionWithUser?.user.email).toBe(user.email)
    })
  })

  describe('transaction Queries', () => {
    it('should filter transactions by user', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' })
      const user2 = await createTestUser({ email: 'user2@example.com' })

      await createTestTransaction(user1.id, { description: 'User 1 transaction' })
      await createTestTransaction(user2.id, { description: 'User 2 transaction' })

      const user1Transactions = await testDb.transaction.findMany({
        where: { userId: user1.id },
      })

      expect(user1Transactions).toHaveLength(1)
      expect(user1Transactions[0].description).toBe('User 1 transaction')
    })

    it('should filter transactions by category', async () => {
      const user = await createTestUser()

      await createTestTransaction(user.id, { category: 'food', description: 'Food expense' })
      await createTestTransaction(user.id, { category: 'transport', description: 'Transport expense' })

      const foodTransactions = await testDb.transaction.findMany({
        where: {
          userId: user.id,
          category: 'food',
        },
      })

      expect(foodTransactions).toHaveLength(1)
      expect(foodTransactions[0].description).toBe('Food expense')
    })

    it('should filter transactions by date range', async () => {
      const user = await createTestUser()
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await createTestTransaction(user.id, {
        date: new Date('2024-01-15'),
        description: 'January transaction',
      })
      await createTestTransaction(user.id, {
        date: new Date('2024-02-15'),
        description: 'February transaction',
      })

      const januaryTransactions = await testDb.transaction.findMany({
        where: {
          userId: user.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      expect(januaryTransactions).toHaveLength(1)
      expect(januaryTransactions[0].description).toBe('January transaction')
    })

    it('should order transactions by date descending', async () => {
      const user = await createTestUser()

      const transaction1 = await createTestTransaction(user.id, {
        date: new Date('2024-01-01'),
        description: 'First transaction',
      })
      const transaction2 = await createTestTransaction(user.id, {
        date: new Date('2024-01-15'),
        description: 'Second transaction',
      })

      const transactions = await testDb.transaction.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
      })

      expect(transactions[0].description).toBe('Second transaction')
      expect(transactions[1].description).toBe('First transaction')
    })
  })

  describe('transaction Validation', () => {
    it('should require valid expense categories', async () => {
      const user = await createTestUser()
      const validCategories = [
        'loan_repayment',
        'home_allowance',
        'rent',
        'transport',
        'food',
        'data_airtime',
        'miscellaneous',
        'savings',
      ]

      for (const category of validCategories) {
        const transaction = await testDb.transaction.create({
          data: {
            userId: user.id,
            amount: 10000,
            category,
            description: `Test ${category}`,
            date: new Date(),
            type: 'expense',
          },
        })

        expect(transaction.category).toBe(category)
      }
    })
  })
})
