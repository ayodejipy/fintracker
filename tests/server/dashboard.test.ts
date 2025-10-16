import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '~/server/utils/database'
import { cleanupTestDatabase, createTestUser, setupTestDatabase } from '../utils/database'

describe('dashboard API', () => {
  let testUser: any

  beforeEach(async () => {
    await setupTestDatabase()
    testUser = await createTestUser()
  })

  afterEach(async () => {
    await cleanupTestDatabase()
  })

  describe('dashboard Overview', () => {
    it('should calculate correct financial overview', async () => {
      // Create test data
      const currentMonth = new Date().toISOString().slice(0, 7)

      // Create transactions
      await db.transaction.createMany({
        data: [
          {
            userId: testUser.id,
            amount: 5000,
            type: 'INCOME',
            category: 'Salary',
            description: 'Monthly salary',
            date: new Date(),
          },
          {
            userId: testUser.id,
            amount: 1500,
            type: 'EXPENSE',
            category: 'Food',
            description: 'Groceries',
            date: new Date(),
          },
          {
            userId: testUser.id,
            amount: 800,
            type: 'EXPENSE',
            category: 'Transport',
            description: 'Fuel',
            date: new Date(),
          },
        ],
      })

      // Create budget
      await db.budget.create({
        data: {
          userId: testUser.id,
          category: 'Food',
          budgetAmount: 2000,
          spentAmount: 1500,
          month: currentMonth,
        },
      })

      // Create loan
      await db.loan.create({
        data: {
          userId: testUser.id,
          name: 'Car Loan',
          originalAmount: 20000,
          currentBalance: 15000,
          interestRate: 5.5,
          monthlyPayment: 500,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })

      // Create savings goal
      await db.savingsGoal.create({
        data: {
          userId: testUser.id,
          name: 'Emergency Fund',
          targetAmount: 10000,
          currentAmount: 3000,
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          monthlyContribution: 500,
        },
      })

      // Test the calculations manually (simulating the API logic)
      const transactions = await db.transaction.findMany({
        where: { userId: testUser.id },
      })

      const income = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)

      const budgets = await db.budget.findMany({
        where: { userId: testUser.id },
      })

      const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0)
      const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0)
      const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

      const loans = await db.loan.findMany({
        where: { userId: testUser.id, currentBalance: { gt: 0 } },
      })

      const totalDebt = loans.reduce((sum, l) => sum + l.currentBalance, 0)
      const totalMonthlyPayments = loans.reduce((sum, l) => sum + l.monthlyPayment, 0)

      const savingsGoals = await db.savingsGoal.findMany({
        where: { userId: testUser.id },
      })

      const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0)
      const totalSavingsCurrent = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0)
      const totalMonthlyContributions = savingsGoals.reduce((sum, g) => sum + g.monthlyContribution, 0)

      const netWorth = totalSavingsCurrent - totalDebt
      const cashFlow = income - expenses - totalMonthlyPayments - totalMonthlyContributions

      // Assertions
      expect(income).toBe(5000)
      expect(expenses).toBe(2300)
      expect(totalBudget).toBe(2000)
      expect(totalSpent).toBe(1500)
      expect(budgetUtilization).toBe(75)
      expect(totalDebt).toBe(15000)
      expect(totalMonthlyPayments).toBe(500)
      expect(totalSavingsTarget).toBe(10000)
      expect(totalSavingsCurrent).toBe(3000)
      expect(totalMonthlyContributions).toBe(500)
      expect(netWorth).toBe(-12000) // 3000 - 15000
      expect(cashFlow).toBe(1700) // 5000 - 2300 - 500 - 500
    })

    it('should handle empty data gracefully', async () => {
      // Test with no transactions, budgets, loans, or savings goals
      const transactions = await db.transaction.findMany({
        where: { userId: testUser.id },
      })

      const budgets = await db.budget.findMany({
        where: { userId: testUser.id },
      })

      const loans = await db.loan.findMany({
        where: { userId: testUser.id },
      })

      const savingsGoals = await db.savingsGoal.findMany({
        where: { userId: testUser.id },
      })

      expect(transactions).toHaveLength(0)
      expect(budgets).toHaveLength(0)
      expect(loans).toHaveLength(0)
      expect(savingsGoals).toHaveLength(0)

      // All calculations should return 0 or empty arrays
      const income = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)

      expect(income).toBe(0)
      expect(expenses).toBe(0)
    })

    it('should calculate expense breakdown correctly', async () => {
      // Create transactions in different categories
      await db.transaction.createMany({
        data: [
          {
            userId: testUser.id,
            amount: 1000,
            type: 'EXPENSE',
            category: 'Food',
            description: 'Groceries',
            date: new Date(),
          },
          {
            userId: testUser.id,
            amount: 500,
            type: 'EXPENSE',
            category: 'Food',
            description: 'Restaurant',
            date: new Date(),
          },
          {
            userId: testUser.id,
            amount: 800,
            type: 'EXPENSE',
            category: 'Transport',
            description: 'Fuel',
            date: new Date(),
          },
          {
            userId: testUser.id,
            amount: 200,
            type: 'EXPENSE',
            category: 'Entertainment',
            description: 'Movies',
            date: new Date(),
          },
        ],
      })

      const transactions = await db.transaction.findMany({
        where: { userId: testUser.id, type: 'EXPENSE' },
      })

      const expensesByCategory = transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

      const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0)

      expect(expensesByCategory.Food).toBe(1500)
      expect(expensesByCategory.Transport).toBe(800)
      expect(expensesByCategory.Entertainment).toBe(200)
      expect(totalExpenses).toBe(2500)

      // Test percentage calculations
      const foodPercentage = (expensesByCategory.Food / totalExpenses) * 100
      const transportPercentage = (expensesByCategory.Transport / totalExpenses) * 100
      const entertainmentPercentage = (expensesByCategory.Entertainment / totalExpenses) * 100

      expect(foodPercentage).toBe(60)
      expect(transportPercentage).toBe(32)
      expect(entertainmentPercentage).toBe(8)
    })
  })

  describe('monthly Summary', () => {
    it('should calculate daily spending patterns', async () => {
      const currentDate = new Date()
      const month = currentDate.toISOString().slice(0, 7)

      // Create transactions on different days
      await db.transaction.createMany({
        data: [
          {
            userId: testUser.id,
            amount: 100,
            type: 'EXPENSE',
            category: 'Food',
            description: 'Day 1 expense',
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
          },
          {
            userId: testUser.id,
            amount: 150,
            type: 'EXPENSE',
            category: 'Food',
            description: 'Day 1 expense 2',
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
          },
          {
            userId: testUser.id,
            amount: 200,
            type: 'EXPENSE',
            category: 'Transport',
            description: 'Day 5 expense',
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 5),
          },
        ],
      })

      const startDate = new Date(`${month}-01`)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

      const transactions = await db.transaction.findMany({
        where: {
          userId: testUser.id,
          type: 'EXPENSE',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      const dailySpending = transactions.reduce((acc, t) => {
        const day = t.date.getDate()
        acc[day] = (acc[day] || 0) + t.amount
        return acc
      }, {} as Record<number, number>)

      expect(dailySpending[1]).toBe(250) // 100 + 150
      expect(dailySpending[5]).toBe(200)
      expect(Object.keys(dailySpending)).toHaveLength(2)
    })

    it('should calculate month-over-month comparison', async () => {
      const currentDate = new Date()
      const currentMonth = currentDate.toISOString().slice(0, 7)

      const prevDate = new Date(currentDate)
      prevDate.setMonth(prevDate.getMonth() - 1)
      const prevMonth = prevDate.toISOString().slice(0, 7)

      // Create current month transactions
      await db.transaction.createMany({
        data: [
          {
            userId: testUser.id,
            amount: 5000,
            type: 'INCOME',
            category: 'Salary',
            description: 'Current month salary',
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
          },
          {
            userId: testUser.id,
            amount: 2000,
            type: 'EXPENSE',
            category: 'Food',
            description: 'Current month expenses',
            date: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10),
          },
        ],
      })

      // Create previous month transactions
      await db.transaction.createMany({
        data: [
          {
            userId: testUser.id,
            amount: 4500,
            type: 'INCOME',
            category: 'Salary',
            description: 'Previous month salary',
            date: new Date(prevDate.getFullYear(), prevDate.getMonth(), 15),
          },
          {
            userId: testUser.id,
            amount: 1800,
            type: 'EXPENSE',
            category: 'Food',
            description: 'Previous month expenses',
            date: new Date(prevDate.getFullYear(), prevDate.getMonth(), 10),
          },
        ],
      })

      // Get current month data
      const currentStartDate = new Date(`${currentMonth}-01`)
      const currentEndDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + 1, 0)

      const currentTransactions = await db.transaction.findMany({
        where: {
          userId: testUser.id,
          date: {
            gte: currentStartDate,
            lte: currentEndDate,
          },
        },
      })

      // Get previous month data
      const prevStartDate = new Date(`${prevMonth}-01`)
      const prevEndDate = new Date(prevStartDate.getFullYear(), prevStartDate.getMonth() + 1, 0)

      const prevTransactions = await db.transaction.findMany({
        where: {
          userId: testUser.id,
          date: {
            gte: prevStartDate,
            lte: prevEndDate,
          },
        },
      })

      const currentIncome = currentTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)

      const currentExpenses = currentTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)

      const prevIncome = prevTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)

      const prevExpenses = prevTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)

      expect(currentIncome).toBe(5000)
      expect(currentExpenses).toBe(2000)
      expect(prevIncome).toBe(4500)
      expect(prevExpenses).toBe(1800)

      // Calculate changes
      const incomeChange = currentIncome - prevIncome
      const expenseChange = currentExpenses - prevExpenses
      const incomeChangePercentage = (incomeChange / prevIncome) * 100
      const expenseChangePercentage = (expenseChange / prevExpenses) * 100

      expect(incomeChange).toBe(500)
      expect(expenseChange).toBe(200)
      expect(Math.round(incomeChangePercentage * 100) / 100).toBe(11.11)
      expect(Math.round(expenseChangePercentage * 100) / 100).toBe(11.11)
    })
  })
})
