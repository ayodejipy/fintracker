import { z } from 'zod'
import { invalidateCache } from '../../../app/utils/cache'
import { prisma as db } from '../../../app/utils/database'
import {
  asyncHandler,
  handleDatabaseError,
  requireAuth,
  validateRequestBody,
} from '../../utils/error-handler'

const restoreBackupSchema = z.object({
  backupData: z.object({
    version: z.string(),
    userId: z.string(),
    user: z.object({
      email: z.string(),
      name: z.string(),
      monthlyIncome: z.number(),
      currency: z.string(),
    }),
    data: z.object({
      transactions: z.array(z.any()).optional(),
      budgets: z.array(z.any()).optional(),
      loans: z.array(z.any()).optional(),
      savingsGoals: z.array(z.any()).optional(),
      notificationPreferences: z.any().optional(),
      notifications: z.array(z.any()).optional(),
    }),
  }),
  options: z.object({
    overwriteExisting: z.boolean().default(false),
    restoreTransactions: z.boolean().default(true),
    restoreBudgets: z.boolean().default(true),
    restoreLoans: z.boolean().default(true),
    restoreSavingsGoals: z.boolean().default(true),
    restorePreferences: z.boolean().default(true),
    restoreNotifications: z.boolean().default(false),
  }).optional(),
})

