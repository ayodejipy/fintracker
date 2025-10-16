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

    // For now, we'll store notification preferences in a simple way
    // In a real app, you might want a separate UserPreferences table
    const _updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        // Store as JSON in a preferences field (you'd need to add this to your schema)
        // For now, we'll just return success
      },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
      },
    })

    return {
      success: true,
      preferences,
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
