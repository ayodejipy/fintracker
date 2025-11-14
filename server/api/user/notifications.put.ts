import { z } from 'zod'
import { prisma as db } from '../../../app/utils/database'
import { getUserSession } from '../../utils/auth'

const updateNotificationsSchema = z.object({
  email: z.object({
    budgetAlerts: z.boolean(),
    goalReminders: z.boolean(),
    weeklyReports: z.boolean(),
    monthlyReports: z.boolean(),
    securityAlerts: z.boolean(),
  }),
  push: z.object({
    budgetAlerts: z.boolean(),
    goalReminders: z.boolean(),
    weeklyReports: z.boolean(),
    monthlyReports: z.boolean(),
    securityAlerts: z.boolean(),
  }),
})

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

    const user = session.user

    // Validate request body
    const body = await readBody(event)
    const preferences = updateNotificationsSchema.parse(body)

    // Upsert notification preferences
    const notificationPreferences = await db.notificationPreferences.upsert({
      where: { userId: user.id },
      update: {
        emailBudgetAlerts: preferences.email.budgetAlerts,
        emailGoalReminders: preferences.email.goalReminders,
        emailWeeklyReports: preferences.email.weeklyReports,
        emailMonthlyReports: preferences.email.monthlyReports,
        emailSecurityAlerts: preferences.email.securityAlerts,
        pushBudgetAlerts: preferences.push.budgetAlerts,
        pushGoalReminders: preferences.push.goalReminders,
        pushWeeklyReports: preferences.push.weeklyReports,
        pushMonthlyReports: preferences.push.monthlyReports,
        pushSecurityAlerts: preferences.push.securityAlerts,
      },
      create: {
        userId: user.id,
        emailBudgetAlerts: preferences.email.budgetAlerts,
        emailGoalReminders: preferences.email.goalReminders,
        emailWeeklyReports: preferences.email.weeklyReports,
        emailMonthlyReports: preferences.email.monthlyReports,
        emailSecurityAlerts: preferences.email.securityAlerts,
        pushBudgetAlerts: preferences.push.budgetAlerts,
        pushGoalReminders: preferences.push.goalReminders,
        pushWeeklyReports: preferences.push.weeklyReports,
        pushMonthlyReports: preferences.push.monthlyReports,
        pushSecurityAlerts: preferences.push.securityAlerts,
      },
      select: {
        id: true,
        emailBudgetAlerts: true,
        emailGoalReminders: true,
        emailWeeklyReports: true,
        emailMonthlyReports: true,
        emailSecurityAlerts: true,
        pushBudgetAlerts: true,
        pushGoalReminders: true,
        pushWeeklyReports: true,
        pushMonthlyReports: true,
        pushSecurityAlerts: true,
        budgetThreshold: true,
        reminderDaysBefore: true,
      },
    })

    return {
      success: true,
      data: notificationPreferences,
      message: 'Notification preferences updated successfully',
    }
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Notification preferences update error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update notification preferences',
    })
  }
})
