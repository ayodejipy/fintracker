import { z } from 'zod'
import { prisma } from '~/utils/database'
import { getUserSession } from '../../utils/auth'

// Validation schema
const updatePreferencesSchema = z.object({
  budgetAlerts: z.boolean().optional(),
  paymentReminders: z.boolean().optional(),
  savingsReminders: z.boolean().optional(),
  goalAchievements: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  budgetThreshold: z.number().min(1).max(100).optional(),
  reminderDaysBefore: z.number().min(1).max(30).optional(),
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
    const body = await readBody(event)

    // Validate input
    const validatedData = updatePreferencesSchema.parse(body)

    // Update or create preferences
    const preferences = await prisma.notificationPreferences.upsert({
      where: {
        userId: user.id,
      },
      update: validatedData,
      create: {
        userId: user.id,
        budgetAlerts: validatedData.budgetAlerts ?? true,
        paymentReminders: validatedData.paymentReminders ?? true,
        savingsReminders: validatedData.savingsReminders ?? true,
        goalAchievements: validatedData.goalAchievements ?? true,
        emailNotifications: validatedData.emailNotifications ?? false,
        pushNotifications: validatedData.pushNotifications ?? true,
        budgetThreshold: validatedData.budgetThreshold ?? 80,
        reminderDaysBefore: validatedData.reminderDaysBefore ?? 3,
      },
    })

    return {
      success: true,
      data: preferences,
      message: 'Notification preferences updated successfully',
    }
  }
  catch (error: any) {
    console.error('Update notification preferences error:', error)

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: error.errors },
      })
    }

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to update notification preferences',
    })
  }
})
