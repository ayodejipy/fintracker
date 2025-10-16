import type { SavingsGoal } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema
const createSavingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100, 'Goal name too long'),
  targetAmount: z.number().positive('Target amount must be positive'),
  targetDate: z.string().refine((date) => {
    const targetDate = new Date(date)
    const today = new Date()
    return targetDate > today
  }, 'Target date must be in the future'),
  monthlyContribution: z.number().positive('Monthly contribution must be positive'),
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
    const validatedData = createSavingsGoalSchema.parse(body)

    // Create savings goal
    const savingsGoal = await prisma.savingsGoal.create({
      data: {
        userId: (session.user as any).id,
        name: validatedData.name,
        targetAmount: validatedData.targetAmount,
        targetDate: new Date(validatedData.targetDate),
        monthlyContribution: validatedData.monthlyContribution,
        currentAmount: 0, // Start with 0
      },
    })

    // Transform result
    const transformedGoal: Omit<SavingsGoal, 'userId'> = {
      id: savingsGoal.id,
      name: savingsGoal.name,
      targetAmount: Number(savingsGoal.targetAmount),
      currentAmount: Number(savingsGoal.currentAmount),
      targetDate: savingsGoal.targetDate,
      monthlyContribution: Number(savingsGoal.monthlyContribution),
      createdAt: savingsGoal.createdAt,
      updatedAt: savingsGoal.updatedAt,
    }

    return {
      success: true,
      data: transformedGoal,
      message: 'Savings goal created successfully',
    }
  }
  catch (error: any) {
    console.error('Error creating savings goal:', error)

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
      statusMessage: 'Failed to create savings goal',
    })
  }
})
