import { performance } from 'node:perf_hooks'
import { $fetch } from 'ofetch'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  calculateBudgetAnalysis,
  calculateCompoundInterest,
  calculateLoanPayoff,
  calculateMonthlyPayment,
  calculateSavingsProjection,
} from '../../app/utils/financial-calculations'
import { createTestTransaction, createTestUser, generateTestData } from '../e2e/setup'

describe('performance Tests', () => {
  let testUser: any

  beforeEach(async () => {
    testUser = await createTestUser()
  })

  describe('financial Calculations Performance', () => {
    it('should calculate loan payoff efficiently for large amounts', () => {
      const startTime = performance.now()

      // Test with large loan amount
      const result = calculateLoanPayoff({
        currentBalance: 10000000, // 10 million
        monthlyPayment: 100000, // 100k monthly
        annualInterestRate: 15.5,
      })

      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(result.monthsToPayoff).toBeGreaterThan(0)
      expect(result.totalInterest).toBeGreaterThan(0)
      expect(executionTime).toBeLessThan(100) // Should complete in under 100ms
    })

    it('should calculate savings projections efficiently for long-term goals', () => {
      const startTime = performance.now()

      // Test with 30-year savings projection
      const targetDate = new Date()
      targetDate.setFullYear(targetDate.getFullYear() + 30)

      const result = calculateSavingsProjection({
        currentAmount: 100000,
        monthlyContribution: 50000,
        targetAmount: 50000000, // 50 million target
        targetDate,
        annualInterestRate: 8.5,
      })

      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(result.projectedAmount).toBeGreaterThan(0)
      expect(result.monthsToTarget).toBeGreaterThan(0)
      expect(executionTime).toBeLessThan(50) // Should complete in under 50ms
    })

    it('should handle compound interest calculations efficiently', () => {
      const startTime = performance.now()

      // Test compound interest for 50 years
      const result = calculateCompoundInterest({
        principal: 1000000,
        annualRate: 12.5,
        compoundingFrequency: 12, // Monthly compounding
        years: 50,
      })

      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(result.finalAmount).toBeGreaterThan(1000000)
      expect(result.totalInterest).toBeGreaterThan(0)
      expect(executionTime).toBeLessThan(10) // Should complete in under 10ms
    })

    it('should calculate monthly payments efficiently for various scenarios', () => {
      const scenarios = [
        { principal: 500000, rate: 8.5, years: 5 },
        { principal: 2000000, rate: 12.0, years: 10 },
        { principal: 10000000, rate: 15.5, years: 20 },
        { principal: 50000000, rate: 18.0, years: 30 },
      ]

      const startTime = performance.now()

      const results = scenarios.map(scenario =>
        calculateMonthlyPayment(scenario.principal, scenario.rate, scenario.years),
      )

      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(results).toHaveLength(4)
      results.forEach((result) => {
        expect(result).toBeGreaterThan(0)
        expect(Number.isFinite(result)).toBe(true)
      })
      expect(executionTime).toBeLessThan(20) // All calculations in under 20ms
    })

    it('should handle budget analysis for large datasets efficiently', () => {
      const transactions = Array.from({ length: 1000 }, (_, i) => ({
        id: `trans-${i}`,
        amount: Math.random() * 50000 + 1000,
        category: ['food', 'transport', 'housing', 'entertainment', 'utilities'][i % 5],
        type: Math.random() > 0.3 ? 'expense' : 'income',
        date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      }))

      const budgets = [
        { category: 'food', limit: 50000 },
        { category: 'transport', limit: 30000 },
        { category: 'housing', limit: 100000 },
        { category: 'entertainment', limit: 25000 },
        { category: 'utilities', limit: 20000 },
      ]

      const startTime = performance.now()

      const result = calculateBudgetAnalysis(transactions as any, budgets)

      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(result.categories).toHaveLength(5)
      expect(result.totalSpent).toBeGreaterThan(0)
      expect(result.totalBudget).toBe(225000) // Sum of all budget limits
      expect(executionTime).toBeLessThan(100) // Should handle 1000 transactions in under 100ms
    })
  })

  describe('database Operations Performance', () => {
    it('should handle bulk transaction creation efficiently', async () => {
      const transactionCount = 100
      const transactions = Array.from({ length: transactionCount }, () =>
        generateTestData.transaction())

      const startTime = performance.now()

      // Create transactions in parallel batches
      const batchSize = 10
      const batches = []

      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize)
        const batchPromises = batch.map(transaction =>
          $fetch('/api/transactions', {
            method: 'POST',
            body: transaction,
            headers: { 'x-test-user': testUser.id },
          }),
        )
        batches.push(Promise.all(batchPromises))
      }

      const results = await Promise.all(batches)

      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(results.flat()).toHaveLength(transactionCount)
      expect(executionTime).toBeLessThan(5000) // Should complete in under 5 seconds

      // Verify all transactions were created
      const allTransactions = await $fetch('/api/transactions', {
        headers: { 'x-test-user': testUser.id },
      })

      expect(allTransactions.data.length).toBe(transactionCount)
    })

    it('should handle complex transaction queries efficiently', async () => {
      // Create test data
      const transactionCount = 500
      const categories = ['food', 'transport', 'housing', 'entertainment', 'utilities']

      for (let i = 0; i < transactionCount; i++) {
        await createTestTransaction(testUser.id, {
          category: categories[i % categories.length],
          amount: Math.random() * 10000 + 1000,
          type: Math.random() > 0.5 ? 'expense' : 'income',
          date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        })
      }

      // Test various query patterns
      const queries = [
        { type: 'expense' },
        { category: 'food' },
        { minAmount: 5000 },
        { type: 'expense', category: 'transport' },
        { minAmount: 2000, maxAmount: 8000 },
      ]

      const startTime = performance.now()

      const results = await Promise.all(
        queries.map(query =>
          $fetch('/api/transactions', {
            query,
            headers: { 'x-test-user': testUser.id },
          }),
        ),
      )

      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(results).toHaveLength(queries.length)
      results.forEach((result) => {
        expect(result.success).toBe(true)
        expect(Array.isArray(result.data)).toBe(true)
      })
      expect(executionTime).toBeLessThan(2000) // All queries in under 2 seconds
    })

    it('should handle dashboard data aggregation efficiently', async () => {
      // Create comprehensive test data
      const dataCreationPromises = []

      // Create 200 transactions
      for (let i = 0; i < 200; i++) {
        dataCreationPromises.push(
          createTestTransaction(testUser.id, {
            amount: Math.random() * 20000 + 1000,
            category: ['food', 'transport', 'housing', 'entertainment'][i % 4],
            type: Math.random() > 0.3 ? 'expense' : 'income',
          }),
        )
      }

      // Create 20 budgets
      for (let i = 0; i < 20; i++) {
        dataCreationPromises.push(
          $fetch('/api/budgets', {
            method: 'POST',
            body: {
              category: `category-${i}`,
              monthlyLimit: Math.random() * 50000 + 10000,
              month: '2024-01',
            },
            headers: { 'x-test-user': testUser.id },
          }),
        )
      }

      await Promise.all(dataCreationPromises)

      // Test dashboard data aggregation performance
      const startTime = performance.now()

      const [overview, summary, budgetAnalysis] = await Promise.all([
        $fetch('/api/dashboard/overview', {
          headers: { 'x-test-user': testUser.id },
        }),
        $fetch('/api/dashboard/monthly-summary', {
          headers: { 'x-test-user': testUser.id },
        }),
        $fetch('/api/budgets/analysis', {
          headers: { 'x-test-user': testUser.id },
        }),
      ])

      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(overview.success).toBe(true)
      expect(summary.success).toBe(true)
      expect(budgetAnalysis.success).toBe(true)
      expect(executionTime).toBeLessThan(1000) // All aggregations in under 1 second
    })
  })

  describe('aPI Response Time Performance', () => {
    it('should respond to authentication requests quickly', async () => {
      const userData = generateTestData.user()

      const startTime = performance.now()

      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: userData,
      })

      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(response.success).toBe(true)
      expect(executionTime).toBeLessThan(500) // Registration in under 500ms
    })

    it('should handle concurrent API requests efficiently', async () => {
      const concurrentRequests = 20
      const transactionData = generateTestData.transaction()

      const startTime = performance.now()

      const promises = Array.from({ length: concurrentRequests }, () =>
        $fetch('/api/transactions', {
          method: 'POST',
          body: { ...transactionData, description: `Concurrent test ${Math.random()}` },
          headers: { 'x-test-user': testUser.id },
        }))

      const results = await Promise.all(promises)

      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(results).toHaveLength(concurrentRequests)
      results.forEach((result) => {
        expect(result.success).toBe(true)
      })
      expect(executionTime).toBeLessThan(3000) // 20 concurrent requests in under 3 seconds
    })

    it('should maintain performance under load', async () => {
      const iterations = 50
      const responseTimes: number[] = []

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now()

        await $fetch('/api/transactions', {
          method: 'POST',
          body: { ...generateTestData.transaction(), description: `Load test ${i}` },
          headers: { 'x-test-user': testUser.id },
        })

        const endTime = performance.now()
        responseTimes.push(endTime - startTime)
      }

      const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      const maxResponseTime = Math.max(...responseTimes)
      const minResponseTime = Math.min(...responseTimes)

      expect(averageResponseTime).toBeLessThan(200) // Average under 200ms
      expect(maxResponseTime).toBeLessThan(1000) // Max under 1 second
      expect(minResponseTime).toBeGreaterThan(0) // Sanity check

      // Check for performance degradation (max shouldn't be more than 5x average)
      expect(maxResponseTime).toBeLessThan(averageResponseTime * 5)
    })
  })

  describe('memory Usage Performance', () => {
    it('should handle large datasets without memory leaks', async () => {
      const initialMemory = process.memoryUsage()

      // Create and process large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        amount: Math.random() * 100000,
        category: `category-${i % 100}`,
        date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      }))

      // Process data multiple times to simulate real usage
      for (let iteration = 0; iteration < 10; iteration++) {
        const processed = largeDataset
          .filter(item => item.amount > 50000)
          .map(item => ({
            ...item,
            processed: true,
            iteration,
          }))
          .reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount
            return acc
          }, {} as Record<string, number>)

        expect(Object.keys(processed).length).toBeGreaterThan(0)
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
    })
  })

  describe('edge Case Performance', () => {
    it('should handle extreme financial calculations efficiently', async () => {
      const extremeCases = [
        // Very small amounts
        { principal: 0.01, rate: 0.01, years: 1 },
        // Very large amounts
        { principal: 999999999999, rate: 50, years: 100 },
        // Very high interest rates
        { principal: 100000, rate: 999, years: 1 },
        // Very long terms
        { principal: 100000, rate: 5, years: 1000 },
      ]

      const startTime = performance.now()

      const results = extremeCases.map((testCase) => {
        try {
          return calculateMonthlyPayment(testCase.principal, testCase.rate, testCase.years)
        }
        catch (error) {
          return null // Handle overflow/underflow gracefully
        }
      })

      const endTime = performance.now()
      const executionTime = endTime - startTime

      expect(results).toHaveLength(extremeCases.length)
      expect(executionTime).toBeLessThan(100) // Even extreme cases should be fast

      // Verify results are either valid numbers or null (for overflow cases)
      results.forEach((result) => {
        expect(result === null || (typeof result === 'number' && Number.isFinite(result))).toBe(true)
      })
    })
  })
})
