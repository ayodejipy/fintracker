import { $fetch } from 'ofetch'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  createTestBudget,
  createTestLoan,
  createTestSavingsGoal,
  createTestTransaction,
  createTestUser,
  generateTestData,
} from './setup'

// Mock session for API calls
function mockSession(user: any) {
  return {
    user: { id: user.id, email: user.email, name: user.name },
  }
}

describe('complete User Journey E2E Tests', () => {
  let testUser: any

  beforeEach(async () => {
    testUser = await createTestUser()
  })

  describe('user Registration and Authentication Journey', () => {
    it('should complete full registration flow', async () => {
      const userData = generateTestData.user()

      // Test registration
      const registerResponse = await $fetch('/api/auth/register', {
        method: 'POST',
        body: userData,
      })

      expect(registerResponse.success).toBe(true)
      expect(registerResponse.user).toBeDefined()
      expect(registerResponse.user.email).toBe(userData.email)
      expect(registerResponse.user.name).toBe(userData.name)
    })

    it('should handle login flow', async () => {
      // Test login with valid credentials
      const loginResponse = await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email: testUser.email,
          password: 'hashedpassword123',
        },
      })

      expect(loginResponse.success).toBe(true)
      expect(loginResponse.user.id).toBe(testUser.id)
    })

    it('should reject invalid login credentials', async () => {
      await expect(
        $fetch('/api/auth/login', {
          method: 'POST',
          body: {
            email: testUser.email,
            password: 'wrongpassword',
          },
        }),
      ).rejects.toThrow()
    })
  })

  describe('transaction Management Journey', () => {
    it('should complete full transaction lifecycle', async () => {
      const transactionData = generateTestData.transaction()

      // Create transaction
      const createResponse = await $fetch('/api/transactions', {
        method: 'POST',
        body: transactionData,
        headers: {
          'x-test-user': testUser.id, // Mock authentication
        },
      })

      expect(createResponse.success).toBe(true)
      expect(createResponse.data.amount).toBe(transactionData.amount)
      expect(createResponse.data.category).toBe(transactionData.category)

      const transactionId = createResponse.data.id

      // Get transaction
      const getResponse = await $fetch(`/api/transactions/${transactionId}`, {
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(getResponse.success).toBe(true)
      expect(getResponse.data.id).toBe(transactionId)

      // Update transaction
      const updateData = { amount: transactionData.amount + 1000 }
      const updateResponse = await $fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        body: updateData,
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(updateResponse.success).toBe(true)
      expect(updateResponse.data.amount).toBe(updateData.amount)

      // Get transaction summary
      const summaryResponse = await $fetch('/api/transactions/summary', {
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(summaryResponse.success).toBe(true)
      expect(summaryResponse.data).toBeDefined()
    })

    it('should handle transaction filtering and search', async () => {
      // Create multiple transactions
      await createTestTransaction(testUser.id, {
        category: 'food',
        amount: 5000,
        type: 'expense',
      })
      await createTestTransaction(testUser.id, {
        category: 'transport',
        amount: 3000,
        type: 'expense',
      })
      await createTestTransaction(testUser.id, {
        category: 'salary',
        amount: 50000,
        type: 'income',
      })

      // Test filtering by type
      const expenseResponse = await $fetch('/api/transactions', {
        query: { type: 'expense' },
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(expenseResponse.success).toBe(true)
      expect(expenseResponse.data.every((t: any) => t.type === 'expense')).toBe(true)

      // Test filtering by category
      const foodResponse = await $fetch('/api/transactions', {
        query: { category: 'food' },
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(foodResponse.success).toBe(true)
      expect(foodResponse.data.every((t: any) => t.category === 'food')).toBe(true)
    })
  })

  describe('budget Management Journey', () => {
    it('should complete budget lifecycle with spending tracking', async () => {
      const budgetData = generateTestData.budget()

      // Create budget
      const createResponse = await $fetch('/api/budgets', {
        method: 'POST',
        body: budgetData,
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(createResponse.success).toBe(true)
      expect(createResponse.data.monthlyLimit).toBe(budgetData.monthlyLimit)

      const budgetId = createResponse.data.id

      // Add transactions that affect budget
      await createTestTransaction(testUser.id, {
        category: budgetData.category,
        amount: 5000,
        type: 'expense',
      })

      await createTestTransaction(testUser.id, {
        category: budgetData.category,
        amount: 3000,
        type: 'expense',
      })

      // Sync budget with transactions
      const syncResponse = await $fetch('/api/budgets/sync', {
        method: 'POST',
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(syncResponse.success).toBe(true)

      // Get updated budget
      const updatedBudget = await $fetch(`/api/budgets/${budgetId}`, {
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(updatedBudget.success).toBe(true)
      expect(updatedBudget.data.currentSpent).toBe(8000) // 5000 + 3000

      // Get budget analysis
      const analysisResponse = await $fetch('/api/budgets/analysis', {
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(analysisResponse.success).toBe(true)
      expect(analysisResponse.data).toBeDefined()
    })

    it('should trigger budget alerts when overspending', async () => {
      // Create budget with low limit
      const budget = await createTestBudget(testUser.id, {
        monthlyLimit: 10000,
        currentSpent: 0,
      })

      // Add transaction that exceeds budget
      await createTestTransaction(testUser.id, {
        category: budget.category,
        amount: 12000,
        type: 'expense',
      })

      // Sync budget
      await $fetch('/api/budgets/sync', {
        method: 'POST',
        headers: {
          'x-test-user': testUser.id,
        },
      })

      // Check for budget alert notifications
      const notificationsResponse = await $fetch('/api/notifications', {
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(notificationsResponse.success).toBe(true)
      const budgetAlerts = notificationsResponse.data.filter(
        (n: any) => n.type === 'budget_alert',
      )
      expect(budgetAlerts.length).toBeGreaterThan(0)
    })
  })

  describe('loan Management Journey', () => {
    it('should complete loan lifecycle with payments', async () => {
      const loanData = generateTestData.loan()

      // Create loan
      const createResponse = await $fetch('/api/loans', {
        method: 'POST',
        body: loanData,
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(createResponse.success).toBe(true)
      expect(createResponse.data.initialAmount).toBe(loanData.initialAmount)

      const loanId = createResponse.data.id

      // Make a payment
      const paymentResponse = await $fetch(`/api/loans/${loanId}/payment`, {
        method: 'POST',
        body: {
          amount: 15000,
          date: new Date(),
        },
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(paymentResponse.success).toBe(true)

      // Get updated loan
      const updatedLoan = await $fetch(`/api/loans/${loanId}`, {
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(updatedLoan.success).toBe(true)
      expect(updatedLoan.data.currentBalance).toBe(loanData.currentBalance - 15000)

      // Get loan projection
      const projectionResponse = await $fetch(`/api/loans/${loanId}/projection`, {
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(projectionResponse.success).toBe(true)
      expect(projectionResponse.data.payoffDate).toBeDefined()
      expect(projectionResponse.data.totalInterest).toBeDefined()
    })
  })

  describe('savings Goals Journey', () => {
    it('should complete savings goal lifecycle with contributions', async () => {
      const goalData = generateTestData.savingsGoal()

      // Create savings goal
      const createResponse = await $fetch('/api/savings-goals', {
        method: 'POST',
        body: goalData,
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(createResponse.success).toBe(true)
      expect(createResponse.data.targetAmount).toBe(goalData.targetAmount)

      const goalId = createResponse.data.id

      // Make a contribution
      const contributionResponse = await $fetch(`/api/savings-goals/${goalId}/contribute`, {
        method: 'POST',
        body: {
          amount: 10000,
          date: new Date(),
        },
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(contributionResponse.success).toBe(true)

      // Get updated goal
      const updatedGoal = await $fetch(`/api/savings-goals/${goalId}`, {
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(updatedGoal.success).toBe(true)
      expect(updatedGoal.data.currentAmount).toBe(goalData.currentAmount + 10000)

      // Get goal projection
      const projectionResponse = await $fetch(`/api/savings-goals/${goalId}/projection`, {
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(projectionResponse.success).toBe(true)
      expect(projectionResponse.data.projectedCompletionDate).toBeDefined()

      // Get analytics
      const analyticsResponse = await $fetch('/api/savings-goals/analytics', {
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(analyticsResponse.success).toBe(true)
      expect(analyticsResponse.data.totalGoals).toBeGreaterThan(0)
    })
  })

  describe('dashboard Data Integration Journey', () => {
    it('should provide comprehensive dashboard data', async () => {
      // Create comprehensive test data
      await createTestTransaction(testUser.id, { amount: 50000, type: 'income' })
      await createTestTransaction(testUser.id, { amount: 15000, type: 'expense', category: 'food' })
      await createTestTransaction(testUser.id, { amount: 8000, type: 'expense', category: 'transport' })

      await createTestBudget(testUser.id, { category: 'food', monthlyLimit: 20000 })
      await createTestLoan(testUser.id)
      await createTestSavingsGoal(testUser.id)

      // Get dashboard overview
      const overviewResponse = await $fetch('/api/dashboard/overview', {
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(overviewResponse.success).toBe(true)
      expect(overviewResponse.data.totalIncome).toBe(50000)
      expect(overviewResponse.data.totalExpenses).toBe(23000)
      expect(overviewResponse.data.netIncome).toBe(27000)

      // Get monthly summary
      const summaryResponse = await $fetch('/api/dashboard/monthly-summary', {
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(summaryResponse.success).toBe(true)
      expect(summaryResponse.data.currentMonth).toBeDefined()
      expect(summaryResponse.data.income).toBeDefined()
      expect(summaryResponse.data.expenses).toBeDefined()
    })
  })

  describe('notification System Journey', () => {
    it('should handle notification preferences and delivery', async () => {
      // Set notification preferences
      const preferencesResponse = await $fetch('/api/notifications/preferences', {
        method: 'PUT',
        body: {
          budgetAlerts: true,
          paymentReminders: true,
          savingsReminders: false,
          goalAchievements: true,
          emailNotifications: false,
          pushNotifications: true,
          budgetThreshold: 80,
          reminderDaysBefore: 3,
        },
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(preferencesResponse.success).toBe(true)

      // Create a scenario that should trigger notifications
      await createTestBudget(testUser.id, {
        monthlyLimit: 10000,
        currentSpent: 9000, // 90% spent, should trigger alert
      })

      // Get notifications
      const notificationsResponse = await $fetch('/api/notifications', {
        headers: {
          'x-test-user': testUser.id,
        },
      })

      expect(notificationsResponse.success).toBe(true)
      expect(Array.isArray(notificationsResponse.data)).toBe(true)

      // Mark notification as read
      if (notificationsResponse.data.length > 0) {
        const notificationId = notificationsResponse.data[0].id
        const markReadResponse = await $fetch(`/api/notifications/${notificationId}/read`, {
          method: 'POST',
          headers: {
            'x-test-user': testUser.id,
          },
        })

        expect(markReadResponse.success).toBe(true)
      }
    })
  })

  describe('error Handling and Edge Cases', () => {
    it('should handle invalid data gracefully', async () => {
      // Test invalid transaction data
      await expect(
        $fetch('/api/transactions', {
          method: 'POST',
          body: {
            amount: -1000, // negative amount
            category: '', // empty category
            description: '', // empty description
            type: 'invalid', // invalid type
          },
          headers: {
            'x-test-user': testUser.id,
          },
        }),
      ).rejects.toThrow()

      // Test unauthorized access
      await expect(
        $fetch('/api/transactions', {
          method: 'POST',
          body: generateTestData.transaction(),
          // No authentication header
        }),
      ).rejects.toThrow()

      // Test accessing non-existent resource
      await expect(
        $fetch('/api/transactions/non-existent-id', {
          headers: {
            'x-test-user': testUser.id,
          },
        }),
      ).rejects.toThrow()
    })

    it('should handle concurrent operations', async () => {
      const loan = await createTestLoan(testUser.id, { currentBalance: 50000 })

      // Make concurrent payments
      const payment1 = $fetch(`/api/loans/${loan.id}/payment`, {
        method: 'POST',
        body: { amount: 10000 },
        headers: { 'x-test-user': testUser.id },
      })

      const payment2 = $fetch(`/api/loans/${loan.id}/payment`, {
        method: 'POST',
        body: { amount: 15000 },
        headers: { 'x-test-user': testUser.id },
      })

      const [result1, result2] = await Promise.all([payment1, payment2])

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      // Verify final balance is correct
      const finalLoan = await $fetch(`/api/loans/${loan.id}`, {
        headers: { 'x-test-user': testUser.id },
      })

      expect(finalLoan.data.currentBalance).toBe(25000) // 50000 - 10000 - 15000
    })
  })
})
