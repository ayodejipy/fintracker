import type { Budget } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Request body validation schema
const UpdateBudgetSchema = z.object({
  monthlyLimit: z.number().positive('Monthly limit must be positive').optional(),
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

    // Get budget ID from route params
    const budgetId = getRouterParam(event, 'id')
    if (!budgetId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Budget ID is required',
      })
    }

    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = UpdateBudgetSchema.parse(body)

    // Check if budget exists and belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId: (session.user as any).id,
      },
    })

    if (!existingBudget) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Budget not found',
      })
    }

    // If month is being updated, recalculate current spent
    const updateData: any = { ...validatedData }

    if (validatedData.month && validatedData.month !== existingBudget.month) {
      const startDate = new Date(`${validatedData.month}-01`)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

      const spentAmount = await prisma.transaction.aggregate({
        where: {
          userId: (session.user as any).id,
          category: existingBudget.category,
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

      updateData.currentSpent = Number(spentAmount._sum.amount || 0)
    }

    // Update budget
    const budget = await prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
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

    // Transform Prisma result to match our types
    const transformedBudget: Omit<Budget, 'userId'> = {
      id: budget.id,
      category: budget.category as any,
      monthlyLimit: Number(budget.monthlyLimit),
      currentSpent: Number(budget.currentSpent),
      month: budget.month,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    }

    return {
      success: true,
      data: transformedBudget,
      message: 'Budget updated successfully',
    }
  }
  catch (error: any) {
    console.error('Error updating budget:', error)

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
      statusMessage: 'Failed to update budget',
    })
  }
})
