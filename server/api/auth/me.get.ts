import { serverSupabaseUser } from '#supabase/server'
import { prisma } from '../../../app/utils/database'
import { getUserSession } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // First try to get Supabase user from the module (handles OAuth and Supabase auth)
    const supabaseUser = await serverSupabaseUser(event)

    if (supabaseUser) {
      // JWT claims use 'sub' for user ID, not 'id'
      const userId = (supabaseUser.sub || supabaseUser.id) as string

      if (!userId) {
        return null
      }

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
        // If Supabase user exists but not in database, return minimal info
        // This allows the user to proceed while sync happens in background
        return {
          user: {
            id: userId,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || supabaseUser.user_metadata?.full_name || 'User',
            monthlyIncome: 0,
            currency: 'NGN',
            oauthProvider: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        }
      }

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

    // Fall back to custom JWT session (legacy support for email/password auth)
    const session = await getUserSession(event)

    if (!session?.user?.id) {
      return null
    }

    // Fetch full user data from database for JWT users too
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
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
      return null
    }

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
    console.error('Session check error:', error)
    return null
  }
})
