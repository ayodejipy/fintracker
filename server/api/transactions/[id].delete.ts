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

    // Get transaction ID from route params
    const transactionId = getRouterParam(event, 'id')
    if (!transactionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Transaction ID is required',
      })
    }

    // Check if transaction exists and belongs to user
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: (session.user as any).id,
      },
    })

    if (!existingTransaction) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Transaction not found',
      })
    }

    // Delete transaction
    await prisma.transaction.delete({
      where: { id: transactionId },
    })

    return {
      success: true,
      message: 'Transaction deleted successfully',
    }
  }
  catch (error) {
    console.error('Error deleting transaction:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete transaction',
    })
  }
})
