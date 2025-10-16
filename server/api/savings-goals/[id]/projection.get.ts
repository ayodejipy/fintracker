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

    // Get savings goal ID from route params
    const goalId = getRouterParam(event, 'id')
    if (!goalId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Savings goal ID is required',
      })
    }

    // Find the savings goal
    const savingsGoal = await prisma.savingsGoal.findFirst({
      where: {
        id: goalId,
        userId: (session.user as any).id,
      },
    })

    if (!savingsGoal) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Savings goal not found',
      })
    }

    const currentAmount = Number(savingsGoal.currentAmount)
    const targetAmount = Number(savingsGoal.targetAmount)
    const monthlyContribution = Number(savingsGoal.monthlyContribution)
    const targetDate = new Date(savingsGoal.targetDate)
    const today = new Date()

    // Calculate months until target date
    const monthsUntilTarget = Math.ceil(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
    )

    // Calculate remaining amount needed
    const remainingAmount = Math.max(0, targetAmount - currentAmount)

    // Calculate months needed at current contribution rate
    const monthsNeeded = monthlyContribution > 0
      ? Math.ceil(remainingAmount / monthlyContribution)
      : Infinity

    // Calculate projected completion date
    const projectedCompletionDate = monthlyContribution > 0
      ? new Date(today.getTime() + (monthsNeeded * 30.44 * 24 * 60 * 60 * 1000))
      : null

    // Calculate if goal is achievable by target date
    const isAchievable = monthsNeeded <= monthsUntilTarget

    // Calculate required monthly contribution to meet target date
    const requiredMonthlyContribution = monthsUntilTarget > 0
      ? remainingAmount / monthsUntilTarget
      : remainingAmount

    // Generate monthly projection
    const monthlyProjection = []
    let projectedAmount = currentAmount
    const projectionDate = new Date(today)

    for (let i = 0; i < Math.min(monthsNeeded, 24); i++) { // Limit to 24 months for performance
      projectedAmount += monthlyContribution
      projectionDate.setMonth(projectionDate.getMonth() + 1)

      monthlyProjection.push({
        month: i + 1,
        date: new Date(projectionDate),
        projectedAmount: Math.min(projectedAmount, targetAmount),
        contribution: monthlyContribution,
        isComplete: projectedAmount >= targetAmount,
      })

      if (projectedAmount >= targetAmount) { break }
    }

    // Calculate progress percentage
    const progressPercentage = targetAmount > 0
      ? Math.min((currentAmount / targetAmount) * 100, 100)
      : 0

    return {
      success: true,
      data: {
        goalId: savingsGoal.id,
        goalName: savingsGoal.name,
        currentAmount,
        targetAmount,
        remainingAmount,
        monthlyContribution,
        targetDate,
        monthsUntilTarget,
        monthsNeeded: monthsNeeded === Infinity ? null : monthsNeeded,
        projectedCompletionDate,
        isAchievable,
        requiredMonthlyContribution,
        progressPercentage,
        monthlyProjection,
        insights: {
          onTrack: isAchievable,
          daysRemaining: Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
          averageDailySavingsNeeded: monthsUntilTarget > 0
            ? remainingAmount / (monthsUntilTarget * 30.44)
            : 0,
        },
      },
    }
  }
  catch (error: any) {
    console.error('Error calculating savings projection:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to calculate savings projection',
    })
  }
})
