import type { Transaction } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Request body validation schema
const UpdateTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  category: z.enum([
    'loan_repayment',
    'home_allowance',
    'rent',
    'transport',
    'food',
    'data_airtime',
    'miscellaneous',
    'savings',
  ]).optional(),
  description: z.string().min(1, 'Description is required').max(255, 'Description too long').optional(),
  date: z.coerce.date().optional(),
  type: z.enum(['income', 'expense']).optional(),
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

    // Get transaction ID from route params
    const transactionId = getRouterParam(event, 'id')
    if (!transactionId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Transaction ID is required',
      })
    }

    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = UpdateTransactionSchema.parse(body)

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

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: validatedData,
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
      message: 'Transaction updated successfully',
    }
  }
  catch (error: any) {
    console.error('Error updating transaction:', error)

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
      statusMessage: 'Failed to update transaction',
    })
  }
})
