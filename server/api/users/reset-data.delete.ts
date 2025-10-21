import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Delete all user data while keeping the user account
 * DELETE /api/users/reset-data
 */
export default defineEventHandler(async (event) => {
  try {
    // Get user session
    const session = await getUserSession(event)
    const userId = session?.user?.id

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'Authentication required',
      })
    }

    // Delete all user data in a transaction
    // Thanks to onDelete: Cascade in the schema, we can delete all related data easily
    const result = await prisma.$transaction(async (tx) => {
      // Delete all custom categories (system categories have userId = null, so they're safe)
      const categories = await tx.category.deleteMany({
        where: { userId },
      })

      // Delete all notifications
      const notifications = await tx.notification.deleteMany({
        where: { userId },
      })

      // Delete notification preferences
      const notificationPrefs = await tx.notificationPreferences.deleteMany({
        where: { userId },
      })

      // Delete all transactions
      const transactions = await tx.transaction.deleteMany({
        where: { userId },
      })

      // Delete all recurring expenses (transactions are already deleted above)
      const recurringExpenses = await tx.recurringExpense.deleteMany({
        where: { userId },
      })

      // Delete all budgets
      const budgets = await tx.budget.deleteMany({
        where: { userId },
      })

      // Delete all loans
      const loans = await tx.loan.deleteMany({
        where: { userId },
      })

      // Delete all savings goals
      const savingsGoals = await tx.savingsGoal.deleteMany({
        where: { userId },
      })

      return {
        categories: categories.count,
        notifications: notifications.count,
        notificationPrefs: notificationPrefs.count,
        transactions: transactions.count,
        recurringExpenses: recurringExpenses.count,
        budgets: budgets.count,
        loans: loans.count,
        savingsGoals: savingsGoals.count,
      }
    })

    return {
      success: true,
      message: 'All user data has been deleted successfully',
      deletedRecords: result,
    }
  }
  catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error resetting user data:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to reset user data',
    })
  }
})