export default defineEventHandler(asyncHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await validateRequestBody(restoreBackupSchema, event)

  const { backupData, options = {} } = body
  const {
    overwriteExisting = false,
    restoreTransactions = true,
    restoreBudgets = true,
    restoreLoans = true,
    restoreSavingsGoals = true,
    restorePreferences = true,
    restoreNotifications = false,
  } = options

  // Ensure user can only restore to their own account
  if (backupData.userId !== user.id && !user.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot restore backup to different user account',
    })
  }

  // Validate backup version compatibility
  if (backupData.version !== '1.0') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Incompatible backup version',
    })
  }

  try {
    const results = {
      transactions: { created: 0, skipped: 0, errors: 0 },
      budgets: { created: 0, skipped: 0, errors: 0 },
      loans: { created: 0, skipped: 0, errors: 0 },
      savingsGoals: { created: 0, skipped: 0, errors: 0 },
      preferences: { updated: false, error: null },
      notifications: { created: 0, skipped: 0, errors: 0 },
    }

    // Use database transaction for data consistency
    await db.$transaction(async (tx) => {
      // Clear existing data if overwrite is requested
      if (overwriteExisting) {
        await Promise.all([
          tx.notification.deleteMany({ where: { userId: user.id } }),
          tx.transaction.deleteMany({ where: { userId: user.id } }),
          tx.budget.deleteMany({ where: { userId: user.id } }),
          tx.loan.deleteMany({ where: { userId: user.id } }),
          tx.savingsGoal.deleteMany({ where: { userId: user.id } }),
        ])
      }

      // Restore transactions
      if (restoreTransactions && backupData.data.transactions) {
        for (const transaction of backupData.data.transactions) {
          try {
            // Check if transaction already exists (by amount, date, description)
            if (!overwriteExisting) {
              const existing = await tx.transaction.findFirst({
                where: {
                  userId: user.id,
                  amount: transaction.amount,
                  date: new Date(transaction.date),
                  description: transaction.description,
                },
              })

              if (existing) {
                results.transactions.skipped++
                continue
              }
            }

            await tx.transaction.create({
              data: {
                userId: user.id,
                amount: transaction.amount,
                category: transaction.category,
                description: transaction.description,
                date: new Date(transaction.date),
                type: transaction.type,
              },
            })
            results.transactions.created++
          }
          catch (error) {
            console.error('Transaction restore error:', error)
            results.transactions.errors++
          }
        }
      }

      // Restore budgets
      if (restoreBudgets && backupData.data.budgets) {
        for (const budget of backupData.data.budgets) {
          try {
            if (!overwriteExisting) {
              const existing = await tx.budget.findFirst({
                where: {
                  userId: user.id,
                  category: budget.category,
                  month: budget.month,
                },
              })

              if (existing) {
                results.budgets.skipped++
                continue
              }
            }

            await tx.budget.upsert({
              where: {
                userId_category_month: {
                  userId: user.id,
                  category: budget.category,
                  month: budget.month,
                },
              },
              create: {
                userId: user.id,
                category: budget.category,
                monthlyLimit: budget.monthlyLimit,
                currentSpent: budget.currentSpent,
                month: budget.month,
              },
              update: {
                monthlyLimit: budget.monthlyLimit,
                currentSpent: budget.currentSpent,
              },
            })
            results.budgets.created++
          }
          catch (error) {
            console.error('Budget restore error:', error)
            results.budgets.errors++
          }
        }
      }

      // Restore loans
      if (restoreLoans && backupData.data.loans) {
        for (const loan of backupData.data.loans) {
          try {
            if (!overwriteExisting) {
              const existing = await tx.loan.findFirst({
                where: {
                  userId: user.id,
                  name: loan.name,
                  initialAmount: loan.initialAmount,
                },
              })

              if (existing) {
                results.loans.skipped++
                continue
              }
            }

            await tx.loan.create({
              data: {
                userId: user.id,
                name: loan.name,
                initialAmount: loan.initialAmount,
                currentBalance: loan.currentBalance,
                monthlyPayment: loan.monthlyPayment,
                interestRate: loan.interestRate,
                startDate: new Date(loan.startDate),
                projectedPayoffDate: loan.projectedPayoffDate ? new Date(loan.projectedPayoffDate) : null,
              },
            })
            results.loans.created++
          }
          catch (error) {
            console.error('Loan restore error:', error)
            results.loans.errors++
          }
        }
      }

      // Restore savings goals
      if (restoreSavingsGoals && backupData.data.savingsGoals) {
        for (const goal of backupData.data.savingsGoals) {
          try {
            if (!overwriteExisting) {
              const existing = await tx.savingsGoal.findFirst({
                where: {
                  userId: user.id,
                  name: goal.name,
                  targetAmount: goal.targetAmount,
                },
              })

              if (existing) {
                results.savingsGoals.skipped++
                continue
              }
            }

            await tx.savingsGoal.create({
              data: {
                userId: user.id,
                name: goal.name,
                targetAmount: goal.targetAmount,
                currentAmount: goal.currentAmount,
                targetDate: new Date(goal.targetDate),
                monthlyContribution: goal.monthlyContribution,
              },
            })
            results.savingsGoals.created++
          }
          catch (error) {
            console.error('Savings goal restore error:', error)
            results.savingsGoals.errors++
          }
        }
      }

      // Restore notification preferences
      if (restorePreferences && backupData.data.notificationPreferences) {
        try {
          const prefs = backupData.data.notificationPreferences
          await tx.notificationPreferences.upsert({
            where: { userId: user.id },
            create: {
              userId: user.id,
              budgetAlerts: prefs.budgetAlerts,
              paymentReminders: prefs.paymentReminders,
              savingsReminders: prefs.savingsReminders,
              goalAchievements: prefs.goalAchievements,
              emailNotifications: prefs.emailNotifications,
              pushNotifications: prefs.pushNotifications,
              budgetThreshold: prefs.budgetThreshold,
              reminderDaysBefore: prefs.reminderDaysBefore,
            },
            update: {
              budgetAlerts: prefs.budgetAlerts,
              paymentReminders: prefs.paymentReminders,
              savingsReminders: prefs.savingsReminders,
              goalAchievements: prefs.goalAchievements,
              emailNotifications: prefs.emailNotifications,
              pushNotifications: prefs.pushNotifications,
              budgetThreshold: prefs.budgetThreshold,
              reminderDaysBefore: prefs.reminderDaysBefore,
            },
          })
          results.preferences.updated = true
        }
        catch (error) {
          console.error('Preferences restore error:', error)
          results.preferences.error = error.message
        }
      }

      // Restore notifications (usually not recommended)
      if (restoreNotifications && backupData.data.notifications) {
        for (const notification of backupData.data.notifications) {
          try {
            await tx.notification.create({
              data: {
                userId: user.id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                isRead: notification.isRead,
                priority: notification.priority,
                scheduledAt: notification.scheduledAt ? new Date(notification.scheduledAt) : null,
                readAt: notification.readAt ? new Date(notification.readAt) : null,
                budgetId: notification.budgetId,
                loanId: notification.loanId,
                savingsGoalId: notification.savingsGoalId,
                transactionId: notification.transactionId,
              },
            })
            results.notifications.created++
          }
          catch (error) {
            console.error('Notification restore error:', error)
            results.notifications.errors++
          }
        }
      }
    })

    // Invalidate all user caches after restore
    invalidateCache.user(user.id)

    return {
      success: true,
      message: 'Backup restored successfully',
      results,
      summary: {
        totalItemsRestored:
          results.transactions.created
          + results.budgets.created
          + results.loans.created
          + results.savingsGoals.created
          + results.notifications.created,
        totalItemsSkipped:
          results.transactions.skipped
          + results.budgets.skipped
          + results.loans.skipped
          + results.savingsGoals.skipped
          + results.notifications.skipped,
        totalErrors:
          results.transactions.errors
          + results.budgets.errors
          + results.loans.errors
          + results.savingsGoals.errors
          + results.notifications.errors,
      },
    }
  }
  catch (error) {
    console.error('Backup restore error:', error)
    handleDatabaseError(error)
  }
}))
