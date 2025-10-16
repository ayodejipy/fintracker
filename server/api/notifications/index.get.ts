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
    const query = getQuery(event)

    const page = Number.parseInt(query.page as string) || 1
    const limit = Number.parseInt(query.limit as string) || 20
    const unreadOnly = query.unreadOnly === 'true'
    const type = query.type as string

    // Build where clause
    const where: any = {
      userId: user.id,
    }

    if (unreadOnly) {
      where.isRead = false
    }

    if (type) {
      where.type = type
    }

    // Get notifications with pagination
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      }),
    ])

    return {
      success: true,
      data: {
        data: notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    }
  }
  catch (error: any) {
    console.error('Get notifications error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch notifications',
    })
  }
})
