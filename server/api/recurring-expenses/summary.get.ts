import { PrismaClient } from '@prisma/client'
import { getUserSession } from '../../utils/auth'

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

    const user = session.user as any

    // Get active recurring expenses
    const recurringExpenses = await prisma.recurringExpense.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
    })

    // Calculate total monthly commitments
    const totalMonthlyCommitments = recurringExpenses.reduce((sum, expense) => {
      const amount = Number(expense.amount)
      switch (expense.frequency) {
        case 'weekly':
          return sum + (amount * 4.33) // Average weeks per month
        case 'monthly':
          return sum + amount
        case 'yearly':
          return sum + (amount / 12)
        default:
          return sum
      }
    }, 0)

    // Get upcoming expenses (next 30 days)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const upcomingExpenses = recurringExpenses
      .filter(expense => new Date(expense.nextDueDate) <= thirtyDaysFromNow)
      .map(expense => {
        const dueDate = new Date(expense.nextDueDate)
        const today = new Date()
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          id: expense.id,
          name: expense.name,
          amount: Number(expense.amount),
          dueDate,
          daysUntilDue,
        }
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)

    // Get current month's transactions to calculate recurring vs non-recurring
    const currentMonth = new Date().toISOString().slice(0, 7)
    const startDate = new Date(`${currentMonth}-01`)
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'expense',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const totalMonthlyExpenses = monthlyTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    const recurringExpenseAmount = Math.min(totalMonthlyCommitments, totalMonthlyExpenses)
    const nonRecurringAmount = Math.max(0, totalMonthlyExpenses - recurringExpenseAmount)
    const recurringPercentage = totalMonthlyExpenses > 0 ? (recurringExpenseAmount / totalMonthlyExpenses) * 100 : 0

    return {
      success: true,
      data: {
        totalMonthlyCommitments,
        upcomingExpenses,
        recurringVsNonRecurring: {
          recurring: recurringExpenseAmount,
          nonRecurring: nonRecurringAmount,
          recurringPercentage,
        },
      },
    }
  }
  catch (error: unknown) {
    console.error('Error fetching recurring expenses summary:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch recurring expenses summary',
    })
  }
})