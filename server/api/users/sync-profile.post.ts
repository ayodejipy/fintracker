import { serverSupabaseUser } from '#supabase/server'
import { prisma as db } from '../../../app/utils/database'
import { getUserSession } from '../../utils/auth'

interface SyncProfileRequest {
  userId: string
  email: string
  name: string
  avatar?: string
  oauthProvider?: string
  oauthProviderUserId?: string
}

export default defineEventHandler(async (event) => {
  try {
    // Try to authenticate the user
    // This endpoint can be called:
    // 1. From OAuth callback (user has Supabase token but not yet in DB)
    // 2. From regular authenticated requests (user has JWT cookie)

    let authenticatedUserId: string | null = null

    // First try to get Supabase user (OAuth flow)
    try {
      const supabaseUser = await serverSupabaseUser(event)
      if (supabaseUser) {
        const userId = (supabaseUser as any)?.sub || (supabaseUser as any)?.id
        if (userId) {
          authenticatedUserId = userId
          console.warn('✅ Authenticated via Supabase token:', userId)
        }
      }
    }
    catch (error) {
      console.warn('⚠️ Supabase auth failed, trying JWT fallback...')
    }

    // Fallback to JWT session if Supabase auth didn't work
    if (!authenticatedUserId) {
      const session = await getUserSession(event)
      if (session?.user?.id) {
        authenticatedUserId = session.user.id
        console.warn('✅ Authenticated via JWT cookie:', authenticatedUserId)
      }
    }

    // If still no auth, reject the request
    if (!authenticatedUserId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'You must be authenticated to sync your profile',
      })
    }

    // Get the user from the request
    const body = await readBody<SyncProfileRequest>(event)
    console.log('📝 sync-profile request:', {
      userId: body.userId,
      email: body.email,
      name: body.name,
      oauthProvider: body.oauthProvider,
    })

    if (!body.userId || !body.email) {
      console.error('❌ Missing required fields:', { userId: body.userId, email: body.email })
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: userId and email',
      })
    }

    console.log('🔄 Syncing user profile...')

    // First check if user exists by email (for existing email/password users converting to OAuth)
    const existingUserByEmail = await db.user.findUnique({
      where: { email: body.email },
    })

    if (existingUserByEmail) {
      console.log('👤 User found by email, updating with OAuth info...')
      // Update existing user with OAuth info, using their existing ID
      const updatedUser = await db.user.update({
        where: { email: body.email },
        data: {
          id: body.userId, // Update to match OAuth user ID if different
          name: body.name,
          avatar: body.avatar,
          oauthProvider: body.oauthProvider,
          oauthProviderUserId: body.oauthProviderUserId,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          oauthProvider: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      console.log('✅ User profile updated successfully')
      return {
        success: true,
        message: 'User profile updated successfully',
        user: updatedUser,
      }
    }

    // User doesn't exist by email, try by OAuth ID
    const existingUserById = await db.user.findUnique({
      where: { id: body.userId },
    })

    if (existingUserById) {
      console.log('👤 User found by ID, updating profile...')
      // Update existing OAuth user
      const updatedUser = await db.user.update({
        where: { id: body.userId },
        data: {
          name: body.name,
          email: body.email,
          avatar: body.avatar,
          oauthProvider: body.oauthProvider,
          oauthProviderUserId: body.oauthProviderUserId,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          oauthProvider: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      console.log('✅ User profile updated successfully')
      return {
        success: true,
        message: 'User profile updated successfully',
        user: updatedUser,
      }
    }

    // User doesn't exist anywhere, create new
    console.log('🆕 Creating new user profile...')
    const newUser = await db.user.create({
      data: {
        id: body.userId,
        email: body.email,
        name: body.name,
        avatar: body.avatar,
        oauthProvider: body.oauthProvider,
        oauthProviderUserId: body.oauthProviderUserId,
        emailVerified: true, // OAuth email is already verified by provider
        emailVerifiedAt: new Date(),
        currency: 'NGN',
        monthlyIncome: 0,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        oauthProvider: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    console.log('✅ User profile created successfully')
    return {
      success: true,
      message: 'User profile created successfully',
      user: newUser,
    }
  }
  catch (error) {
    console.error('❌ Profile sync error:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error message:', errorMsg)
    if (error instanceof Error) {
      console.error('Error stack:', error.stack)
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to sync user profile',
    })
  }
})
