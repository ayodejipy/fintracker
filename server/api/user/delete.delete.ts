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

    const userId = session.user.id

    // Delete user and all related data in a transaction
    // Prisma cascade deletes should handle related records
    await db.user.delete({
      where: { id: userId },
    })

    // Clear the session
    await clearUserSession(event)

    return {
      success: true,
      message: 'Account successfully deleted',
    }
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Account deletion error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete account',
    })
  }
})
