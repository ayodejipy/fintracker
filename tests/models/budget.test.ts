import { describe, expect, it } from 'vitest'
import { createTestBudget, createTestUser, setupTestDatabase, testDb } from '../utils/database'

describe('budget Model', () => {
  setupTestDatabase()

  describe('budget Creation', () => {
    it('should create a budget with valid data', async () => {
      const user = await createTestUser()
      const currentMonth = new Date().toISOString().slice(0, 7)
      const budgetData = {
        userId: user.id,
        category: 'food',
        monthlyLimit: 80000,
        currentSpent: 25000,
        month: currentMonth,
      }

      const budget = await testDb.budget.create({
        data: budgetData,
      })

      expect(budget).toMatchObject({
        userId: user.id,
        category: budgetData.category,
        monthlyLimit: expect.any(Object), // Prisma Decimal
        currentSpent: expect.any(Object), // Prisma Decimal
        month: budgetData.month,
      })
      expect(budget.id).toBeDefined()
      expect(budget.createdAt).toBeInstanceOf(Date)
      expect(budget.updatedAt).toBeInstanceOf(Date)
    })

    it('should set default current spent to 0', async () => {
      const user = await createTestUser()
      const currentMonth = new Date().toISOString().slice(0, 7)

      const budget = await testDb.budget.create({
        data: {
          userId: user.id,
          category: 'transport',
          monthlyLimit: 60000,
          month: currentMonth,
        },
      })

      expect(Number(budget.currentSpent)).toBe(0)
    })

    it('should enforce unique constraint on user, category, and month', async () => {
      const user = await createTestUser()
      const testMonth = `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`

      await testDb.budget.create({
        data: {
          userId: user.id,
          category: 'food',
          monthlyLimit: 50000,
          month: testMonth,
        },
      })

      await expect(
        testDb.budget.create({
          data: {
            userId: user.id,
            category: 'food',
            monthlyLimit: 60000,
            month: testMonth,
          },
        }),
      ).rejects.toThrow()
    })

    it('should allow same category for different months', async () => {
      const user = await createTestUser()

      const budget1 = await testDb.budget.create({
        data: {
          userId: user.id,
          category: 'food',
          monthlyLimit: 50000,
          month: '2024-01',
        },
      })

      const budget2 = await testDb.budget.create({
        data: {
          userId: user.id,
          category: 'food',
          monthlyLimit: 60000,
          month: '2024-02',
        },
      })

      expect(budget1.id).not.toBe(budget2.id)
      expect(budget1.month).toBe('2024-01')
      expect(budget2.month).toBe('2024-02')
    })
  })

  describe('budget Relationships', () => {
    it('should belong to a user', async () => {
      const user = await createTestUser()
      const budget = await createTestBudget(user.id)

      const budgetWithUser = await testDb.budget.findUnique({
        where: { id: budget.id },
        include: { user: true },
      })

      expect(budgetWithUser?.user.id).toBe(user.id)
      expect(budgetWithUser?.user.email).toBe(user.email)
    })
  })

  describe('budget Queries', () => {
    it('should filter budgets by user', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' })
      const user2 = await createTestUser({ email: 'user2@example.com' })

      await createTestBudget(user1.id, { category: 'food' })
      await createTestBudget(user2.id, { category: 'transport' })

      const user1Budgets = await testDb.budget.findMany({
        where: { userId: user1.id },
      })

      expect(user1Budgets).toHaveLength(1)
      expect(user1Budgets[0].category).toBe('food')
    })

    it('should filter budgets by month', async () => {
      const user = await createTestUser()

      await createTestBudget(user.id, {
        category: 'food',
        month: '2024-01',
      })
      await createTestBudget(user.id, {
        category: 'transport',
        month: '2024-02',
      })

      const januaryBudgets = await testDb.budget.findMany({
        where: {
          userId: user.id,
          month: '2024-01',
        },
      })

      expect(januaryBudgets).toHaveLength(1)
      expect(januaryBudgets[0].category).toBe('food')
    })

    it('should get all budgets for current month', async () => {
      const user = await createTestUser()
      const currentMonth = new Date().toISOString().slice(0, 7)

      await createTestBudget(user.id, {
        category: 'food',
        month: currentMonth,
      })
      await createTestBudget(user.id, {
        category: 'transport',
        month: currentMonth,
      })
      await createTestBudget(user.id, {
        category: 'rent',
        month: '2024-01', // Different month
      })

      const currentMonthBudgets = await testDb.budget.findMany({
        where: {
          userId: user.id,
          month: currentMonth,
        },
      })

      expect(currentMonthBudgets).toHaveLength(2)
    })
  })

  describe('budget Updates', () => {
    it('should update current spent amount', async () => {
      const user = await createTestUser()
      const budget = await createTestBudget(user.id, {
        currentSpent: 10000,
      })

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))

      const updatedBudget = await testDb.budget.update({
        where: { id: budget.id },
        data: { currentSpent: 25000 },
      })

      expect(Number(updatedBudget.currentSpent)).toBe(25000)
      expect(updatedBudget.updatedAt.getTime()).toBeGreaterThan(budget.updatedAt.getTime())
    })

    it('should update monthly limit', async () => {
      const user = await createTestUser()
      const budget = await createTestBudget(user.id, {
        monthlyLimit: 50000,
      })

      const updatedBudget = await testDb.budget.update({
        where: { id: budget.id },
        data: { monthlyLimit: 75000 },
      })

      expect(Number(updatedBudget.monthlyLimit)).toBe(75000)
    })
  })

  describe('budget Categories', () => {
    it('should handle all valid expense categories', async () => {
      const user = await createTestUser()
      const currentMonth = new Date().toISOString().slice(0, 7)
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
        const budget = await testDb.budget.create({
          data: {
            userId: user.id,
            category,
            monthlyLimit: 50000,
            month: `${currentMonth}-${category}`, // Make month unique for each category
          },
        })

        expect(budget.category).toBe(category)
      }
    })
  })

  describe('budget Analysis', () => {
    it('should calculate remaining budget', async () => {
      const user = await createTestUser()
      const budget = await createTestBudget(user.id, {
        monthlyLimit: 100000,
        currentSpent: 30000,
      })

      const remaining = Number(budget.monthlyLimit) - Number(budget.currentSpent)
      expect(remaining).toBe(70000)
    })

    it('should identify over-budget scenarios', async () => {
      const user = await createTestUser()
      const budget = await createTestBudget(user.id, {
        monthlyLimit: 50000,
        currentSpent: 75000,
      })

      const isOverBudget = Number(budget.currentSpent) > Number(budget.monthlyLimit)
      expect(isOverBudget).toBe(true)
    })
  })
})
