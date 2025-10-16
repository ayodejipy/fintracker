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

    // Get budget ID from route params
    const budgetId = getRouterParam(event, 'id')
    if (!budgetId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Budget ID is required',
      })
    }

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

    // Delete budget
    await prisma.budget.delete({
      where: { id: budgetId },
    })

    return {
      success: true,
      message: 'Budget deleted successfully',
    }
  }
  catch (error: any) {
    console.error('Error deleting budget:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete budget',
    })
  }
})
