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

    // Get user preferences (create with defaults if doesn't exist)
    let userPreferences = await db.userPreferences.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        theme: true,
        compactMode: true,
        reducedMotion: true,
        locale: true,
      },
    })

    // If preferences don't exist, create them with defaults
    if (!userPreferences) {
      userPreferences = await db.userPreferences.create({
        data: {
          userId: user.id,
        },
        select: {
          id: true,
          theme: true,
          compactMode: true,
          reducedMotion: true,
          locale: true,
        },
      })
    }

    return {
      success: true,
      data: userPreferences,
    }
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Theme preferences fetch error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch theme preferences',
    })
  }
})
