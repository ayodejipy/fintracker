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

    // Get all loans for the user
    const loans = await prisma.loan.findMany({
      where: {
        userId: (session.user as any).id,
      },
      orderBy: { createdAt: 'desc' },
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

    // Transform Prisma results to match our types
    const transformedLoans: Omit<Loan, 'userId'>[] = loans.map(l => ({
      id: l.id,
      name: l.name,
      initialAmount: Number(l.initialAmount),
      currentBalance: Number(l.currentBalance),
      monthlyPayment: Number(l.monthlyPayment),
      interestRate: Number(l.interestRate),
      startDate: l.startDate,
      projectedPayoffDate: l.projectedPayoffDate,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }))

    return {
      success: true,
      data: transformedLoans,
    }
  }
  catch (error: any) {
    console.error('Error fetching loans:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch loans',
    })
  }
})
