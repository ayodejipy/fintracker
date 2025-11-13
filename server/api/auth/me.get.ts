import { serverSupabaseUser } from '#supabase/server'
import { getUserSession } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // First try to get Supabase user from the module (handles OAuth and Supabase auth)
    const user = await serverSupabaseUser(event)

    if (user) {
      return {
        user: {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.user_metadata?.full_name || 'User',
        },
      }
    }

    // Fall back to custom JWT session (legacy support for email/password auth)
    const session = await getUserSession(event)

    if (!session?.user) {
      return null
    }

    return {
      user: session.user,
    }
  }
  catch (error) {
    console.error('Session check error:', error)
    return null
  }
})
