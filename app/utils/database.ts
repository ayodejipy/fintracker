import process from 'node:process'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Global Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined
}

// Create a singleton Prisma client (server-side only)
const nodeEnv = typeof window === 'undefined' && typeof process !== 'undefined' ? process.env?.NODE_ENV : 'production'

// Initialize Prisma with PostgreSQL adapter
// This works for both edge runtimes (Cloudflare Workers) and Node.js (Netlify/Vercel)
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined')
  }

  // Use PrismaPg adapter with connection pooling
  // This provides better performance and works across all platforms
  const pool = new Pool({
    connectionString,
    // Configure connection pool for serverless
    max: 1, // Limit connections in serverless environment
    idleTimeoutMillis: 60000, // Close idle connections after 60s
    connectionTimeoutMillis: 10000, // Fail fast if can't connect
  })

  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: nodeEnv === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalThis.__prisma || createPrismaClient()

if (nodeEnv !== 'production') {
  globalThis.__prisma = prisma
}

// Database connection utilities
export async function connectDatabase() {
  try {
    await prisma.$connect()
    console.warn('✅ Database connected successfully')
  }
  catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect()
    console.warn('✅ Database disconnected successfully')
  }
  catch (error) {
    console.error('❌ Database disconnection failed:', error)
    throw error
  }
}

// Database health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date().toISOString() }
  }
  catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }
  }
}

// Transaction utilities
export async function withTransaction<T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>,
): Promise<T> {
  return await prisma.$transaction(callback)
}

// Common query utilities
export const queries = {
  // User queries
  async getUserWithRelations(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 10, // Latest 10 transactions
        },
        loans: {
          orderBy: { createdAt: 'desc' },
        },
        budgets: {
          where: {
            month: new Date().toISOString().slice(0, 7), // Current month
          },
        },
        savingsGoals: {
          orderBy: { targetDate: 'asc' },
        },
      },
    })
  },

  // Transaction queries
  async getTransactionsByMonth(userId: string, month: string) {
    const startDate = new Date(`${month}-01`)
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

    return await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    })
  },

  async getTransactionsByCategory(userId: string, category: string, limit = 50) {
    return await prisma.transaction.findMany({
      where: {
        userId,
        category,
      },
      orderBy: { date: 'desc' },
      take: limit,
    })
  },

  // Budget queries
  async getCurrentMonthBudgets(userId: string) {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return await prisma.budget.findMany({
      where: {
        userId,
        month: currentMonth,
      },
    })
  },

  async getBudgetWithSpending(userId: string, category: string, month: string) {
    const budget = await prisma.budget.findUnique({
      where: {
        userId_category_month: {
          userId,
          category,
          month,
        },
      },
    })

    if (!budget) { return null }

    // Calculate actual spending from transactions
    const startDate = new Date(`${month}-01`)
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        category,
        type: 'expense',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const actualSpent = transactions.reduce((sum, transaction) =>
      sum + Number(transaction.amount), 0)

    return {
      ...budget,
      actualSpent,
      remaining: Number(budget.monthlyLimit) - actualSpent,
      isOverBudget: actualSpent > Number(budget.monthlyLimit),
    }
  },

  // Loan queries
  async getActiveLoans(userId: string) {
    return await prisma.loan.findMany({
      where: {
        userId,
        currentBalance: {
          gt: 0,
        },
      },
      orderBy: { projectedPayoffDate: 'asc' },
    })
  },

  // Savings goal queries
  async getActiveSavingsGoals(userId: string) {
    return await prisma.savingsGoal.findMany({
      where: {
        userId,
        currentAmount: {
          lt: prisma.savingsGoal.fields.targetAmount,
        },
      },
      orderBy: { targetDate: 'asc' },
    })
  },
}

// Data aggregation utilities
export const aggregations = {
  async getMonthlyFinancialSummary(userId: string, month: string) {
    const startDate = new Date(`${month}-01`)
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
        return acc
      }, {} as Record<string, number>)

    return {
      month,
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: income - expenses,
      savingsRate: income > 0 ? ((income - expenses) / income) * 100 : 0,
      expensesByCategory,
      transactionCount: transactions.length,
    }
  },

  async getTotalDebt(userId: string) {
    const loans = await prisma.loan.findMany({
      where: { userId },
    })

    return loans.reduce((total, loan) => total + Number(loan.currentBalance), 0)
  },

  async getTotalSavingsGoalProgress(userId: string) {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
    })

    const totalTarget = goals.reduce((sum, goal) => sum + Number(goal.targetAmount), 0)
    const totalCurrent = goals.reduce((sum, goal) => sum + Number(goal.currentAmount), 0)

    return {
      totalTarget,
      totalCurrent,
      overallProgress: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
      goalsCount: goals.length,
      completedGoals: goals.filter(goal =>
        Number(goal.currentAmount) >= Number(goal.targetAmount),
      ).length,
    }
  },
}
