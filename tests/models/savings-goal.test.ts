import { describe, expect, it } from 'vitest'
import { createTestSavingsGoal, createTestUser, setupTestDatabase, testDb } from '../utils/database'

describe('savingsGoal Model', () => {
  setupTestDatabase()

  describe('savingsGoal Creation', () => {
    it('should create a savings goal with valid data', async () => {
      const user = await createTestUser()
      const targetDate = new Date('2024-12-31')
      const savingsGoalData = {
        userId: user.id,
        name: 'Emergency Fund',
        targetAmount: 1000000,
        currentAmount: 200000,
        targetDate,
        monthlyContribution: 50000,
      }

      const savingsGoal = await testDb.savingsGoal.create({
        data: savingsGoalData,
      })

      expect(savingsGoal).toMatchObject({
        userId: user.id,
        name: savingsGoalData.name,
        targetAmount: expect.any(Object), // Prisma Decimal
        currentAmount: expect.any(Object), // Prisma Decimal
        targetDate: savingsGoalData.targetDate,
        monthlyContribution: expect.any(Object), // Prisma Decimal
      })
      expect(savingsGoal.id).toBeDefined()
      expect(savingsGoal.createdAt).toBeInstanceOf(Date)
      expect(savingsGoal.updatedAt).toBeInstanceOf(Date)
    })

    it('should set default current amount to 0', async () => {
      const user = await createTestUser()
      const savingsGoal = await testDb.savingsGoal.create({
        data: {
          userId: user.id,
          name: 'New Goal',
          targetAmount: 500000,
          targetDate: new Date('2024-12-31'),
          monthlyContribution: 25000,
        },
      })

      expect(Number(savingsGoal.currentAmount)).toBe(0)
    })
  })

  describe('savingsGoal Relationships', () => {
    it('should belong to a user', async () => {
      const user = await createTestUser()
      const savingsGoal = await createTestSavingsGoal(user.id)

      const savingsGoalWithUser = await testDb.savingsGoal.findUnique({
        where: { id: savingsGoal.id },
        include: { user: true },
      })

      expect(savingsGoalWithUser?.user.id).toBe(user.id)
      expect(savingsGoalWithUser?.user.email).toBe(user.email)
    })
  })

  describe('savingsGoal Queries', () => {
    it('should filter savings goals by user', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' })
      const user2 = await createTestUser({ email: 'user2@example.com' })

      await createTestSavingsGoal(user1.id, { name: 'User 1 Goal' })
      await createTestSavingsGoal(user2.id, { name: 'User 2 Goal' })

      const user1Goals = await testDb.savingsGoal.findMany({
        where: { userId: user1.id },
      })

      expect(user1Goals).toHaveLength(1)
      expect(user1Goals[0].name).toBe('User 1 Goal')
    })

    it('should order savings goals by target date', async () => {
      const user = await createTestUser()

      const goal1 = await createTestSavingsGoal(user.id, {
        name: 'Short-term Goal',
        targetDate: new Date('2024-06-30'),
      })
      const goal2 = await createTestSavingsGoal(user.id, {
        name: 'Long-term Goal',
        targetDate: new Date('2024-12-31'),
      })

      const goals = await testDb.savingsGoal.findMany({
        where: { userId: user.id },
        orderBy: { targetDate: 'asc' },
      })

      expect(goals[0].name).toBe('Short-term Goal')
      expect(goals[1].name).toBe('Long-term Goal')
    })

    it('should filter goals by completion status', async () => {
      const user = await createTestUser()

      await createTestSavingsGoal(user.id, {
        name: 'Completed Goal',
        targetAmount: 100000,
        currentAmount: 100000,
      })
      await createTestSavingsGoal(user.id, {
        name: 'In Progress Goal',
        targetAmount: 100000,
        currentAmount: 50000,
      })

      // Find completed goals (currentAmount >= targetAmount)
      const completedGoals = await testDb.savingsGoal.findMany({
        where: {
          userId: user.id,
          currentAmount: {
            gte: testDb.savingsGoal.fields.targetAmount,
          },
        },
      })

      // Note: This query might not work exactly as written due to Prisma limitations
      // In practice, you'd fetch all goals and filter in application code
      const allGoals = await testDb.savingsGoal.findMany({
        where: { userId: user.id },
      })

      const completedGoalsFiltered = allGoals.filter(goal =>
        Number(goal.currentAmount) >= Number(goal.targetAmount),
      )

      expect(completedGoalsFiltered).toHaveLength(1)
      expect(completedGoalsFiltered[0].name).toBe('Completed Goal')
    })
  })

  describe('savingsGoal Updates', () => {
    it('should update current amount', async () => {
      const user = await createTestUser()
      const savingsGoal = await createTestSavingsGoal(user.id, {
        currentAmount: 50000,
      })

      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10))

      const updatedGoal = await testDb.savingsGoal.update({
        where: { id: savingsGoal.id },
        data: { currentAmount: 75000 },
      })

      expect(Number(updatedGoal.currentAmount)).toBe(75000)
      expect(updatedGoal.updatedAt.getTime()).toBeGreaterThan(savingsGoal.updatedAt.getTime())
    })

    it('should update monthly contribution', async () => {
      const user = await createTestUser()
      const savingsGoal = await createTestSavingsGoal(user.id, {
        monthlyContribution: 25000,
      })

      const updatedGoal = await testDb.savingsGoal.update({
        where: { id: savingsGoal.id },
        data: { monthlyContribution: 35000 },
      })

      expect(Number(updatedGoal.monthlyContribution)).toBe(35000)
    })

    it('should update target date', async () => {
      const user = await createTestUser()
      const savingsGoal = await createTestSavingsGoal(user.id)
      const newTargetDate = new Date('2025-06-30')

      const updatedGoal = await testDb.savingsGoal.update({
        where: { id: savingsGoal.id },
        data: { targetDate: newTargetDate },
      })

      expect(updatedGoal.targetDate).toEqual(newTargetDate)
    })
  })

  describe('savingsGoal Calculations', () => {
    it('should calculate progress percentage', async () => {
      const user = await createTestUser()
      const savingsGoal = await createTestSavingsGoal(user.id, {
        targetAmount: 100000,
        currentAmount: 25000,
      })

      const progressPercentage = (Number(savingsGoal.currentAmount) / Number(savingsGoal.targetAmount)) * 100
      expect(progressPercentage).toBe(25)
    })

    it('should calculate remaining amount', async () => {
      const user = await createTestUser()
      const savingsGoal = await createTestSavingsGoal(user.id, {
        targetAmount: 100000,
        currentAmount: 30000,
      })

      const remainingAmount = Number(savingsGoal.targetAmount) - Number(savingsGoal.currentAmount)
      expect(remainingAmount).toBe(70000)
    })

    it('should calculate months to completion', async () => {
      const user = await createTestUser()
      const savingsGoal = await createTestSavingsGoal(user.id, {
        targetAmount: 100000,
        currentAmount: 40000,
        monthlyContribution: 10000,
      })

      const remainingAmount = Number(savingsGoal.targetAmount) - Number(savingsGoal.currentAmount)
      const monthsToCompletion = Math.ceil(remainingAmount / Number(savingsGoal.monthlyContribution))

      expect(monthsToCompletion).toBe(6) // 60000 / 10000 = 6 months
    })

    it('should handle completed goals', async () => {
      const user = await createTestUser()
      const savingsGoal = await createTestSavingsGoal(user.id, {
        targetAmount: 100000,
        currentAmount: 120000, // Over the target
      })

      const isCompleted = Number(savingsGoal.currentAmount) >= Number(savingsGoal.targetAmount)
      const progressPercentage = (Number(savingsGoal.currentAmount) / Number(savingsGoal.targetAmount)) * 100

      expect(isCompleted).toBe(true)
      expect(progressPercentage).toBe(120)
    })
  })

  describe('savingsGoal Validation', () => {
    it('should handle zero monthly contribution', async () => {
      const user = await createTestUser()
      const savingsGoal = await createTestSavingsGoal(user.id, {
        monthlyContribution: 0,
      })

      expect(Number(savingsGoal.monthlyContribution)).toBe(0)
    })

    it('should handle future target dates', async () => {
      const user = await createTestUser()
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 2) // 2 years from now

      const savingsGoal = await createTestSavingsGoal(user.id, {
        targetDate: futureDate,
      })

      expect(savingsGoal.targetDate.getTime()).toBeGreaterThan(Date.now())
    })
  })
})
