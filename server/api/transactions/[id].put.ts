import type { Transaction } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Request body validation schema
const UpdateTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  category: z.string().min(1, 'Category is required').optional(),
  description: z.string().min(1, 'Description is required').max(255, 'Description too long').optional(),
  date: z.coerce.date().optional(),
  type: z.enum(['income', 'expense']).optional(),
  // Fee breakdown fields (all optional)
  vat: z.number().nonnegative('VAT must be non-negative').optional(),
  serviceFee: z.number().nonnegative('Service fee must be non-negative').optional(),
  commission: z.number().nonnegative('Commission must be non-negative').optional(),
  stampDuty: z.number().nonnegative('Stamp duty must be non-negative').optional(),
  transferFee: z.number().nonnegative('Transfer fee must be non-negative').optional(),
  processingFee: z.number().nonnegative('Processing fee must be non-negative').optional(),
  otherFees: z.number().nonnegative('Other fees must be non-negative').optional(),
  feeNote: z.string().max(500, 'Fee note too long').optional(),
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

    // Calculate total if fee fields are being updated
    const amount = validatedData.amount !== undefined ? validatedData.amount : Number(existingTransaction.amount)
    const vat = validatedData.vat !== undefined ? validatedData.vat : Number(existingTransaction.vat || 0)
    const serviceFee = validatedData.serviceFee !== undefined ? validatedData.serviceFee : Number(existingTransaction.serviceFee || 0)
    const commission = validatedData.commission !== undefined ? validatedData.commission : Number(existingTransaction.commission || 0)
    const stampDuty = validatedData.stampDuty !== undefined ? validatedData.stampDuty : Number(existingTransaction.stampDuty || 0)
    const transferFee = validatedData.transferFee !== undefined ? validatedData.transferFee : Number(existingTransaction.transferFee || 0)
    const processingFee = validatedData.processingFee !== undefined ? validatedData.processingFee : Number(existingTransaction.processingFee || 0)
    const otherFees = validatedData.otherFees !== undefined ? validatedData.otherFees : Number(existingTransaction.otherFees || 0)

    const totalFees = vat + serviceFee + commission + stampDuty + transferFee + processingFee + otherFees
    const total = totalFees > 0 ? amount + totalFees : null

    // Update transaction
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...validatedData,
        total, // Auto-calculated total
      },
      select: {
        id: true,
        amount: true,
        category: true,
        description: true,
        date: true,
        type: true,
        isRecurring: true,
        recurringExpenseId: true,
        // Fee fields
        vat: true,
        serviceFee: true,
        commission: true,
        stampDuty: true,
        transferFee: true,
        processingFee: true,
        otherFees: true,
        feeNote: true,
        total: true,
        createdAt: true,
        updatedAt: true,
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
      isRecurring: transaction.isRecurring,
      recurringExpenseId: transaction.recurringExpenseId || undefined,
      // Fee fields
      vat: transaction.vat ? Number(transaction.vat) : undefined,
      serviceFee: transaction.serviceFee ? Number(transaction.serviceFee) : undefined,
      commission: transaction.commission ? Number(transaction.commission) : undefined,
      stampDuty: transaction.stampDuty ? Number(transaction.stampDuty) : undefined,
      transferFee: transaction.transferFee ? Number(transaction.transferFee) : undefined,
      processingFee: transaction.processingFee ? Number(transaction.processingFee) : undefined,
      otherFees: transaction.otherFees ? Number(transaction.otherFees) : undefined,
      feeNote: transaction.feeNote || undefined,
      total: transaction.total ? Number(transaction.total) : undefined,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
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
