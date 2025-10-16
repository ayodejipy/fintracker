import type { Loan } from '~/types'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { calculateLoanProjection } from '~/utils/financial-calculations'

const prisma = new PrismaClient()

// Request body validation schema
const CreateLoanSchema = z.object({
  name: z.string().min(1, 'Loan name is required').max(100, 'Name too long'),
  initialAmount: z.number().positive('Initial amount must be positive'),
  monthlyPayment: z.number().positive('Monthly payment must be positive'),
  interestRate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate cannot exceed 100%').optional().default(0),
  startDate: z.string().datetime('Invalid date format').transform(val => new Date(val)),
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

    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = CreateLoanSchema.parse(body)

    // Calculate loan projections
    const projection = calculateLoanProjection({
      principal: validatedData.initialAmount,
      monthlyPayment: validatedData.monthlyPayment,
      annualInterestRate: validatedData.interestRate / 100, // Convert percentage to decimal
      startDate: validatedData.startDate,
    })

    // Create loan
    const loan = await prisma.loan.create({
      data: {
        userId: (session.user as any).id,
        name: validatedData.name,
        initialAmount: validatedData.initialAmount,
        currentBalance: validatedData.initialAmount, // Initially same as initial amount
        monthlyPayment: validatedData.monthlyPayment,
        interestRate: validatedData.interestRate / 100, // Store as decimal
        startDate: validatedData.startDate,
        projectedPayoffDate: projection.payoffDate,
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
      message: 'Loan created successfully',
    }
  }
  catch (error: any) {
    console.error('Error creating loan:', error)

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
      statusMessage: 'Failed to create loan',
    })
  }
})
