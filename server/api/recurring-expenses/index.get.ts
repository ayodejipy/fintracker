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

    // Get recurring expenses for the user
    const recurringExpenses = await prisma.recurringExpense.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        nextDueDate: 'asc',
      },
    })

    // Convert Decimal to number for JSON serialization
    const formattedExpenses = recurringExpenses.map((expense: any) => ({
      ...expense,
      amount: Number(expense.amount),
    }))

    return {
      success: true,
      data: formattedExpenses,
    }
  }
  catch (error: any) {
    console.error('Error fetching recurring expenses:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch recurring expenses',
    })
  }
})
