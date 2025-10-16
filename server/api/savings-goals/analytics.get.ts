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

    const userId = (session.user as any).id

    // Get all savings goals
    const savingsGoals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Get savings transactions (contributions)
    const savingsTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        category: 'savings',
        type: 'expense',
      },
      orderBy: { date: 'desc' },
      take: 50, // Last 50 savings transactions
    })

    // Calculate overall savings analytics
    const totalTargetAmount = savingsGoals.reduce((sum, goal) =>
      sum + Number(goal.targetAmount), 0)

    const totalCurrentAmount = savingsGoals.reduce((sum, goal) =>
      sum + Number(goal.currentAmount), 0)

    const totalRemainingAmount = Math.max(0, totalTargetAmount - totalCurrentAmount)

    const totalMonthlyContributions = savingsGoals.reduce((sum, goal) =>
      sum + Number(goal.monthlyContribution), 0)

    // Calculate progress by goal
    const goalProgress = savingsGoals.map((goal) => {
      const currentAmount = Number(goal.currentAmount)
      const targetAmount = Number(goal.targetAmount)
      const progressPercentage = targetAmount > 0
        ? Math.min((currentAmount / targetAmount) * 100, 100)
        : 0

      const today = new Date()
      const targetDate = new Date(goal.targetDate)
      const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const monthsRemaining = Math.ceil(daysRemaining / 30.44)

      const remainingAmount = Math.max(0, targetAmount - currentAmount)
      const monthlyContribution = Number(goal.monthlyContribution)

      const monthsNeeded = monthlyContribution > 0
        ? Math.ceil(remainingAmount / monthlyContribution)
        : Infinity

      const isOnTrack = monthsNeeded <= monthsRemaining
      const isComplete = currentAmount >= targetAmount

      return {
        id: goal.id,
        name: goal.name,
        targetAmount,
        currentAmount,
        remainingAmount,
        progressPercentage,
        monthlyContribution,
        targetDate: goal.targetDate,
        daysRemaining: Math.max(0, daysRemaining),
        monthsRemaining: Math.max(0, monthsRemaining),
        monthsNeeded: monthsNeeded === Infinity ? null : monthsNeeded,
        isOnTrack,
        isComplete,
        status: isComplete ? 'completed' : (isOnTrack ? 'on_track' : 'behind'),
      }
    })

    // Calculate monthly savings trend (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const monthlySavings = await prisma.transaction.groupBy({
      by: ['date'],
      where: {
        userId,
        category: 'savings',
        type: 'expense',
        date: {
          gte: twelveMonthsAgo,
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Group by month
    const monthlyTrend = []
    const currentDate = new Date()

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`

      const monthSavings = monthlySavings
        .filter((saving) => {
          const savingDate = new Date(saving.date)
          return savingDate.getFullYear() === monthDate.getFullYear()
            && savingDate.getMonth() === monthDate.getMonth()
        })
        .reduce((sum, saving) => sum + Number(saving._sum.amount || 0), 0)

      monthlyTrend.push({
        month: monthKey,
        monthName: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: monthSavings,
      })
    }

    // Calculate milestones and achievements
    const completedGoals = goalProgress.filter(goal => goal.isComplete)
    const goalsOnTrack = goalProgress.filter(goal => goal.isOnTrack && !goal.isComplete)
    const goalsBehind = goalProgress.filter(goal => !goal.isOnTrack && !goal.isComplete)

    // Calculate average monthly savings
    const totalSavingsLast12Months = monthlyTrend.reduce((sum, month) => sum + month.amount, 0)
    const averageMonthlySavings = totalSavingsLast12Months / 12

    // Generate insights and recommendations
    const insights = []

    if (goalsBehind.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Goals Behind Schedule',
        message: `${goalsBehind.length} of your savings goals are behind schedule. Consider increasing your monthly contributions.`,
        actionable: true,
      })
    }

    if (averageMonthlySavings < totalMonthlyContributions) {
      const shortfall = totalMonthlyContributions - averageMonthlySavings
      insights.push({
        type: 'info',
        title: 'Contribution Shortfall',
        message: `You're averaging ₦${shortfall.toLocaleString()} less than your planned monthly contributions.`,
        actionable: true,
      })
    }

    if (completedGoals.length > 0) {
      insights.push({
        type: 'success',
        title: 'Goals Achieved',
        message: `Congratulations! You've completed ${completedGoals.length} savings goal${completedGoals.length > 1 ? 's' : ''}.`,
        actionable: false,
      })
    }

    return {
      success: true,
      data: {
        overview: {
          totalGoals: savingsGoals.length,
          completedGoals: completedGoals.length,
          activeGoals: savingsGoals.length - completedGoals.length,
          totalTargetAmount,
          totalCurrentAmount,
          totalRemainingAmount,
          totalMonthlyContributions,
          overallProgressPercentage: totalTargetAmount > 0
            ? Math.min((totalCurrentAmount / totalTargetAmount) * 100, 100)
            : 0,
        },
        goalProgress,
        monthlyTrend,
        analytics: {
          averageMonthlySavings,
          totalSavingsLast12Months,
          goalsOnTrack: goalsOnTrack.length,
          goalsBehind: goalsBehind.length,
          completedGoals: completedGoals.length,
        },
        insights,
        recentContributions: savingsTransactions.slice(0, 10).map(transaction => ({
          id: transaction.id,
          amount: Number(transaction.amount),
          description: transaction.description,
          date: transaction.date,
          createdAt: transaction.createdAt,
        })),
      },
    }
  }
  catch (error: any) {
    console.error('Error fetching savings analytics:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch savings analytics',
    })
  }
})
