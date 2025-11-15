import { serverSupabaseUser } from '#supabase/server'
import { prisma } from '../../../app/utils/database'

export default defineEventHandler(async (event) => {
  try {
    console.log('[/api/auth/me] Starting session check...')

    // Get Supabase user from the server context
    // This works with both Supabase Auth tokens and OAuth tokens
    const supabaseUser = await serverSupabaseUser(event)
    console.log('[/api/auth/me] Supabase user present:', !!supabaseUser)

    if (!supabaseUser) {
      console.log('[/api/auth/me] No Supabase user found, returning null')
      return null
    }

    // Extract user ID from Supabase user object
    // JWT tokens use 'sub' for user ID, but we also check 'id' for flexibility
    const supabaseUserRecord = supabaseUser as Record<string, unknown> | undefined
    const userId = (supabaseUserRecord?.sub as string) || (supabaseUserRecord?.id as string)

    if (!userId) {
      console.warn('[/api/auth/me] No userId found in Supabase user object')
      return null
    }

    console.log('[/api/auth/me] Found userId:', userId)

    // Fetch full user data from database
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        monthlyIncome: true,
        currency: true,
        oauthProvider: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!dbUser) {
      console.warn('[/api/auth/me] Supabase user not found in database, returning minimal info')
      // If Supabase user exists but not in database, return minimal info
      // This allows the user to proceed while sync happens in background
      const userMetadata = supabaseUserRecord?.user_metadata as Record<string, string> | undefined
      return {
        user: {
          id: userId,
          email: (supabaseUserRecord?.email as string) || '',
          name: userMetadata?.name || userMetadata?.full_name || 'User',
          monthlyIncome: 0,
          currency: 'NGN',
          oauthProvider: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }
    }

    console.log('[/api/auth/me] User found in database:', dbUser.email)

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        monthlyIncome: Number(dbUser.monthlyIncome),
        currency: dbUser.currency,
        oauthProvider: dbUser.oauthProvider,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
      },
    }
  }
  catch (error) {
    console.error('[/api/auth/me] Unexpected error:', error instanceof Error ? error.message : String(error))
    console.error('[/api/auth/me] Full error:', error)
    return null
  }
})
