import type { Loan } from '~/types'
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

    // Find loan
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        userId: (session.user as any).id,
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

    if (!loan) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Loan not found',
      })
    }

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
    }
  }
  catch (error: any) {
    console.error('Error fetching loan:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch loan',
    })
  }
})
