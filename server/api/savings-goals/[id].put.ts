import type { SavingsGoal } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema for updates
const updateSavingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100, 'Goal name too long').optional(),
  targetAmount: z.number().positive('Target amount must be positive').optional(),
  targetDate: z.string().refine((date) => {
    const targetDate = new Date(date)
    const today = new Date()
    return targetDate > today
  }, 'Target date must be in the future').optional(),
  monthlyContribution: z.number().positive('Monthly contribution must be positive').optional(),
  currentAmount: z.number().min(0, 'Current amount cannot be negative').optional(),
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

    // Get savings goal ID from route params
    const goalId = getRouterParam(event, 'id')
    if (!goalId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Savings goal ID is required',
      })
    }

    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = updateSavingsGoalSchema.parse(body)

    // Check if savings goal exists and belongs to user
    const existingGoal = await prisma.savingsGoal.findFirst({
      where: {
        id: goalId,
        userId: (session.user as any).id,
      },
    })

    if (!existingGoal) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Savings goal not found',
      })
    }

    // Prepare update data
    const updateData: any = {}
    if (validatedData.name !== undefined) { updateData.name = validatedData.name }
    if (validatedData.targetAmount !== undefined) { updateData.targetAmount = validatedData.targetAmount }
    if (validatedData.targetDate !== undefined) { updateData.targetDate = new Date(validatedData.targetDate) }
    if (validatedData.monthlyContribution !== undefined) { updateData.monthlyContribution = validatedData.monthlyContribution }
    if (validatedData.currentAmount !== undefined) { updateData.currentAmount = validatedData.currentAmount }

    // Update savings goal
    const updatedGoal = await prisma.savingsGoal.update({
      where: { id: goalId },
      data: updateData,
    })

    // Transform result
    const transformedGoal: Omit<SavingsGoal, 'userId'> = {
      id: updatedGoal.id,
      name: updatedGoal.name,
      targetAmount: Number(updatedGoal.targetAmount),
      currentAmount: Number(updatedGoal.currentAmount),
      targetDate: updatedGoal.targetDate,
      monthlyContribution: Number(updatedGoal.monthlyContribution),
      createdAt: updatedGoal.createdAt,
      updatedAt: updatedGoal.updatedAt,
    }

    return {
      success: true,
      data: transformedGoal,
      message: 'Savings goal updated successfully',
    }
  }
  catch (error: any) {
    console.error('Error updating savings goal:', error)

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
      statusMessage: 'Failed to update savings goal',
    })
  }
})
