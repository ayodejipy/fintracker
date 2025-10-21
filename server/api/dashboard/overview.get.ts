import { prisma } from '~/utils/database'
import { getUserSession } from '../../utils/auth'

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

    const user = session.user as any

    const query = getQuery(event)
    const month = query.month as string || new Date().toISOString().slice(0, 7)

    // Parse month to get start and end dates
    const startDate = new Date(`${month}-01`)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
    endDate.setHours(23, 59, 59, 999) // Include the entire last day of the month

    // Get transactions for the month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        amount: true,
        type: true,
        category: true,
        date: true,
      },
    })

    // Get budgets for the month
    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        month,
      },
      select: {
        id: true,
        category: true,
        monthlyLimit: true,
        currentSpent: true,
      },
    })

    // Get active loans
    const loans = await prisma.loan.findMany({
      where: {
        userId: user.id,
        currentBalance: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        currentBalance: true,
        monthlyPayment: true,
      },
    })

    // Get active savings goals
    const savingsGoals = await prisma.savingsGoal.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        name: true,
        targetAmount: true,
        currentAmount: true,
        monthlyContribution: true,
        targetDate: true,
      },
    })

    // Calculate income and expenses
    const income = transactions
      .filter((t: any) => t.type.toLowerCase() === 'income')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

    const expenses = transactions
      .filter((t: any) => t.type.toLowerCase() === 'expense')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

    // Calculate expense breakdown by category
    const expensesByCategory = transactions
      .filter((t: any) => t.type.toLowerCase() === 'expense')
      .reduce((acc: Record<string, number>, t: any) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
        return acc
      }, {} as Record<string, number>)

    // Calculate income breakdown by category
    const incomeByCategory = transactions
      .filter((t: any) => t.type.toLowerCase() === 'income')
      .reduce((acc: Record<string, number>, t: any) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
        return acc
      }, {} as Record<string, number>)

    // Calculate budget utilization
    const totalBudget = budgets.reduce((sum, b) => sum + Number(b.monthlyLimit), 0)
    const totalSpent = budgets.reduce((sum, b) => sum + Number(b.currentSpent), 0)
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    // Calculate debt summary
    const totalDebt = loans.reduce((sum, l) => sum + Number(l.currentBalance), 0)
    const totalMonthlyPayments = loans.reduce((sum, l) => sum + Number(l.monthlyPayment), 0)

    // Calculate savings summary
    const totalSavingsTarget = savingsGoals.reduce((sum, g) => sum + Number(g.targetAmount), 0)
    const totalSavingsCurrent = savingsGoals.reduce((sum, g) => sum + Number(g.currentAmount), 0)
    const totalMonthlyContributions = savingsGoals.reduce((sum, g) => sum + Number(g.monthlyContribution), 0)
    const savingsProgress = totalSavingsTarget > 0 ? (totalSavingsCurrent / totalSavingsTarget) * 100 : 0

    // Calculate net worth (simplified)
    const netWorth = totalSavingsCurrent - totalDebt

    // Calculate cash flow
    const cashFlow = income - expenses - totalMonthlyPayments - totalMonthlyContributions

    // Get recent transactions (last 5)
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    // Calculate monthly trends (last 6 months)
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const trendDate = new Date()
      trendDate.setMonth(trendDate.getMonth() - i)
      const trendMonth = trendDate.toISOString().slice(0, 7)

      const trendStartDate = new Date(`${trendMonth}-01`)
      trendStartDate.setHours(0, 0, 0, 0)

      const trendEndDate = new Date(trendStartDate.getFullYear(), trendStartDate.getMonth() + 1, 0)
      trendEndDate.setHours(23, 59, 59, 999) // Include the entire last day

      const monthTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          date: {
            gte: trendStartDate,
            lte: trendEndDate,
          },
        },
        select: {
          amount: true,
          type: true,
        },
      })

      const monthIncome = monthTransactions
        .filter((t: any) => t.type.toLowerCase() === 'income')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

      const monthExpenses = monthTransactions
        .filter((t: any) => t.type.toLowerCase() === 'expense')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

      monthlyTrends.push({
        month: trendMonth,
        income: monthIncome,
        expenses: monthExpenses,
        netIncome: monthIncome - monthExpenses,
      })
    }

    // Prepare response data
    const dashboardData = {
      // Current month summary
      currentMonth: {
        month,
        income,
        expenses,
        netIncome: income - expenses,
        cashFlow,
      },

      // Financial overview
      overview: {
        netWorth,
        totalDebt,
        totalSavings: totalSavingsCurrent,
        monthlyCommitments: totalMonthlyPayments + totalMonthlyContributions,
      },

      // Budget summary
      budget: {
        totalBudget,
        totalSpent,
        utilization: budgetUtilization,
        remaining: totalBudget - totalSpent,
        categories: budgets.map((b: any) => ({
          category: b.category,
          budgeted: Number(b.monthlyLimit),
          spent: Number(b.currentSpent),
          remaining: Number(b.monthlyLimit) - Number(b.currentSpent),
          utilization: Number(b.monthlyLimit) > 0 ? (Number(b.currentSpent) / Number(b.monthlyLimit)) * 100 : 0,
        })),
      },

      // Debt summary
      debt: {
        totalDebt,
        monthlyPayments: totalMonthlyPayments,
        activeLoans: loans.length,
        loans: loans.map((l: any) => ({
          id: l.id,
          name: l.name,
          balance: Number(l.currentBalance),
          monthlyPayment: Number(l.monthlyPayment),
        })),
      },

      // Savings summary
      savings: {
        totalTarget: totalSavingsTarget,
        totalCurrent: totalSavingsCurrent,
        progress: savingsProgress,
        monthlyContributions: totalMonthlyContributions,
        activeGoals: savingsGoals.length,
        goals: savingsGoals.map((g: any) => ({
          id: g.id,
          name: g.name,
          target: Number(g.targetAmount),
          current: Number(g.currentAmount),
          progress: Number(g.targetAmount) > 0 ? (Number(g.currentAmount) / Number(g.targetAmount)) * 100 : 0,
          monthlyContribution: Number(g.monthlyContribution),
        })),
      },

      // Expense breakdown
      expenses: {
        total: expenses,
        byCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
          category,
          amount,
          percentage: expenses > 0 ? (amount / expenses) * 100 : 0,
        })),
      },

      // Income breakdown
      income: {
        total: income,
        byCategory: Object.entries(incomeByCategory).map(([category, amount]) => ({
          category,
          amount,
          percentage: income > 0 ? (amount / income) * 100 : 0,
        })),
      },

      // Recent activity
      recentTransactions: recentTransactions.map((t: any) => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        category: t.category,
        date: t.date,
      })),

      // Monthly trends
      trends: monthlyTrends,
    }

    return {
      success: true,
      data: dashboardData,
    }
  }
  catch (error: any) {
    console.error('Dashboard overview error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch dashboard data',
    })
  }
})
