import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cleanupDatabase, createTestUser, testDb } from '../utils/database'

describe('budget API Logic Tests', () => {
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

  describe('budget Database Operations', () => {
    it('should create a new budget in database', async () => {
      const budgetData = {
        userId: testUserId,
        category: 'food',
        monthlyLimit: 100000,
        currentSpent: 0,
        month: '2024-01',
      }

      const budget = await testDb.budget.create({
        data: budgetData,
      })

      expect(budget).toBeTruthy()
      expect(Number(budget.monthlyLimit)).toBe(100000)
      expect(budget.category).toBe('food')
      expect(budget.month).toBe('2024-01')
      expect(budget.userId).toBe(testUserId)
    })

    it('should enforce unique constraint on userId, category, month', async () => {
      const budgetData = {
        userId: testUserId,
        category: 'food',
        monthlyLimit: 100000,
        currentSpent: 0,
        month: '2024-01',
      }

      // Create first budget
      await testDb.budget.create({ data: budgetData })

      // Try to create duplicate budget
      await expect(
        testDb.budget.create({ data: budgetData }),
      ).rejects.toThrow()
    })

    it('should handle decimal amounts correctly', async () => {
      const budgetData = {
        userId: testUserId,
        category: 'transport',
        monthlyLimit: 75000.50,
        currentSpent: 25000.75,
        month: '2024-01',
      }

      const budget = await testDb.budget.create({
        data: budgetData,
      })

      expect(Number(budget.monthlyLimit)).toBe(75000.50)
      expect(Number(budget.currentSpent)).toBe(25000.75)
    })
  })

  describe('budget Query Operations', () => {
    beforeEach(async () => {
      // Create test budgets
      await testDb.budget.createMany({
        data: [
          {
            userId: testUserId,
            category: 'food',
            monthlyLimit: 100000,
            currentSpent: 45000,
            month: '2024-01',
          },
          {
            userId: testUserId,
            category: 'transport',
            monthlyLimit: 50000,
            currentSpent: 30000,
            month: '2024-01',
          },
          {
            userId: testUserId,
            category: 'food',
            monthlyLimit: 120000,
            currentSpent: 0,
            month: '2024-02',
          },
        ],
      })
    })

    it('should fetch budgets for specific month', async () => {
      const budgets = await testDb.budget.findMany({
        where: {
          userId: testUserId,
          month: '2024-01',
        },
      })

      expect(budgets).toHaveLength(2)
      expect(budgets.every(b => b.month === '2024-01')).toBe(true)
    })

    it('should filter budgets by category', async () => {
      const budgets = await testDb.budget.findMany({
        where: {
          userId: testUserId,
          category: 'food',
        },
      })

      expect(budgets).toHaveLength(2)
      expect(budgets.every(b => b.category === 'food')).toBe(true)
    })

    it('should filter budgets by month and category', async () => {
      const budgets = await testDb.budget.findMany({
        where: {
          userId: testUserId,
          month: '2024-01',
          category: 'food',
        },
      })

      expect(budgets).toHaveLength(1)
      expect(budgets[0].month).toBe('2024-01')
      expect(budgets[0].category).toBe('food')
    })
  })

  describe('budget Update Operations', () => {
    let budgetId: string

    beforeEach(async () => {
      const budget = await testDb.budget.create({
        data: {
          userId: testUserId,
          category: 'food',
          monthlyLimit: 100000,
          currentSpent: 25000,
          month: '2024-01',
        },
      })
      budgetId = budget.id
    })

    it('should update budget monthly limit', async () => {
      const updatedBudget = await testDb.budget.update({
        where: { id: budgetId },
        data: { monthlyLimit: 150000 },
      })

      expect(Number(updatedBudget.monthlyLimit)).toBe(150000)
      expect(Number(updatedBudget.currentSpent)).toBe(25000) // Should remain unchanged
    })

    it('should update current spent amount', async () => {
      const updatedBudget = await testDb.budget.update({
        where: { id: budgetId },
        data: { currentSpent: 75000 },
      })

      expect(Number(updatedBudget.currentSpent)).toBe(75000)
      expect(Number(updatedBudget.monthlyLimit)).toBe(100000) // Should remain unchanged
    })

    it('should throw error for non-existent budget update', async () => {
      await expect(
        testDb.budget.update({
          where: { id: 'non-existent-id' },
          data: { monthlyLimit: 50000 },
        }),
      ).rejects.toThrow()
    })
  })

  describe('budget Delete Operations', () => {
    let budgetId: string

    beforeEach(async () => {
      const budget = await testDb.budget.create({
        data: {
          userId: testUserId,
          category: 'miscellaneous',
          monthlyLimit: 30000,
          currentSpent: 15000,
          month: '2024-01',
        },
      })
      budgetId = budget.id
    })

    it('should delete a budget', async () => {
      await testDb.budget.delete({
        where: { id: budgetId },
      })

      // Verify deletion in database
      const dbBudget = await testDb.budget.findUnique({
        where: { id: budgetId },
      })
      expect(dbBudget).toBeNull()
    })

    it('should throw error for non-existent budget deletion', async () => {
      await expect(
        testDb.budget.delete({
          where: { id: 'non-existent-id' },
        }),
      ).rejects.toThrow()
    })
  })

  describe('budget Analysis Operations', () => {
    beforeEach(async () => {
      // Create test budgets with different utilization rates
      await testDb.budget.createMany({
        data: [
          {
            userId: testUserId,
            category: 'food',
            monthlyLimit: 100000,
            currentSpent: 95000, // 95% utilization - near limit
            month: '2024-01',
          },
          {
            userId: testUserId,
            category: 'transport',
            monthlyLimit: 50000,
            currentSpent: 60000, // 120% utilization - over budget
            month: '2024-01',
          },
          {
            userId: testUserId,
            category: 'miscellaneous',
            monthlyLimit: 30000,
            currentSpent: 10000, // 33% utilization - under budget
            month: '2024-01',
          },
        ],
      })
    })

    it('should calculate total budget metrics correctly', async () => {
      const budgets = await testDb.budget.findMany({
        where: {
          userId: testUserId,
          month: '2024-01',
        },
      })

      const totalBudget = budgets.reduce((sum, b) => sum + Number(b.monthlyLimit), 0)
      const totalSpent = budgets.reduce((sum, b) => sum + Number(b.currentSpent), 0)
      const utilizationRate = (totalSpent / totalBudget) * 100

      expect(totalBudget).toBe(180000)
      expect(totalSpent).toBe(165000)
      expect(utilizationRate).toBeCloseTo(91.67, 1)
    })

    it('should identify over-budget categories', async () => {
      const budgets = await testDb.budget.findMany({
        where: {
          userId: testUserId,
          month: '2024-01',
        },
      })

      const overBudgetCategories = budgets.filter(b =>
        Number(b.currentSpent) > Number(b.monthlyLimit),
      )

      expect(overBudgetCategories).toHaveLength(1)
      expect(overBudgetCategories[0].category).toBe('transport')
    })

    it('should identify near-limit categories', async () => {
      const budgets = await testDb.budget.findMany({
        where: {
          userId: testUserId,
          month: '2024-01',
        },
      })

      const nearLimitCategories = budgets.filter((b) => {
        const utilization = (Number(b.currentSpent) / Number(b.monthlyLimit)) * 100
        return utilization >= 80 && utilization <= 100
      })

      expect(nearLimitCategories).toHaveLength(1)
      expect(nearLimitCategories[0].category).toBe('food')
    })

    it('should identify under-budget categories', async () => {
      const budgets = await testDb.budget.findMany({
        where: {
          userId: testUserId,
          month: '2024-01',
        },
      })

      const underBudgetCategories = budgets.filter((b) => {
        const utilization = (Number(b.currentSpent) / Number(b.monthlyLimit)) * 100
        return utilization < 80
      })

      expect(underBudgetCategories).toHaveLength(1)
      expect(underBudgetCategories[0].category).toBe('miscellaneous')
    })
  })

  describe('budget Sync Operations', () => {
    beforeEach(async () => {
      // Create test budget
      await testDb.budget.create({
        data: {
          userId: testUserId,
          category: 'food',
          monthlyLimit: 100000,
          currentSpent: 0, // Will be updated by sync
          month: '2024-01',
        },
      })

      // Create test transactions for the month
      await testDb.transaction.createMany({
        data: [
          {
            userId: testUserId,
            amount: 25000,
            category: 'food',
            description: 'Groceries',
            date: new Date('2024-01-15'),
            type: 'expense',
          },
          {
            userId: testUserId,
            amount: 15000,
            category: 'food',
            description: 'Restaurant',
            date: new Date('2024-01-20'),
            type: 'expense',
          },
          {
            userId: testUserId,
            amount: 10000,
            category: 'food',
            description: 'Snacks',
            date: new Date('2024-02-05'), // Different month
            type: 'expense',
          },
        ],
      })
    })

    it('should calculate current spent from transactions correctly', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const spentAmount = await testDb.transaction.aggregate({
        where: {
          userId: testUserId,
          category: 'food',
          type: 'expense',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      })

      const totalSpent = Number(spentAmount._sum.amount || 0)
      expect(totalSpent).toBe(40000) // 25000 + 15000, excluding February transaction
    })

    it('should sync budget with actual spending', async () => {
      const budget = await testDb.budget.findFirst({
        where: {
          userId: testUserId,
          category: 'food',
          month: '2024-01',
        },
      })

      expect(budget).toBeTruthy()
      expect(Number(budget!.currentSpent)).toBe(0) // Initial value

      // Calculate and update spent amount
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const spentAmount = await testDb.transaction.aggregate({
        where: {
          userId: testUserId,
          category: 'food',
          type: 'expense',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      })

      const updatedBudget = await testDb.budget.update({
        where: { id: budget!.id },
        data: { currentSpent: Number(spentAmount._sum.amount || 0) },
      })

      expect(Number(updatedBudget.currentSpent)).toBe(40000)
    })
  })
})
