import type { SavingsGoal } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schema
const contributeSchema = z.object({
  amount: z.number().positive('Contribution amount must be positive'),
  description: z.string().optional(),
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
    const validatedData = contributeSchema.parse(body)

    // Find the savings goal
    const savingsGoal = await prisma.savingsGoal.findFirst({
      where: {
        id: goalId,
        userId: (session.user as any).id,
      },
    })

    if (!savingsGoal) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Savings goal not found',
      })
    }

    const currentAmount = Number(savingsGoal.currentAmount)
    const targetAmount = Number(savingsGoal.targetAmount)
    const contributionAmount = validatedData.amount

    // Calculate new current amount (don't exceed target)
    const newCurrentAmount = Math.min(currentAmount + contributionAmount, targetAmount)
    const actualContribution = newCurrentAmount - currentAmount

    // Start a transaction to update savings goal and create transaction record
    const result = await prisma.$transaction(async (tx) => {
      // Update savings goal
      const updatedGoal = await tx.savingsGoal.update({
        where: { id: goalId },
        data: { currentAmount: newCurrentAmount },
      })

      // Create a transaction record for the contribution
      await tx.transaction.create({
        data: {
          userId: (session.user as any).id,
          amount: actualContribution,
          category: 'savings',
          description: validatedData.description || `Contribution to ${savingsGoal.name}`,
          date: new Date(),
          type: 'expense', // Treating savings as an expense from income perspective
        },
      })

      return updatedGoal
    })

    // Check if goal is now complete
    const isComplete = newCurrentAmount >= targetAmount
    const progressPercentage = targetAmount > 0
      ? Math.min((newCurrentAmount / targetAmount) * 100, 100)
      : 0

    // Transform result
    const transformedGoal: Omit<SavingsGoal, 'userId'> = {
      id: result.id,
      name: result.name,
      targetAmount: Number(result.targetAmount),
      currentAmount: Number(result.currentAmount),
      targetDate: result.targetDate,
      monthlyContribution: Number(result.monthlyContribution),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }

    return {
      success: true,
      data: transformedGoal,
      contribution: {
        amount: actualContribution,
        newCurrentAmount,
        progressPercentage,
        isComplete,
        remainingAmount: Math.max(0, targetAmount - newCurrentAmount),
      },
      message: isComplete
        ? `🎉 Congratulations! You've reached your savings goal for "${savingsGoal.name}"!`
        : `Contribution of ₦${actualContribution.toLocaleString()} added successfully`,
    }
  }
  catch (error: any) {
    console.error('Error adding contribution:', error)

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
      statusMessage: 'Failed to add contribution',
    })
  }
})
