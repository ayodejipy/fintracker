import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Request body validation schema
const SyncBudgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional(),
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

    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = SyncBudgetSchema.parse(body)

    const month = validatedData.month || new Date().toISOString().slice(0, 7)
    const userId = (session.user as any).id

    // Get all budgets for the month
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        month,
      },
    })

    if (budgets.length === 0) {
      return {
        success: true,
        message: 'No budgets found for the specified month',
        data: [],
      }
    }

    // Calculate date range for the month
    const startDate = new Date(`${month}-01`)
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

    // Update each budget's current spent amount
    const updatedBudgets = []

    for (const budget of budgets) {
      // Calculate total spent for this category in the month
      const spentAmount = await prisma.transaction.aggregate({
        where: {
          userId,
          category: budget.category,
          type: 'expense',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          amount: true,
        },
      })

      const currentSpent = Number(spentAmount._sum.amount || 0)

      // Update the budget
      const updatedBudget = await prisma.budget.update({
        where: { id: budget.id },
        data: { currentSpent },
        select: {
          id: true,
          category: true,
          monthlyLimit: true,
          currentSpent: true,
          month: true,
          updatedAt: true,
        },
      })

      updatedBudgets.push({
        id: updatedBudget.id,
        category: updatedBudget.category,
        monthlyLimit: Number(updatedBudget.monthlyLimit),
        currentSpent: Number(updatedBudget.currentSpent),
        month: updatedBudget.month,
        updatedAt: updatedBudget.updatedAt,
      })
    }

    return {
      success: true,
      message: `Synchronized ${updatedBudgets.length} budgets for ${month}`,
      data: updatedBudgets,
    }
  }
  catch (error: any) {
    console.error('Error syncing budgets:', error)

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: {
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to sync budgets',
    })
  }
})
