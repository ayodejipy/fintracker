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
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

    // Get all transactions for the month
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Get budgets for the month
    const budgets = await prisma.budget.findMany({
      where: {
        userId: user.id,
        month,
      },
    })

    // Calculate daily spending pattern
    const dailySpending = transactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((acc: Record<number, number>, t: any) => {
        const day = t.date.getDate()
        acc[day] = (acc[day] || 0) + t.amount
        return acc
      }, {} as Record<number, number>)

    // Calculate category-wise spending vs budget
    const categoryAnalysis = budgets.map((budget: any) => {
      const categoryTransactions = transactions.filter(
        (t: any) => t.type === 'EXPENSE' && t.category === budget.category,
      )

      const spent = categoryTransactions.reduce((sum: number, t: any) => sum + t.amount, 0)
      const transactionCount = categoryTransactions.length
      const averageTransaction = transactionCount > 0 ? spent / transactionCount : 0

      return {
        category: budget.category,
        budgeted: Number(budget.monthlyLimit),
        spent,
        remaining: Number(budget.monthlyLimit) - spent,
        utilization: Number(budget.monthlyLimit) > 0 ? (spent / Number(budget.monthlyLimit)) * 100 : 0,
        transactionCount,
        averageTransaction,
        isOverBudget: spent > Number(budget.monthlyLimit),
        transactions: categoryTransactions.map((t: any) => ({
          id: t.id,
          amount: t.amount,
          description: t.description,
          date: t.date,
        })),
      }
    })

    // Calculate income sources
    const incomeByCategory = transactions
      .filter((t: any) => t.type === 'INCOME')
      .reduce((acc: Record<string, number>, t: any) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    // Calculate week-over-week comparison
    const weeks = []
    const currentDate = new Date(startDate)
    let weekNumber = 1

    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate)
      const weekEnd = new Date(currentDate)
      weekEnd.setDate(weekEnd.getDate() + 6)

      if (weekEnd > endDate) {
        weekEnd.setTime(endDate.getTime())
      }

      const weekTransactions = transactions.filter((t: any) =>
        t.date >= weekStart && t.date <= weekEnd,
      )

      const weekIncome = weekTransactions
        .filter((t: any) => t.type === 'INCOME')
        .reduce((sum: number, t: any) => sum + t.amount, 0)

      const weekExpenses = weekTransactions
        .filter((t: any) => t.type === 'EXPENSE')
        .reduce((sum: number, t: any) => sum + t.amount, 0)

      weeks.push({
        week: weekNumber,
        startDate: weekStart,
        endDate: weekEnd,
        income: weekIncome,
        expenses: weekExpenses,
        netIncome: weekIncome - weekExpenses,
        transactionCount: weekTransactions.length,
      })

      currentDate.setDate(currentDate.getDate() + 7)
      weekNumber++
    }

    // Calculate comparison with previous month
    const prevMonth = new Date(startDate)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    const prevMonthStr = prevMonth.toISOString().slice(0, 7)

    const prevMonthStart = new Date(`${prevMonthStr}-01`)
    const prevMonthEnd = new Date(prevMonthStart.getFullYear(), prevMonthStart.getMonth() + 1, 0)

    const prevMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
      },
    })

    const prevMonthIncome = prevMonthTransactions
      .filter((t: any) => t.type === 'INCOME')
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    const prevMonthExpenses = prevMonthTransactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    const currentIncome = transactions
      .filter((t: any) => t.type === 'INCOME')
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    const currentExpenses = transactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + t.amount, 0)

    const monthComparison = {
      income: {
        current: currentIncome,
        previous: prevMonthIncome,
        change: currentIncome - prevMonthIncome,
        changePercentage: prevMonthIncome > 0 ? ((currentIncome - prevMonthIncome) / prevMonthIncome) * 100 : 0,
      },
      expenses: {
        current: currentExpenses,
        previous: prevMonthExpenses,
        change: currentExpenses - prevMonthExpenses,
        changePercentage: prevMonthExpenses > 0 ? ((currentExpenses - prevMonthExpenses) / prevMonthExpenses) * 100 : 0,
      },
    }

    // Prepare response
    const monthlySummary = {
      month,
      period: {
        startDate,
        endDate,
        daysInMonth: endDate.getDate(),
      },

      // Overall summary
      summary: {
        totalIncome: currentIncome,
        totalExpenses: currentExpenses,
        netIncome: currentIncome - currentExpenses,
        transactionCount: transactions.length,
        averageDailySpending: currentExpenses / endDate.getDate(),
      },

      // Income breakdown
      income: {
        total: currentIncome,
        byCategory: Object.entries(incomeByCategory).map(([category, amount]) => ({
          category,
          amount,
          percentage: currentIncome > 0 ? (amount / currentIncome) * 100 : 0,
        })),
      },

      // Budget analysis
      budgetAnalysis: {
        categories: categoryAnalysis,
        totalBudgeted: budgets.reduce((sum: number, b: any) => sum + Number(b.monthlyLimit), 0),
        totalSpent: currentExpenses,
        overBudgetCategories: categoryAnalysis.filter(c => c.isOverBudget).length,
      },

      // Spending patterns
      spendingPatterns: {
        dailySpending: Object.entries(dailySpending).map(([day, amount]) => ({
          day: Number.parseInt(day),
          amount,
        })).sort((a, b) => a.day - b.day),
        weeklyBreakdown: weeks,
      },

      // Month-over-month comparison
      comparison: monthComparison,

      // All transactions for the month
      transactions: transactions.map((t: any) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description,
        date: t.date,
      })),
    }

    return {
      success: true,
      data: monthlySummary,
    }
  }
  catch (error: unknown) {
    console.error('Monthly summary error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch monthly summary',
    })
  }
})
