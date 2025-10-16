import type { SavingsGoal } from '~/types'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    }
  }
  catch (error: any) {
    console.error('Error fetching savings goal:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch savings goal',
    })
  }
})
