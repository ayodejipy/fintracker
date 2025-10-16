import { describe, expect, it } from 'vitest'
import { createTestUser, setupTestDatabase, testDb } from '../utils/database'

describe('user Model', () => {
  setupTestDatabase()

  describe('user Creation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'hashedpassword123',
        monthlyIncome: 500000,
        currency: 'NGN',
      }

      const user = await testDb.user.create({
        data: userData,
      })

      expect(user).toMatchObject({
        email: userData.email,
        name: userData.name,
        monthlyIncome: expect.any(Object), // Prisma Decimal
        currency: userData.currency,
      })
      expect(user.id).toBeDefined()
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it('should set default currency to NGN', async () => {
      const user = await testDb.user.create({
        data: {
          email: 'test2@example.com',
          name: 'Jane Doe',
          password: 'hashedpassword123',
          monthlyIncome: 300000,
        },
      })

      expect(user.currency).toBe('NGN')
    })

    it('should enforce unique email constraint', async () => {
      const email = `duplicate-${Date.now()}@example.com`

      await testDb.user.create({
        data: {
          email,
          name: 'First User',
          password: 'hashedpassword123',
          monthlyIncome: 400000,
        },
      })

      await expect(
        testDb.user.create({
          data: {
            email,
            name: 'Second User',
            password: 'hashedpassword123',
            monthlyIncome: 500000,
          },
        }),
      ).rejects.toThrow()
    })
  })

  describe('user Relationships', () => {
    it('should cascade delete related records when user is deleted', async () => {
      const user = await createTestUser()

      // Create related records
      await testDb.transaction.create({
        data: {
          userId: user.id,
          amount: 10000,
          category: 'food',
          description: 'Test transaction',
          date: new Date(),
          type: 'expense',
        },
      })

      await testDb.loan.create({
        data: {
          userId: user.id,
          name: 'Test Loan',
          initialAmount: 100000,
          currentBalance: 80000,
          monthlyPayment: 10000,
          interestRate: 0.15,
          startDate: new Date(),
        },
      })

      // Delete user
      await testDb.user.delete({
        where: { id: user.id },
      })

      // Check that related records are deleted
      const transactions = await testDb.transaction.findMany({
        where: { userId: user.id },
      })
      const loans = await testDb.loan.findMany({
        where: { userId: user.id },
      })

      expect(transactions).toHaveLength(0)
      expect(loans).toHaveLength(0)
    })
  })

  describe('user Queries', () => {
    it('should find user with related data', async () => {
      const user = await createTestUser()

      await testDb.transaction.create({
        data: {
          userId: user.id,
          amount: 10000,
          category: 'food',
          description: 'Test transaction',
          date: new Date(),
          type: 'expense',
        },
      })

      const userWithTransactions = await testDb.user.findUnique({
        where: { id: user.id },
        include: {
          transactions: true,
        },
      })

      expect(userWithTransactions).toBeDefined()
      expect(userWithTransactions?.transactions).toHaveLength(1)
    })
  })
})
