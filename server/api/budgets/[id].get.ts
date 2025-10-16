import type { Budget } from '~/types'
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

    // Get budget ID from route params
    const budgetId = getRouterParam(event, 'id')
    if (!budgetId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Budget ID is required',
      })
    }

    // Find budget
    const budget = await prisma.budget.findFirst({
      where: {
        id: budgetId,
        userId: (session.user as any).id,
      },
      select: {
        id: true,
        category: true,
        monthlyLimit: true,
        currentSpent: true,
        month: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!budget) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Budget not found',
      })
    }

    // Transform Prisma result to match our types
    const transformedBudget: Omit<Budget, 'userId'> = {
      id: budget.id,
      category: budget.category as any,
      monthlyLimit: Number(budget.monthlyLimit),
      currentSpent: Number(budget.currentSpent),
      month: budget.month,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    }

    return {
      success: true,
      data: transformedBudget,
    }
  }
  catch (error: any) {
    console.error('Error fetching budget:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch budget',
    })
  }
})
