import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { calculateAmortizationSchedule, calculateLoanProjection } from '~/utils/financial-calculations'

const prisma = new PrismaClient()

// Query parameters validation schema
const ProjectionQuerySchema = z.object({
  months: z.string().transform(val => Number.parseInt(val, 10)).optional().default('12'),
})

interface LoanProjectionData {
  loanDetails: {
    id: string
    name: string
    currentBalance: number
    monthlyPayment: number
    interestRate: number
    projectedPayoffDate: Date | null
  }
  projection: {
    totalInterest: number
    totalPayments: number
    monthsRemaining: number
    payoffDate: Date | null
  }
  amortizationSchedule: Array<{
    month: number
    date: Date
    payment: number
    principal: number
    interest: number
    balance: number
  }>
  paymentHistory: Array<{
    date: Date
    amount: number
    description: string
  }>
}

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

    // Parse query parameters
    const query = await getQuery(event)
    const { months } = ProjectionQuerySchema.parse(query)

    // Find loan
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        userId: (session.user as any).id,
      },
    })

    if (!loan) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Loan not found',
      })
    }

    const currentBalance = Number(loan.currentBalance)
    const monthlyPayment = Number(loan.monthlyPayment)
    const annualInterestRate = Number(loan.interestRate)

    // Calculate loan projection
    const projection = calculateLoanProjection({
      principal: currentBalance,
      monthlyPayment,
      annualInterestRate,
      startDate: new Date(),
    })

    // Calculate amortization schedule for requested months
    const amortizationSchedule = calculateAmortizationSchedule({
      principal: currentBalance,
      monthlyPayment,
      annualInterestRate,
      startDate: new Date(),
      maxMonths: months,
    })

    // Get payment history from transactions
    const paymentHistory = await prisma.transaction.findMany({
      where: {
        userId: (session.user as any).id,
        category: 'loan_repayment',
        description: {
          contains: loan.name,
        },
      },
      orderBy: { date: 'desc' },
      take: 50, // Limit to last 50 payments
      select: {
        date: true,
        amount: true,
        description: true,
      },
    })

    const projectionData: LoanProjectionData = {
      loanDetails: {
        id: loan.id,
        name: loan.name,
        currentBalance,
        monthlyPayment,
        interestRate: annualInterestRate,
        projectedPayoffDate: loan.projectedPayoffDate,
      },
      projection: {
        totalInterest: projection.totalInterest,
        totalPayments: projection.totalPayments,
        monthsRemaining: projection.monthsToPayoff,
        payoffDate: projection.payoffDate,
      },
      amortizationSchedule,
      paymentHistory: paymentHistory.map(p => ({
        date: p.date,
        amount: Number(p.amount),
        description: p.description,
      })),
    }

    return {
      success: true,
      data: projectionData,
    }
  }
  catch (error: any) {
    console.error('Error calculating loan projection:', error)

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
      statusMessage: 'Failed to calculate loan projection',
    })
  }
})
