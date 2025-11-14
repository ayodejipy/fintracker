import { z } from 'zod'
import { prisma as db } from '../../../app/utils/database'
import { getUserSession } from '../../utils/auth'

const updateThemeSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  compactMode: z.boolean(),
  reducedMotion: z.boolean(),
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
    const preferences = updateThemeSchema.parse(body)

    // Upsert user preferences
    const userPreferences = await db.userPreferences.upsert({
      where: { userId: user.id },
      update: {
        theme: preferences.theme,
        compactMode: preferences.compactMode,
        reducedMotion: preferences.reducedMotion,
      },
      create: {
        userId: user.id,
        theme: preferences.theme,
        compactMode: preferences.compactMode,
        reducedMotion: preferences.reducedMotion,
      },
      select: {
        id: true,
        theme: true,
        compactMode: true,
        reducedMotion: true,
        locale: true,
      },
    })

    return {
      success: true,
      data: userPreferences,
      message: 'Theme preferences updated successfully',
    }
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Theme update error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update theme preferences',
    })
  }
})
