import { PrismaClient } from '@prisma/client'
import { getUserSession } from '../../utils/auth'

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

    const user = session.user as any

    // Get recurring expense ID from route params
    const expenseId = getRouterParam(event, 'id')
    if (!expenseId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Recurring expense ID is required',
      })
    }

    // Check if recurring expense exists and belongs to user
    const existingExpense = await prisma.recurringExpense.findFirst({
      where: {
        id: expenseId,
        userId: user.id,
      },
    })

    if (!existingExpense) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Recurring expense not found',
      })
    }

    // Delete the recurring expense
    await prisma.recurringExpense.delete({
      where: { id: expenseId },
    })

    return {
      success: true,
      data: { id: expenseId },
      message: 'Recurring expense deleted successfully',
    }
  }
  catch (error: any) {
    console.error('Error deleting recurring expense:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete recurring expense',
    })
  }
})
