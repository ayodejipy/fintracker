import type { Transaction } from '~/types'
import { transactionValidation } from '~/utils/validation'
import { prisma as db } from '../../../app/utils/database'
import {
  asyncHandler,
  checkRateLimit,
  handleDatabaseError,
  requireAuth,
  validateRequestBody,
} from '../../utils/error-handler'

export default defineEventHandler(asyncHandler(async (event) => {
  // Rate limiting - 60 transactions per minute
  checkRateLimit(event, 60)

  // Require authentication
  const user = await requireAuth(event)

  // Validate request body
  const validatedData = await validateRequestBody(transactionValidation.create, event)

  try {
    // Handle recurring expense creation if specified
    let recurringExpenseId = null
    if (validatedData.isRecurring && validatedData.type === 'expense') {
      // Calculate next due date based on frequency
      const currentDate = new Date(validatedData.date)
      const nextDueDate = new Date(currentDate)
      
      switch (validatedData.recurringFrequency) {
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + 7)
          break
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + 1)
          break
        case 'yearly':
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
          break
      }

      // Create recurring expense
      const recurringExpense = await db.recurringExpense.create({
        data: {
          userId: user.id,
          name: validatedData.description,
          amount: validatedData.amount,
          category: validatedData.category,
          frequency: validatedData.recurringFrequency || 'monthly',
          nextDueDate,
          description: `Auto-created from transaction: ${validatedData.description}`,
          reminderDays: validatedData.reminderDays || 3,
          autoCreateTransaction: true,
        },
      })
      
      recurringExpenseId = recurringExpense.id
    }

    // Calculate total (amount + all fees)
    const vat = validatedData.vat || 0
    const serviceFee = validatedData.serviceFee || 0
    const commission = validatedData.commission || 0
    const stampDuty = validatedData.stampDuty || 0
    const transferFee = validatedData.transferFee || 0
    const processingFee = validatedData.processingFee || 0
    const otherFees = validatedData.otherFees || 0

    const totalFees = vat + serviceFee + commission + stampDuty + transferFee + processingFee + otherFees
    const total = totalFees > 0 ? validatedData.amount + totalFees : null

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        amount: validatedData.amount,
        category: validatedData.category,
        description: validatedData.description,
        date: validatedData.date,
        type: validatedData.type,
        isRecurring: validatedData.isRecurring || false,
        recurringExpenseId,
        // Fee breakdown fields
        vat: validatedData.vat || null,
        serviceFee: validatedData.serviceFee || null,
        commission: validatedData.commission || null,
        stampDuty: validatedData.stampDuty || null,
        transferFee: validatedData.transferFee || null,
        processingFee: validatedData.processingFee || null,
        otherFees: validatedData.otherFees || null,
        feeNote: validatedData.feeNote || null,
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

    // Create notification for the transaction
    try {
      const notificationTitle = transaction.type === 'income'
        ? '💰 Income Added'
        : '💳 Expense Added'

      const notificationMessage = transaction.type === 'income'
        ? `You added an income of ₦${Number(transaction.amount).toLocaleString()} for ${transaction.description}`
        : `You added an expense of ₦${Number(transaction.amount).toLocaleString()} for ${transaction.description}`

      await db.notification.create({
        data: {
          userId: user.id,
          type: transaction.type === 'income' ? 'goal_milestone' : 'budget_alert',
          title: notificationTitle,
          message: notificationMessage,
          priority: 'low',
          transactionId: transaction.id,
        },
      })
    }
    catch (notificationError) {
      // Log but don't fail the transaction if notification creation fails
      console.error('Failed to create transaction notification:', notificationError)
    }

    return {
      success: true,
      data: transformedTransaction,
      message: 'Transaction created successfully',
    }
  }
  catch (error) {
    handleDatabaseError(error)
  }
}))
