import type { Transaction } from '~/types'
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

    // Find transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: (session.user as any).id,
      },
      select: {
        id: true,
        amount: true,
        category: true,
        description: true,
        date: true,
        type: true,
        createdAt: true,
      },
    })

    if (!transaction) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Transaction not found',
      })
    }

    // Transform Prisma result to match our types
    const transformedTransaction: Omit<Transaction, 'userId'> = {
      id: transaction.id,
      amount: Number(transaction.amount),
      category: transaction.category as any,
      description: transaction.description,
      date: transaction.date,
      type: transaction.type as 'income' | 'expense',
      createdAt: transaction.createdAt,
    }

    return {
      success: true,
      data: transformedTransaction,
    }
  }
  catch (error: any) {
    console.error('Error fetching transaction:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch transaction',
    })
  }
})
