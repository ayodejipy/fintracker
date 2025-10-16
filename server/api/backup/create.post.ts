import { z } from 'zod'
import { prisma as db } from '../../../app/utils/database'
import {
  asyncHandler,
  requireAuth,
  validateRequestBody,
} from '../../utils/error-handler'

const createBackupSchema = z.object({
  userId: z.string().optional(), // Optional, will use authenticated user if not provided
  includePreferences: z.boolean().default(true),
  includeNotifications: z.boolean().default(false), // Usually don't backup notifications
})

export default defineEventHandler(asyncHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await validateRequestBody(createBackupSchema, event)

  const targetUserId = body.userId || user.id

  // Ensure user can only backup their own data (unless admin)
  if (targetUserId !== user.id && !user.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Cannot backup other user data',
    })
  }

  try {
    // Get all user data
    const [
      userData,
      transactions,
      budgets,
      loans,
      savingsGoals,
      notificationPreferences,
      notifications,
    ] = await Promise.all([
      // User profile data
      db.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          email: true,
          name: true,
          monthlyIncome: true,
          currency: true,
          createdAt: true,
        },
      }),

      // Financial data
      db.transaction.findMany({
        where: { userId: targetUserId },
        orderBy: { date: 'desc' },
      }),

      db.budget.findMany({
        where: { userId: targetUserId },
        orderBy: [{ month: 'desc' }, { category: 'asc' }],
      }),

      db.loan.findMany({
        where: { userId: targetUserId },
        orderBy: { startDate: 'desc' },
      }),

      db.savingsGoal.findMany({
        where: { userId: targetUserId },
        orderBy: { targetDate: 'asc' },
      }),

      // Preferences and notifications (optional)
      body.includePreferences
        ? db.notificationPreferences.findUnique({
            where: { userId: targetUserId },
          })
        : null,

      body.includeNotifications
        ? db.notification.findMany({
            where: { userId: targetUserId },
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit notifications to recent 100
          })
        : [],
    ])

    if (!userData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    // Create backup object
    const backup = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      userId: targetUserId,
      user: userData,
      data: {
        transactions: transactions.map(t => ({
          ...t,
          amount: Number(t.amount), // Convert Decimal to number for JSON
          date: t.date.toISOString(),
        })),
        budgets: budgets.map(b => ({
          ...b,
          monthlyLimit: Number(b.monthlyLimit),
          currentSpent: Number(b.currentSpent),
        })),
        loans: loans.map(l => ({
          ...l,
          initialAmount: Number(l.initialAmount),
          currentBalance: Number(l.currentBalance),
          monthlyPayment: Number(l.monthlyPayment),
          interestRate: Number(l.interestRate),
          startDate: l.startDate.toISOString(),
          projectedPayoffDate: l.projectedPayoffDate?.toISOString() || null,
        })),
        savingsGoals: savingsGoals.map(g => ({
          ...g,
          targetAmount: Number(g.targetAmount),
          currentAmount: Number(g.currentAmount),
          monthlyContribution: Number(g.monthlyContribution),
          targetDate: g.targetDate.toISOString(),
        })),
        notificationPreferences: notificationPreferences
          ? {
              ...notificationPreferences,
              createdAt: notificationPreferences.createdAt.toISOString(),
              updatedAt: notificationPreferences.updatedAt.toISOString(),
            }
          : null,
        notifications: notifications.map(n => ({
          ...n,
          scheduledAt: n.scheduledAt?.toISOString() || null,
          readAt: n.readAt?.toISOString() || null,
          createdAt: n.createdAt.toISOString(),
        })),
      },
      metadata: {
        totalTransactions: transactions.length,
        totalBudgets: budgets.length,
        totalLoans: loans.length,
        totalSavingsGoals: savingsGoals.length,
        totalNotifications: notifications.length,
        backupSize: 0, // Will be calculated
      },
    }

    // Calculate backup size (rough estimation)
    const backupJson = JSON.stringify(backup)
    backup.metadata.backupSize = Buffer.byteLength(backupJson, 'utf8')

    return {
      success: true,
      backup,
      metadata: {
        backupId: `backup_${targetUserId}_${Date.now()}`,
        createdAt: backup.createdAt,
        size: backup.metadata.backupSize,
        itemCounts: {
          transactions: backup.metadata.totalTransactions,
          budgets: backup.metadata.totalBudgets,
          loans: backup.metadata.totalLoans,
          savingsGoals: backup.metadata.totalSavingsGoals,
          notifications: backup.metadata.totalNotifications,
        },
      },
    }
  }
  catch (error) {
    console.error('Backup creation error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create backup',
    })
  }
}))
