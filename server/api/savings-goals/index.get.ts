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

    // Get all savings goals for the user
    const savingsGoals = await prisma.savingsGoal.findMany({
      where: {
        userId: (session.user as any).id,
      },
      orderBy: { targetDate: 'asc' },
    })

    // Transform Prisma results to match our types
    const transformedGoals: Omit<SavingsGoal, 'userId'>[] = savingsGoals.map(goal => ({
      id: goal.id,
      name: goal.name,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      targetDate: goal.targetDate,
      monthlyContribution: Number(goal.monthlyContribution),
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    }))

    return {
      success: true,
      data: transformedGoals,
    }
  }
  catch (error: any) {
    console.error('Error fetching savings goals:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch savings goals',
    })
  }
})
