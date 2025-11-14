import { prisma as db } from '../../../app/utils/database'
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

    const user = session.user

    // Get notification preferences (create with defaults if doesn't exist)
    let notificationPreferences = await db.notificationPreferences.findUnique({
      where: { userId: user.id },
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

    // If preferences don't exist, create them with defaults
    if (!notificationPreferences) {
      notificationPreferences = await db.notificationPreferences.create({
        data: {
          userId: user.id,
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
    }

    // Transform to frontend format
    const preferences = {
      email: {
        budgetAlerts: notificationPreferences.emailBudgetAlerts,
        goalReminders: notificationPreferences.emailGoalReminders,
        weeklyReports: notificationPreferences.emailWeeklyReports,
        monthlyReports: notificationPreferences.emailMonthlyReports,
        securityAlerts: notificationPreferences.emailSecurityAlerts,
      },
      push: {
        budgetAlerts: notificationPreferences.pushBudgetAlerts,
        goalReminders: notificationPreferences.pushGoalReminders,
        weeklyReports: notificationPreferences.pushWeeklyReports,
        monthlyReports: notificationPreferences.pushMonthlyReports,
        securityAlerts: notificationPreferences.pushSecurityAlerts,
      },
    }

    return {
      success: true,
      data: preferences,
    }
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Notification preferences fetch error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch notification preferences',
    })
  }
})
