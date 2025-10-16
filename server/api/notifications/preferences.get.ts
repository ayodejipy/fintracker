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

    const user = session.user

    // Get or create notification preferences
    let preferences = await prisma.notificationPreferences.findUnique({
      where: {
        userId: user.id,
      },
    })

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: user.id,
          budgetAlerts: true,
          paymentReminders: true,
          savingsReminders: true,
          goalAchievements: true,
          emailNotifications: false,
          pushNotifications: true,
          budgetThreshold: 80,
          reminderDaysBefore: 3,
        },
      })
    }

    return {
      success: true,
      data: preferences,
    }
  }
  catch (error: any) {
    console.error('Get notification preferences error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch notification preferences',
    })
  }
})
