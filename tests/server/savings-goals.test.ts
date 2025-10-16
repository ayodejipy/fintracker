import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { cleanupDatabase, createTestUser, testDb } from '../utils/database'

// Test savings goal data
const testSavingsGoal = {
  name: 'Emergency Fund',
  targetAmount: 1000000,
  targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  monthlyContribution: 50000,
}

describe('savings Goals API Logic Tests', () => {
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
      email: `savings-test-${Date.now()}@example.com`,
      name: 'Savings Test User',
      password: 'password123',
      monthlyIncome: 500000,
    })
    testUserId = user.id
  })

  describe('savings Goals Database Operations', () => {
    it('should create a new savings goal', async () => {
      const createdGoal = await testDb.savingsGoal.create({
        data: {
          ...testSavingsGoal,
          userId: testUserId,
        },
      })

      expect(createdGoal.name).toBe(testSavingsGoal.name)
      expect(Number(createdGoal.targetAmount)).toBe(testSavingsGoal.targetAmount)
      expect(Number(createdGoal.currentAmount)).toBe(0)
      expect(Number(createdGoal.monthlyContribution)).toBe(testSavingsGoal.monthlyContribution)
      expect(createdGoal.userId).toBe(testUserId)
    })

    it('should allow creating goals with various amounts', async () => {
      // Test that we can create goals with different amounts (validation happens at API level)
      const goal = await testDb.savingsGoal.create({
        data: {
          name: 'Test Goal',
          targetAmount: 100000,
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          monthlyContribution: 5000,
          userId: testUserId,
        },
      })

      expect(goal.name).toBe('Test Goal')
      expect(Number(goal.targetAmount)).toBe(100000)
      expect(Number(goal.monthlyContribution)).toBe(5000)
    })
  })

  describe('savings Goals Queries', () => {
    it('should fetch all savings goals for user', async () => {
      // Create test savings goals
      await testDb.savingsGoal.createMany({
        data: [
          {
            ...testSavingsGoal,
            userId: testUserId,
          },
          {
            name: 'Vacation Fund',
            targetAmount: 500000,
            targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            monthlyContribution: 25000,
            userId: testUserId,
          },
        ],
      })

      const goals = await testDb.savingsGoal.findMany({
        where: { userId: testUserId },
        orderBy: { targetDate: 'asc' },
      })

      expect(goals).toHaveLength(2)
      expect(goals[0].name).toBe('Vacation Fund') // Earlier target date
      expect(goals[1].name).toBe(testSavingsGoal.name)
    })

    it('should return empty array for user with no goals', async () => {
      const goals = await testDb.savingsGoal.findMany({
        where: { userId: testUserId },
      })

      expect(goals).toHaveLength(0)
    })
  })

  describe('savings Goals CRUD Operations', () => {
    it('should fetch a specific savings goal', async () => {
      const createdGoal = await testDb.savingsGoal.create({
        data: {
          ...testSavingsGoal,
          userId: testUserId,
        },
      })

      const foundGoal = await testDb.savingsGoal.findFirst({
        where: {
          id: createdGoal.id,
          userId: testUserId,
        },
      })

      expect(foundGoal).toBeTruthy()
      expect(foundGoal!.id).toBe(createdGoal.id)
      expect(foundGoal!.name).toBe(testSavingsGoal.name)
    })

    it('should update a savings goal', async () => {
      const createdGoal = await testDb.savingsGoal.create({
        data: {
          ...testSavingsGoal,
          userId: testUserId,
        },
      })

      const updateData = {
        name: 'Updated Emergency Fund',
        monthlyContribution: 75000,
      }

      const updatedGoal = await testDb.savingsGoal.update({
        where: { id: createdGoal.id },
        data: updateData,
      })

      expect(updatedGoal.name).toBe(updateData.name)
      expect(Number(updatedGoal.monthlyContribution)).toBe(updateData.monthlyContribution)
      expect(Number(updatedGoal.targetAmount)).toBe(testSavingsGoal.targetAmount) // Unchanged
    })

    it('should delete a savings goal', async () => {
      const createdGoal = await testDb.savingsGoal.create({
        data: {
          ...testSavingsGoal,
          userId: testUserId,
        },
      })

      await testDb.savingsGoal.delete({
        where: { id: createdGoal.id },
      })

      // Verify goal is deleted
      const deletedGoal = await testDb.savingsGoal.findUnique({
        where: { id: createdGoal.id },
      })
      expect(deletedGoal).toBeNull()
    })
  })

  describe('savings Goals Contributions', () => {
    it('should add contribution to savings goal', async () => {
      const createdGoal = await testDb.savingsGoal.create({
        data: {
          ...testSavingsGoal,
          userId: testUserId,
        },
      })

      const contributionAmount = 25000

      // Simulate contribution transaction
      const result = await testDb.$transaction(async (tx) => {
        // Update savings goal
        const updatedGoal = await tx.savingsGoal.update({
          where: { id: createdGoal.id },
          data: { currentAmount: contributionAmount },
        })

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: testUserId,
            amount: contributionAmount,
            category: 'savings',
            description: 'Monthly contribution',
            date: new Date(),
            type: 'expense',
          },
        })

        return updatedGoal
      })

      expect(Number(result.currentAmount)).toBe(contributionAmount)

      // Verify transaction was created
      const transaction = await testDb.transaction.findFirst({
        where: {
          userId: testUserId,
          category: 'savings',
          amount: contributionAmount,
        },
      })
      expect(transaction).toBeTruthy()
    })

    it('should handle contributions that exceed target amount', async () => {
      const createdGoal = await testDb.savingsGoal.create({
        data: {
          ...testSavingsGoal,
          currentAmount: 950000, // Close to target
          userId: testUserId,
        },
      })

      const contributionAmount = 100000 // Would exceed target
      const currentAmount = Number(createdGoal.currentAmount)
      const targetAmount = Number(createdGoal.targetAmount)
      const actualContribution = Math.min(contributionAmount, targetAmount - currentAmount)
      const newCurrentAmount = Math.min(currentAmount + contributionAmount, targetAmount)

      const updatedGoal = await testDb.savingsGoal.update({
        where: { id: createdGoal.id },
        data: { currentAmount: newCurrentAmount },
      })

      expect(Number(updatedGoal.currentAmount)).toBe(testSavingsGoal.targetAmount) // Capped at target
      expect(actualContribution).toBe(50000) // Only the remaining amount
    })
  })

  describe('savings Goals Calculations', () => {
    it('should calculate savings projection correctly', async () => {
      const createdGoal = await testDb.savingsGoal.create({
        data: {
          ...testSavingsGoal,
          currentAmount: 200000,
          userId: testUserId,
        },
      })

      const currentAmount = Number(createdGoal.currentAmount)
      const targetAmount = Number(createdGoal.targetAmount)
      const monthlyContribution = Number(createdGoal.monthlyContribution)

      const remainingAmount = targetAmount - currentAmount
      const monthsNeeded = Math.ceil(remainingAmount / monthlyContribution)
      const progressPercentage = (currentAmount / targetAmount) * 100

      expect(currentAmount).toBe(200000)
      expect(remainingAmount).toBe(800000)
      expect(monthsNeeded).toBe(16) // 800000 / 50000
      expect(progressPercentage).toBe(20) // 200000 / 1000000 * 100
    })

    it('should handle completed goals correctly', async () => {
      const completedGoal = await testDb.savingsGoal.create({
        data: {
          ...testSavingsGoal,
          currentAmount: testSavingsGoal.targetAmount, // Fully funded
          userId: testUserId,
        },
      })

      const currentAmount = Number(completedGoal.currentAmount)
      const targetAmount = Number(completedGoal.targetAmount)
      const progressPercentage = (currentAmount / targetAmount) * 100
      const isComplete = currentAmount >= targetAmount

      expect(progressPercentage).toBe(100)
      expect(isComplete).toBe(true)
    })
  })

  describe('savings Goals Analytics', () => {
    it('should provide comprehensive savings analytics', async () => {
      // Create multiple savings goals
      await testDb.savingsGoal.createMany({
        data: [
          {
            ...testSavingsGoal,
            name: 'Emergency Fund',
            currentAmount: 200000,
            userId: testUserId,
          },
          {
            name: 'Vacation Fund',
            targetAmount: 500000,
            currentAmount: 500000, // Completed goal
            targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            monthlyContribution: 25000,
            userId: testUserId,
          },
        ],
      })

      // Create some savings transactions
      await testDb.transaction.createMany({
        data: [
          {
            userId: testUserId,
            amount: 50000,
            category: 'savings',
            description: 'Emergency fund contribution',
            date: new Date(),
            type: 'expense',
          },
          {
            userId: testUserId,
            amount: 25000,
            category: 'savings',
            description: 'Vacation fund contribution',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            type: 'expense',
          },
        ],
      })

      // Fetch analytics data
      const goals = await testDb.savingsGoal.findMany({
        where: { userId: testUserId },
      })

      const transactions = await testDb.transaction.findMany({
        where: {
          userId: testUserId,
          category: 'savings',
          type: 'expense',
        },
      })

      const totalTargetAmount = goals.reduce((sum, goal) => sum + Number(goal.targetAmount), 0)
      const totalCurrentAmount = goals.reduce((sum, goal) => sum + Number(goal.currentAmount), 0)
      const completedGoals = goals.filter(goal => Number(goal.currentAmount) >= Number(goal.targetAmount))

      expect(goals).toHaveLength(2)
      expect(completedGoals).toHaveLength(1)
      expect(totalTargetAmount).toBe(1500000) // 1000000 + 500000
      expect(totalCurrentAmount).toBe(700000) // 200000 + 500000
      expect(transactions).toHaveLength(2)
    })
  })
})
