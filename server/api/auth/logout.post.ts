import { clearAuthCookie } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // Clear the auth cookie
    clearAuthCookie(event)

    return {
      success: true,
      message: 'Logged out successfully',
    }
  }
  catch (error) {
    console.error('Logout error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to logout',
    })
  }
})
