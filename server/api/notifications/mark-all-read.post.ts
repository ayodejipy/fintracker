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

    // Mark all unread notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return {
      success: true,
      data: {
        updatedCount: result.count,
      },
      message: `Marked ${result.count} notifications as read`,
    }
  }
  catch (error: any) {
    console.error('Mark all notifications as read error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to mark all notifications as read',
    })
  }
})
