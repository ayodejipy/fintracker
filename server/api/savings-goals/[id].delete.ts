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

    // Delete the savings goal
    await prisma.savingsGoal.delete({
      where: { id: goalId },
    })

    return {
      success: true,
      data: { id: goalId },
      message: 'Savings goal deleted successfully',
    }
  }
  catch (error: any) {
    console.error('Error deleting savings goal:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete savings goal',
    })
  }
})
