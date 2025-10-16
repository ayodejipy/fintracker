import type { Loan } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { calculateLoanProjection } from '~/utils/financial-calculations'

const prisma = new PrismaClient()

// Request body validation schema
const UpdateLoanSchema = z.object({
  name: z.string().min(1, 'Loan name is required').max(100, 'Name too long').optional(),
  monthlyPayment: z.number().positive('Monthly payment must be positive').optional(),
  interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%').optional(),
  currentBalance: z.number().min(0, 'Current balance cannot be negative').optional(),
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
    const validatedData = UpdateLoanSchema.parse(body)

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

    // Prepare update data
    const updateData: any = { ...validatedData }

    // Convert interest rate from percentage to decimal if provided
    if (validatedData.interestRate !== undefined) {
      updateData.interestRate = validatedData.interestRate / 100
    }

    // Recalculate projected payoff date if relevant fields changed
    if (validatedData.monthlyPayment || validatedData.interestRate || validatedData.currentBalance) {
      const currentBalance = validatedData.currentBalance ?? Number(existingLoan.currentBalance)
      const monthlyPayment = validatedData.monthlyPayment ?? Number(existingLoan.monthlyPayment)
      const interestRate = validatedData.interestRate ? validatedData.interestRate / 100 : Number(existingLoan.interestRate)

      if (currentBalance > 0 && monthlyPayment > 0) {
        const projection = calculateLoanProjection({
          principal: currentBalance,
          monthlyPayment,
          annualInterestRate: interestRate,
          startDate: new Date(), // Use current date for remaining balance calculation
        })
        updateData.projectedPayoffDate = projection.payoffDate
      }
      else if (currentBalance <= 0) {
        updateData.projectedPayoffDate = null // Loan is paid off
      }
    }

    // Update loan
    const loan = await prisma.loan.update({
      where: { id: loanId },
      data: updateData,
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

    // Transform Prisma result to match our types
    const transformedLoan: Omit<Loan, 'userId'> = {
      id: loan.id,
      name: loan.name,
      initialAmount: Number(loan.initialAmount),
      currentBalance: Number(loan.currentBalance),
      monthlyPayment: Number(loan.monthlyPayment),
      interestRate: Number(loan.interestRate),
      startDate: loan.startDate,
      projectedPayoffDate: loan.projectedPayoffDate,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
    }

    return {
      success: true,
      data: transformedLoan,
      message: 'Loan updated successfully',
    }
  }
  catch (error: any) {
    console.error('Error updating loan:', error)

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
      statusMessage: 'Failed to update loan',
    })
  }
})
