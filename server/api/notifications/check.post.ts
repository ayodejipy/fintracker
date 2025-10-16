import { getUserSession } from '../../utils/auth'
import { NotificationScheduler } from '../../utils/notification-scheduler'

export default defineEventHandler(async (event) => {
  try {
    // Get user from session (optional - could be admin only)
    const session = await getUserSession(event)
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      })
    }

    // Run notification checks
    await NotificationScheduler.runAllChecks()

    return {
      success: true,
      message: 'Notification checks completed successfully',
    }
  }
  catch (error: any) {
    console.error('Notification check error:', error)

    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to run notification checks',
    })
  }
})
