import type { Budget } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Request body validation schema
const CreateBudgetSchema = z.object({
  category: z.enum([
    'loan_repayment',
    'home_allowance',
    'rent',
    'transport',
    'food',
    'data_airtime',
    'miscellaneous',
    'savings',
  ], { required_error: 'Category is required' }),
  monthlyLimit: z.number().positive('Monthly limit must be positive'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
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
    const validatedData = CreateBudgetSchema.parse(body)

    // Check if budget already exists for this category and month
    const existingBudget = await prisma.budget.findUnique({
      where: {
        userId_category_month: {
          userId: (session.user as any).id,
          category: validatedData.category,
          month: validatedData.month,
        },
      },
    })

    if (existingBudget) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Budget already exists for this category and month',
      })
    }

    // Calculate current spent amount from transactions
    const startDate = new Date(`${validatedData.month}-01`)
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

    const spentAmount = await prisma.transaction.aggregate({
      where: {
        userId: (session.user as any).id,
        category: validatedData.category,
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

    // Create budget
    const budget = await prisma.budget.create({
      data: {
        userId: (session.user as any).id,
        category: validatedData.category,
        monthlyLimit: validatedData.monthlyLimit,
        currentSpent,
        month: validatedData.month,
      },
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
      message: 'Budget created successfully',
    }
  }
  catch (error: any) {
    console.error('Error creating budget:', error)

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
      statusMessage: 'Failed to create budget',
    })
  }
})
