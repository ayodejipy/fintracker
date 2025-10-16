import type { Budget, ExpenseCategory } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Query parameters validation schema
const GetBudgetsQuerySchema = z.object({
  month: z.string().optional(),
  category: z.enum([
    'loan_repayment',
    'home_allowance',
    'rent',
    'transport',
    'food',
    'data_airtime',
    'miscellaneous',
    'savings',
  ]).optional(),
})

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
    const validatedQuery = GetBudgetsQuerySchema.parse(query)

    const { month, category } = validatedQuery
    const currentMonth = month || new Date().toISOString().slice(0, 7) // YYYY-MM format

    // Build where clause
    const where: any = {
      userId: (session.user as any).id,
      month: currentMonth,
    }

    if (category) {
      where.category = category
    }

    // Get budgets for the specified month
    const budgets = await prisma.budget.findMany({
      where,
      orderBy: { category: 'asc' },
      select: {
        id: true,
        category: true,
        monthlyLimit: true,
        currentSpent: true,
        month: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Transform Prisma results to match our types
    const transformedBudgets: Omit<Budget, 'userId'>[] = budgets.map(b => ({
      id: b.id,
      category: b.category as ExpenseCategory,
      monthlyLimit: Number(b.monthlyLimit),
      currentSpent: Number(b.currentSpent),
      month: b.month,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }))

    return {
      success: true,
      data: transformedBudgets,
    }
  }
  catch (error: any) {
    console.error('Error fetching budgets:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch budgets',
    })
  }
})
