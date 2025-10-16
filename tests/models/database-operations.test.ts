import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestUser, setupTestDatabase, testDb } from '../utils/database'

describe('database Operations Integration', () => {
  setupTestDatabase()

  beforeAll(async () => {
    // Ensure test database is connected
    await testDb.$connect()
  })

  afterAll(async () => {
    // Clean up and disconnect
    await testDb.$disconnect()
  })

  describe('complete User Financial Profile', () => {
    it('should create a complete user profile with all financial data', async () => {
      // Create user
      const user = await testDb.user.create({
        data: {
          email: 'complete-user@example.com',
          name: 'Complete User',
          password: 'hashedpassword123',
          monthlyIncome: 750000,
          currency: 'NGN',
        },
      })

      // Create transactions
      const transactions = await Promise.all([
        testDb.transaction.create({
          data: {
            userId: user.id,
            amount: 750000,
            category: 'miscellaneous',
            description: 'Monthly Salary',
            date: new Date('2024-01-01'),
            type: 'income',
          },
        }),
        testDb.transaction.create({
          data: {
            userId: user.id,
            amount: 200000,
            category: 'rent',
            description: 'Monthly Rent',
            date: new Date('2024-01-02'),
            type: 'expense',
          },
        }),
        testDb.transaction.create({
          data: {
            userId: user.id,
            amount: 80000,
            category: 'food',
            description: 'Groceries and Meals',
            date: new Date('2024-01-03'),
            type: 'expense',
          },
        }),
      ])

      // Create loans
      const loans = await Promise.all([
        testDb.loan.create({
          data: {
            userId: user.id,
            name: 'Car Loan',
            initialAmount: 3000000,
            currentBalance: 2200000,
            monthlyPayment: 150000,
            interestRate: 0.18,
            startDate: new Date('2023-06-01'),
            projectedPayoffDate: new Date('2025-06-01'),
          },
        }),
        testDb.loan.create({
          data: {
            userId: user.id,
            name: 'Personal Loan',
            initialAmount: 500000,
            currentBalance: 300000,
            monthlyPayment: 50000,
            interestRate: 0.22,
            startDate: new Date('2023-12-01'),
            projectedPayoffDate: new Date('2024-06-01'),
          },
        }),
      ])

      // Create budgets
      const currentMonth = new Date().toISOString().slice(0, 7)
      const budgets = await Promise.all([
        testDb.budget.create({
          data: {
            userId: user.id,
            category: 'rent',
            monthlyLimit: 200000,
            currentSpent: 200000,
            month: currentMonth,
          },
        }),
        testDb.budget.create({
          data: {
            userId: user.id,
            category: 'food',
            monthlyLimit: 100000,
            currentSpent: 80000,
            month: currentMonth,
          },
        }),
        testDb.budget.create({
          data: {
            userId: user.id,
            category: 'transport',
            monthlyLimit: 60000,
            currentSpent: 45000,
            month: currentMonth,
          },
        }),
      ])

      // Create savings goals
      const savingsGoals = await Promise.all([
        testDb.savingsGoal.create({
          data: {
            userId: user.id,
            name: 'Emergency Fund',
            targetAmount: 2000000,
            currentAmount: 500000,
            targetDate: new Date('2024-12-31'),
            monthlyContribution: 100000,
          },
        }),
        testDb.savingsGoal.create({
          data: {
            userId: user.id,
            name: 'House Down Payment',
            targetAmount: 5000000,
            currentAmount: 800000,
            targetDate: new Date('2026-01-01'),
            monthlyContribution: 200000,
          },
        }),
      ])

      // Verify all data was created
      expect(user.id).toBeDefined()
      expect(transactions).toHaveLength(3)
      expect(loans).toHaveLength(2)
      expect(budgets).toHaveLength(3)
      expect(savingsGoals).toHaveLength(2)

      // Fetch complete user profile
      const completeProfile = await testDb.user.findUnique({
        where: { id: user.id },
        include: {
          transactions: {
            orderBy: { date: 'desc' },
          },
          loans: {
            orderBy: { createdAt: 'desc' },
          },
          budgets: {
            where: { month: currentMonth },
          },
          savingsGoals: {
            orderBy: { targetDate: 'asc' },
          },
        },
      })

      expect(completeProfile).toBeDefined()
      expect(completeProfile?.transactions).toHaveLength(3)
      expect(completeProfile?.loans).toHaveLength(2)
      expect(completeProfile?.budgets).toHaveLength(3)
      expect(completeProfile?.savingsGoals).toHaveLength(2)

      // Verify financial calculations
      const totalIncome = completeProfile?.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const totalExpenses = completeProfile?.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const totalDebt = completeProfile?.loans
        .reduce((sum, l) => sum + Number(l.currentBalance), 0)

      const totalSavingsTarget = completeProfile?.savingsGoals
        .reduce((sum, g) => sum + Number(g.targetAmount), 0)

      expect(totalIncome).toBe(750000)
      expect(totalExpenses).toBe(280000) // 200000 + 80000
      expect(totalDebt).toBe(2500000) // 2200000 + 300000
      expect(totalSavingsTarget).toBe(7000000) // 2000000 + 5000000
    })
  })

  describe('data Integrity and Constraints', () => {
    it('should enforce unique email constraint', async () => {
      const email = `unique-test-${Date.now()}@example.com`

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

    it('should enforce unique budget constraint per user/category/month', async () => {
      const user = await createTestUser()
      const month = '2024-01'

      await testDb.budget.create({
        data: {
          userId: user.id,
          category: 'food',
          monthlyLimit: 50000,
          month,
        },
      })

      await expect(
        testDb.budget.create({
          data: {
            userId: user.id,
            category: 'food',
            monthlyLimit: 60000,
            month,
          },
        }),
      ).rejects.toThrow()
    })

    it('should cascade delete related records when user is deleted', async () => {
      const user = await createTestUser()

      // Create related records
      const transaction = await testDb.transaction.create({
        data: {
          userId: user.id,
          amount: 10000,
          category: 'food',
          description: 'Test transaction',
          date: new Date(),
          type: 'expense',
        },
      })

      const loan = await testDb.loan.create({
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

      const budget = await testDb.budget.create({
        data: {
          userId: user.id,
          category: 'transport',
          monthlyLimit: 50000,
          month: '2024-01',
        },
      })

      const savingsGoal = await testDb.savingsGoal.create({
        data: {
          userId: user.id,
          name: 'Test Goal',
          targetAmount: 100000,
          targetDate: new Date('2024-12-31'),
          monthlyContribution: 10000,
        },
      })

      // Delete user
      await testDb.user.delete({
        where: { id: user.id },
      })

      // Verify all related records are deleted
      const remainingTransactions = await testDb.transaction.findMany({
        where: { userId: user.id },
      })
      const remainingLoans = await testDb.loan.findMany({
        where: { userId: user.id },
      })
      const remainingBudgets = await testDb.budget.findMany({
        where: { userId: user.id },
      })
      const remainingSavingsGoals = await testDb.savingsGoal.findMany({
        where: { userId: user.id },
      })

      expect(remainingTransactions).toHaveLength(0)
      expect(remainingLoans).toHaveLength(0)
      expect(remainingBudgets).toHaveLength(0)
      expect(remainingSavingsGoals).toHaveLength(0)
    })
  })

  describe('complex Queries and Aggregations', () => {
    it('should perform complex financial analysis queries', async () => {
      const user = await createTestUser()
      const month = '2024-01'

      // Create sample data for analysis
      await Promise.all([
        // Income transactions
        testDb.transaction.create({
          data: {
            userId: user.id,
            amount: 600000,
            category: 'miscellaneous',
            description: 'Salary',
            date: new Date('2024-01-01'),
            type: 'income',
          },
        }),
        testDb.transaction.create({
          data: {
            userId: user.id,
            amount: 50000,
            category: 'miscellaneous',
            description: 'Freelance',
            date: new Date('2024-01-15'),
            type: 'income',
          },
        }),
        // Expense transactions
        testDb.transaction.create({
          data: {
            userId: user.id,
            amount: 150000,
            category: 'rent',
            description: 'Monthly Rent',
            date: new Date('2024-01-02'),
            type: 'expense',
          },
        }),
        testDb.transaction.create({
          data: {
            userId: user.id,
            amount: 80000,
            category: 'food',
            description: 'Groceries',
            date: new Date('2024-01-05'),
            type: 'expense',
          },
        }),
        testDb.transaction.create({
          data: {
            userId: user.id,
            amount: 40000,
            category: 'transport',
            description: 'Fuel and Transport',
            date: new Date('2024-01-10'),
            type: 'expense',
          },
        }),
      ])

      // Query monthly summary
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const monthlyTransactions = await testDb.transaction.findMany({
        where: {
          userId: user.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      // Calculate totals
      const totalIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const totalExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const expensesByCategory = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
          return acc
        }, {} as Record<string, number>)

      // Verify calculations
      expect(totalIncome).toBe(650000) // 600000 + 50000
      expect(totalExpenses).toBe(270000) // 150000 + 80000 + 40000
      expect(expensesByCategory.rent).toBe(150000)
      expect(expensesByCategory.food).toBe(80000)
      expect(expensesByCategory.transport).toBe(40000)

      const netSavings = totalIncome - totalExpenses
      const savingsRate = (netSavings / totalIncome) * 100

      expect(netSavings).toBe(380000)
      expect(Math.round(savingsRate)).toBe(58) // ~58.46%
    })

    it('should handle pagination and sorting', async () => {
      const user = await createTestUser()

      // Create multiple transactions
      const transactionPromises = Array.from({ length: 15 }, (_, i) =>
        testDb.transaction.create({
          data: {
            userId: user.id,
            amount: (i + 1) * 1000,
            category: 'miscellaneous',
            description: `Transaction ${i + 1}`,
            date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
            type: i % 2 === 0 ? 'income' : 'expense',
          },
        }))

      await Promise.all(transactionPromises)

      // Test pagination
      const page1 = await testDb.transaction.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        take: 5,
        skip: 0,
      })

      const page2 = await testDb.transaction.findMany({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
        take: 5,
        skip: 5,
      })

      expect(page1).toHaveLength(5)
      expect(page2).toHaveLength(5)
      expect(page1[0].description).toBe('Transaction 15')
      expect(page2[0].description).toBe('Transaction 10')

      // Test filtering by type
      const incomeTransactions = await testDb.transaction.findMany({
        where: {
          userId: user.id,
          type: 'income',
        },
      })

      expect(incomeTransactions).toHaveLength(8) // Transactions 1, 3, 5, 7, 9, 11, 13, 15
    })
  })
})
