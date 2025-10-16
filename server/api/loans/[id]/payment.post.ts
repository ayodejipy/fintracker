import type { Loan } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { calculateLoanProjection } from '~/utils/financial-calculations'

const prisma = new PrismaClient()

// Request body validation schema
const PaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  paymentDate: z.string().datetime('Invalid date format').transform(val => new Date(val)).optional().default(() => new Date().toISOString()).transform(val => new Date(val)),
  description: z.string().optional().default('Loan payment'),
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

    // Get loan ID from route params
    const loanId = getRouterParam(event, 'id')
    if (!loanId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Loan ID is required',
      })
    }

    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = PaymentSchema.parse(body)

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

    const currentBalance = Number(existingLoan.currentBalance)

    // Validate payment amount doesn't exceed current balance
    if (validatedData.amount > currentBalance) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Payment amount cannot exceed current loan balance',
      })
    }

    // Calculate new balance
    const newBalance = Math.max(0, currentBalance - validatedData.amount)

    // Calculate new projected payoff date
    let projectedPayoffDate = null
    if (newBalance > 0) {
      const projection = calculateLoanProjection({
        principal: newBalance,
        monthlyPayment: Number(existingLoan.monthlyPayment),
        annualInterestRate: Number(existingLoan.interestRate),
        startDate: new Date(),
      })
      projectedPayoffDate = projection.payoffDate
    }

    // Start transaction to update loan and create transaction record
    const result = await prisma.$transaction(async (tx) => {
      // Update loan balance and projected payoff date
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          currentBalance: newBalance,
          projectedPayoffDate,
        },
        select: {
          id: true,
          name: true,
          initialAmount: true,
          currentBalance: true,
          monthlyPayment: true,
          interestRate: true,
          startDate: true,
          projectedPayoffDate: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      // Create transaction record for the payment
      await tx.transaction.create({
        data: {
          userId: (session.user as any).id,
          amount: validatedData.amount,
          category: 'loan_repayment',
          description: `${validatedData.description} - ${existingLoan.name}`,
          date: validatedData.paymentDate,
          type: 'expense',
        },
      })

      return updatedLoan
    })

    // Transform Prisma result to match our types
    const transformedLoan: Omit<Loan, 'userId'> = {
      id: result.id,
      name: result.name,
      initialAmount: Number(result.initialAmount),
      currentBalance: Number(result.currentBalance),
      monthlyPayment: Number(result.monthlyPayment),
      interestRate: Number(result.interestRate),
      startDate: result.startDate,
      projectedPayoffDate: result.projectedPayoffDate,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }

    return {
      success: true,
      data: transformedLoan,
      message: `Payment of ₦${validatedData.amount.toLocaleString()} recorded successfully`,
      paymentDetails: {
        amount: validatedData.amount,
        paymentDate: validatedData.paymentDate,
        newBalance,
        isFullyPaid: newBalance === 0,
      },
    }
  }
  catch (error: any) {
    console.error('Error recording loan payment:', error)

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
      statusMessage: 'Failed to record loan payment',
    })
  }
})
