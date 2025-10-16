import { prisma } from '~/utils/database'
import { getUserSession } from '../../../utils/auth'

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
    const notificationId = getRouterParam(event, 'id')

    if (!notificationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Notification ID is required',
      })
    }

    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.id,
      },
    })

    if (!existingNotification) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Notification not found',
      })
    }

    // Mark as read
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return {
      success: true,
      data: notification,
      message: 'Notification marked as read',
    }
  }
  catch (error: any) {
    console.error('Mark notification as read error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to mark notification as read',
    })
  }
})
