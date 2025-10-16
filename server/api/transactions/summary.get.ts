import type { ExpenseCategory } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Query parameters validation schema
const SummaryQuerySchema = z.object({
  month: z.string().optional(),
  year: z.string().optional(),
})

interface TransactionSummary {
  totalIncome: number
  totalExpenses: number
  netAmount: number
  categoryBreakdown: Array<{
    category: ExpenseCategory
    amount: number
    count: number
  }>
  monthlyTrend: Array<{
    month: string
    income: number
    expenses: number
  }>
}

export default defineEventHandler(async (event) => {
  try {
    // Get user from session
    const session = await getUserSession(event)
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Parse and validate query parameters
    const query = await getQuery(event)
    const validatedQuery = SummaryQuerySchema.parse(query)

    const { month, year } = validatedQuery
    const currentDate = new Date()
    const targetYear = year ? Number.parseInt(year) : currentDate.getFullYear()
    const targetMonth = month ? Number.parseInt(month) : currentDate.getMonth() + 1

    // Build date range
    let startDate: Date
    let endDate: Date

    if (month) {
      // Specific month
      startDate = new Date(targetYear, targetMonth - 1, 1)
      endDate = new Date(targetYear, targetMonth, 0)
    }
    else {
      // Entire year
      startDate = new Date(targetYear, 0, 1)
      endDate = new Date(targetYear, 11, 31)
    }

    const where = {
      userId: (session.user as any).id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    }

    // Get transaction summaries
    const [incomeSum, expenseSum, categoryBreakdown] = await Promise.all([
      // Total income
      prisma.transaction.aggregate({
        where: { ...where, type: 'income' },
        _sum: { amount: true },
      }),

      // Total expenses
      prisma.transaction.aggregate({
        where: { ...where, type: 'expense' },
        _sum: { amount: true },
      }),

      // Category breakdown for expenses
      prisma.transaction.groupBy({
        by: ['category'],
        where: { ...where, type: 'expense' },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ])

    // Get monthly trend for the year
    const monthlyTrend = await Promise.all(
      Array.from({ length: 12 }, async (_, index) => {
        const monthStart = new Date(targetYear, index, 1)
        const monthEnd = new Date(targetYear, index + 1, 0)

        const [monthIncome, monthExpenses] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              userId: (session.user as any).id,
              type: 'income',
              date: { gte: monthStart, lte: monthEnd },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId: (session.user as any).id,
              type: 'expense',
              date: { gte: monthStart, lte: monthEnd },
            },
            _sum: { amount: true },
          }),
        ])

        return {
          month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
          income: Number(monthIncome._sum.amount || 0),
          expenses: Number(monthExpenses._sum.amount || 0),
        }
      }),
    )

    const totalIncome = Number(incomeSum._sum.amount || 0)
    const totalExpenses = Number(expenseSum._sum.amount || 0)

    const summary: TransactionSummary = {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      categoryBreakdown: categoryBreakdown.map(item => ({
        category: item.category as ExpenseCategory,
        amount: Number(item._sum.amount || 0),
        count: item._count.id,
      })),
      monthlyTrend,
    }

    return {
      success: true,
      data: summary,
    }
  }
  catch (error: any) {
    console.error('Error fetching transaction summary:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch transaction summary',
    })
  }
})
