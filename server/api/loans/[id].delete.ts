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

    // Get loan ID from route params
    const loanId = getRouterParam(event, 'id')
    if (!loanId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Loan ID is required',
      })
    }

    // Check if loan exists and belongs to user
    const existingLoan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        userId: (session.user as any).id,
      },
    })

    if (!existingLoan) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Loan not found',
      })
    }

    // Delete loan
    await prisma.loan.delete({
      where: { id: loanId },
    })

    return {
      success: true,
      message: 'Loan deleted successfully',
    }
  }
  catch (error: any) {
    console.error('Error deleting loan:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete loan',
    })
  }
})
