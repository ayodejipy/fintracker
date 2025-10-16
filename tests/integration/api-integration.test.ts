import { $fetch } from 'ofetch'
import { beforeEach, describe, expect, it } from 'vitest'
import { createTestUser, generateTestData } from '../e2e/setup'

describe('aPI Integration Tests', () => {
  let testUser: any

  beforeEach(async () => {
    testUser = await createTestUser()
  })

  describe('authentication API Integration', () => {
    it('should integrate registration with user creation', async () => {
      const userData = generateTestData.user()

      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: userData,
      })

      expect(response.success).toBe(true)
      expect(response.user.email).toBe(userData.email)

      // Verify user can immediately login
      const loginResponse = await $fetch('/api/auth/login', {
        method: 'POST',
        body: {
          email: userData.email,
          password: userData.password,
        },
      })

      expect(loginResponse.success).toBe(true)
      expect(loginResponse.user.id).toBe(response.user.id)
    })

    it('should handle duplicate email registration', async () => {
      const userData = generateTestData.user()

      // First registration should succeed
      await $fetch('/api/auth/register', {
        method: 'POST',
        body: userData,
      })

      // Second registration with same email should fail
      await expect(
        $fetch('/api/auth/register', {
          method: 'POST',
          body: userData,
        }),
      ).rejects.toThrow()
    })
  })

  describe('transaction API Integration', () => {
    it('should integrate transaction CRUD with database operations', async () => {
      const transactionData = generateTestData.transaction()

      // Create
      const createResponse = await $fetch('/api/transactions', {
        method: 'POST',
        body: transactionData,
        headers: { 'x-test-user': testUser.id },
      })

      expect(createResponse.success).toBe(true)
      const transactionId = createResponse.data.id

      // Read
      const getResponse = await $fetch(`/api/transactions/${transactionId}`, {
        headers: { 'x-test-user': testUser.id },
      })

      expect(getResponse.success).toBe(true)
      expect(getResponse.data.amount).toBe(transactionData.amount)

      // Update
      const updateData = { amount: transactionData.amount + 500 }
      const updateResponse = await $fetch(`/api/transactions/${transactionId}`, {
        method: 'PUT',
        body: updateData,
        headers: { 'x-test-user': testUser.id },
      })

      expect(updateResponse.success).toBe(true)
      expect(updateResponse.data.amount).toBe(updateData.amount)

      // Verify update persisted
      const verifyResponse = await $fetch(`/api/transactions/${transactionId}`, {
        headers: { 'x-test-user': testUser.id },
      })

      expect(verifyResponse.data.amount).toBe(updateData.amount)
    })

    it('should integrate transaction filtering with database queries', async () => {
      // Create test transactions
      const transactions = [
        { ...generateTestData.transaction(), category: 'food', type: 'expense', amount: 1000 },
        { ...generateTestData.transaction(), category: 'food', type: 'expense', amount: 2000 },
        { ...generateTestData.transaction(), category: 'transport', type: 'expense', amount: 1500 },
        { ...generateTestData.transaction(), category: 'salary', type: 'income', amount: 50000 },
      ]

      for (const transaction of transactions) {
        await $fetch('/api/transactions', {
          method: 'POST',
          body: transaction,
          headers: { 'x-test-user': testUser.id },
        })
      }

      // Test category filtering
      const foodTransactions = await $fetch('/api/transactions', {
        query: { category: 'food' },
        headers: { 'x-test-user': testUser.id },
      })

      expect(foodTransactions.data).toHaveLength(2)
      expect(foodTransactions.data.every((t: any) => t.category === 'food')).toBe(true)

      // Test type filtering
      const expenseTransactions = await $fetch('/api/transactions', {
        query: { type: 'expense' },
        headers: { 'x-test-user': testUser.id },
      })

      expect(expenseTransactions.data).toHaveLength(3)
      expect(expenseTransactions.data.every((t: any) => t.type === 'expense')).toBe(true)

      // Test amount range filtering
      const highValueTransactions = await $fetch('/api/transactions', {
        query: { minAmount: 2000 },
        headers: { 'x-test-user': testUser.id },
      })

      expect(highValueTransactions.data).toHaveLength(2) // 2000 food + 50000 salary
    })
  })

  describe('budget API Integration', () => {
    it('should integrate budget creation with transaction tracking', async () => {
      const budgetData = generateTestData.budget()

      // Create budget
      const budgetResponse = await $fetch('/api/budgets', {
        method: 'POST',
        body: budgetData,
        headers: { 'x-test-user': testUser.id },
      })

      expect(budgetResponse.success).toBe(true)
      const budgetId = budgetResponse.data.id

      // Add transactions in the same category
      await $fetch('/api/transactions', {
        method: 'POST',
        body: {
          ...generateTestData.transaction(),
          category: budgetData.category,
          amount: 5000,
          type: 'expense',
        },
        headers: { 'x-test-user': testUser.id },
      })

      await $fetch('/api/transactions', {
        method: 'POST',
        body: {
          ...generateTestData.transaction(),
          category: budgetData.category,
          amount: 3000,
          type: 'expense',
        },
        headers: { 'x-test-user': testUser.id },
      })

      // Sync budget with transactions
      const syncResponse = await $fetch('/api/budgets/sync', {
        method: 'POST',
        headers: { 'x-test-user': testUser.id },
      })

      expect(syncResponse.success).toBe(true)

      // Verify budget was updated
      const updatedBudget = await $fetch(`/api/budgets/${budgetId}`, {
        headers: { 'x-test-user': testUser.id },
      })

      expect(updatedBudget.data.currentSpent).toBe(8000) // 5000 + 3000
    })

    it('should integrate budget analysis with multiple budgets', async () => {
      // Create multiple budgets
      const budgets = [
        { category: 'food', monthlyLimit: 20000, month: '2024-01' },
        { category: 'transport', monthlyLimit: 15000, month: '2024-01' },
        { category: 'entertainment', monthlyLimit: 10000, month: '2024-01' },
      ]

      for (const budget of budgets) {
        await $fetch('/api/budgets', {
          method: 'POST',
          body: budget,
          headers: { 'x-test-user': testUser.id },
        })
      }

      // Get budget analysis
      const analysisResponse = await $fetch('/api/budgets/analysis', {
        headers: { 'x-test-user': testUser.id },
      })

      expect(analysisResponse.success).toBe(true)
      expect(analysisResponse.data.totalBudgets).toBe(3)
      expect(analysisResponse.data.totalLimit).toBe(45000) // 20000 + 15000 + 10000
      expect(analysisResponse.data.categories).toHaveLength(3)
    })
  })

  describe('loan API Integration', () => {
    it('should integrate loan payments with balance calculations', async () => {
      const loanData = generateTestData.loan()

      // Create loan
      const loanResponse = await $fetch('/api/loans', {
        method: 'POST',
        body: loanData,
        headers: { 'x-test-user': testUser.id },
      })

      expect(loanResponse.success).toBe(true)
      const loanId = loanResponse.data.id
      const initialBalance = loanResponse.data.currentBalance

      // Make multiple payments
      const payments = [10000, 5000, 7500]

      for (const amount of payments) {
        const paymentResponse = await $fetch(`/api/loans/${loanId}/payment`, {
          method: 'POST',
          body: { amount, date: new Date() },
          headers: { 'x-test-user': testUser.id },
        })

        expect(paymentResponse.success).toBe(true)
      }

      // Verify final balance
      const finalLoan = await $fetch(`/api/loans/${loanId}`, {
        headers: { 'x-test-user': testUser.id },
      })

      const expectedBalance = initialBalance - payments.reduce((sum, payment) => sum + payment, 0)
      expect(finalLoan.data.currentBalance).toBe(expectedBalance)
    })

    it('should integrate loan projections with interest calculations', async () => {
      const loanData = {
        ...generateTestData.loan(),
        currentBalance: 100000,
        monthlyPayment: 10000,
        interestRate: 12.0, // 12% annual
      }

      // Create loan
      const loanResponse = await $fetch('/api/loans', {
        method: 'POST',
        body: loanData,
        headers: { 'x-test-user': testUser.id },
      })

      const loanId = loanResponse.data.id

      // Get projection
      const projectionResponse = await $fetch(`/api/loans/${loanId}/projection`, {
        headers: { 'x-test-user': testUser.id },
      })

      expect(projectionResponse.success).toBe(true)
      expect(projectionResponse.data.payoffDate).toBeDefined()
      expect(projectionResponse.data.totalInterest).toBeGreaterThan(0)
      expect(projectionResponse.data.monthsToPayoff).toBeGreaterThan(0)
    })
  })

  describe('savings Goals API Integration', () => {
    it('should integrate savings contributions with goal progress', async () => {
      const goalData = generateTestData.savingsGoal()

      // Create savings goal
      const goalResponse = await $fetch('/api/savings-goals', {
        method: 'POST',
        body: goalData,
        headers: { 'x-test-user': testUser.id },
      })

      expect(goalResponse.success).toBe(true)
      const goalId = goalResponse.data.id
      const initialAmount = goalResponse.data.currentAmount

      // Make multiple contributions
      const contributions = [5000, 10000, 7500]

      for (const amount of contributions) {
        const contributionResponse = await $fetch(`/api/savings-goals/${goalId}/contribute`, {
          method: 'POST',
          body: { amount, date: new Date() },
          headers: { 'x-test-user': testUser.id },
        })

        expect(contributionResponse.success).toBe(true)
      }

      // Verify final amount
      const finalGoal = await $fetch(`/api/savings-goals/${goalId}`, {
        headers: { 'x-test-user': testUser.id },
      })

      const expectedAmount = initialAmount + contributions.reduce((sum, contribution) => sum + contribution, 0)
      expect(finalGoal.data.currentAmount).toBe(expectedAmount)

      // Check progress percentage
      const progressPercentage = (expectedAmount / goalData.targetAmount) * 100
      expect(finalGoal.data.progressPercentage).toBeCloseTo(progressPercentage, 1)
    })

    it('should integrate savings analytics with multiple goals', async () => {
      // Create multiple savings goals
      const goals = [
        { ...generateTestData.savingsGoal(), name: 'Emergency Fund', targetAmount: 100000 },
        { ...generateTestData.savingsGoal(), name: 'Vacation', targetAmount: 50000 },
        { ...generateTestData.savingsGoal(), name: 'Car Purchase', targetAmount: 200000 },
      ]

      for (const goal of goals) {
        await $fetch('/api/savings-goals', {
          method: 'POST',
          body: goal,
          headers: { 'x-test-user': testUser.id },
        })
      }

      // Get analytics
      const analyticsResponse = await $fetch('/api/savings-goals/analytics', {
        headers: { 'x-test-user': testUser.id },
      })

      expect(analyticsResponse.success).toBe(true)
      expect(analyticsResponse.data.totalGoals).toBe(3)
      expect(analyticsResponse.data.totalTargetAmount).toBe(350000) // 100000 + 50000 + 200000
      expect(analyticsResponse.data.goals).toHaveLength(3)
    })
  })

  describe('dashboard API Integration', () => {
    it('should integrate dashboard data from multiple sources', async () => {
      // Create comprehensive test data
      const transactions = [
        { ...generateTestData.transaction(), amount: 100000, type: 'income', category: 'salary' },
        { ...generateTestData.transaction(), amount: 25000, type: 'expense', category: 'food' },
        { ...generateTestData.transaction(), amount: 15000, type: 'expense', category: 'transport' },
        { ...generateTestData.transaction(), amount: 10000, type: 'expense', category: 'entertainment' },
      ]

      for (const transaction of transactions) {
        await $fetch('/api/transactions', {
          method: 'POST',
          body: transaction,
          headers: { 'x-test-user': testUser.id },
        })
      }

      // Create budgets
      await $fetch('/api/budgets', {
        method: 'POST',
        body: { category: 'food', monthlyLimit: 30000, month: '2024-01' },
        headers: { 'x-test-user': testUser.id },
      })

      // Create loan
      await $fetch('/api/loans', {
        method: 'POST',
        body: generateTestData.loan(),
        headers: { 'x-test-user': testUser.id },
      })

      // Create savings goal
      await $fetch('/api/savings-goals', {
        method: 'POST',
        body: generateTestData.savingsGoal(),
        headers: { 'x-test-user': testUser.id },
      })

      // Get dashboard overview
      const overviewResponse = await $fetch('/api/dashboard/overview', {
        headers: { 'x-test-user': testUser.id },
      })

      expect(overviewResponse.success).toBe(true)
      expect(overviewResponse.data.totalIncome).toBe(100000)
      expect(overviewResponse.data.totalExpenses).toBe(50000) // 25000 + 15000 + 10000
      expect(overviewResponse.data.netIncome).toBe(50000)
      expect(overviewResponse.data.totalLoans).toBe(1)
      expect(overviewResponse.data.totalSavingsGoals).toBe(1)

      // Get monthly summary
      const summaryResponse = await $fetch('/api/dashboard/monthly-summary', {
        headers: { 'x-test-user': testUser.id },
      })

      expect(summaryResponse.success).toBe(true)
      expect(summaryResponse.data.income).toBe(100000)
      expect(summaryResponse.data.expenses).toBe(50000)
      expect(summaryResponse.data.netIncome).toBe(50000)
    })
  })

  describe('cross-Feature Integration', () => {
    it('should integrate budget alerts with notification system', async () => {
      // Set up notification preferences
      await $fetch('/api/notifications/preferences', {
        method: 'PUT',
        body: {
          budgetAlerts: true,
          budgetThreshold: 80,
          pushNotifications: true,
        },
        headers: { 'x-test-user': testUser.id },
      })

      // Create budget
      const budgetResponse = await $fetch('/api/budgets', {
        method: 'POST',
        body: { category: 'food', monthlyLimit: 10000, month: '2024-01' },
        headers: { 'x-test-user': testUser.id },
      })

      // Add transaction that triggers alert (90% of budget)
      await $fetch('/api/transactions', {
        method: 'POST',
        body: {
          ...generateTestData.transaction(),
          category: 'food',
          amount: 9000,
          type: 'expense',
        },
        headers: { 'x-test-user': testUser.id },
      })

      // Sync budget
      await $fetch('/api/budgets/sync', {
        method: 'POST',
        headers: { 'x-test-user': testUser.id },
      })

      // Check for notifications
      const notificationsResponse = await $fetch('/api/notifications', {
        headers: { 'x-test-user': testUser.id },
      })

      expect(notificationsResponse.success).toBe(true)
      const budgetAlerts = notificationsResponse.data.filter(
        (n: any) => n.type === 'budget_alert',
      )
      expect(budgetAlerts.length).toBeGreaterThan(0)
    })

    it('should integrate loan payments with transaction records', async () => {
      // Create loan
      const loanResponse = await $fetch('/api/loans', {
        method: 'POST',
        body: generateTestData.loan(),
        headers: { 'x-test-user': testUser.id },
      })

      const loanId = loanResponse.data.id

      // Make loan payment
      await $fetch(`/api/loans/${loanId}/payment`, {
        method: 'POST',
        body: { amount: 15000, date: new Date() },
        headers: { 'x-test-user': testUser.id },
      })

      // Verify transaction was created
      const transactionsResponse = await $fetch('/api/transactions', {
        query: { category: 'loan_repayment' },
        headers: { 'x-test-user': testUser.id },
      })

      expect(transactionsResponse.success).toBe(true)
      expect(transactionsResponse.data.length).toBeGreaterThan(0)

      const loanPaymentTransaction = transactionsResponse.data.find(
        (t: any) => t.amount === 15000 && t.type === 'expense',
      )
      expect(loanPaymentTransaction).toBeDefined()
    })
  })
})
