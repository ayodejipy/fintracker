import { PrismaClient } from '@prisma/client'
import { serverSupabaseUser } from '#supabase/server'
import { getUserSession } from '../../utils/auth'

const prisma = new PrismaClient()

/**
 * Update user email verification status
 * POST /api/users/verify-email
 * Supports both Supabase tokens (signup flow) and JWT cookies (regular auth)
 */
export default defineEventHandler(async (event) => {
  try {
    // Authenticate user - support both Supabase and JWT
    let authenticatedUserId: string | null = null

    // Try Supabase first (signup flow)
    try {
      const supabaseUser = await serverSupabaseUser(event)
      if (supabaseUser) {
        const userId = (supabaseUser as any)?.sub || (supabaseUser as any)?.id
        if (userId) {
          authenticatedUserId = userId
          console.warn('✅ Email verification: Authenticated via Supabase token')
        }
      }
    }
    catch (error) {
      console.warn('⚠️ Email verification: Supabase auth failed, trying JWT...')
    }

    // Fallback to JWT session
    if (!authenticatedUserId) {
      const session = await getUserSession(event)
      if (session?.user?.id) {
        authenticatedUserId = session.user.id
        console.warn('✅ Email verification: Authenticated via JWT')
      }
    }

    // If still no auth, reject the request
    if (!authenticatedUserId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'You must be authenticated to verify your email',
      })
    }

    const body = await readBody(event)

    if (!body.userId) {
      throw createError({
        statusCode: 400,
        message: 'Missing userId',
      })
    }

    // Update user verification status
    const user = await prisma.user.update({
      where: { id: body.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailVerifiedAt: true,
      },
    })

    return {
      success: true,
      user,
      message: 'Email verified successfully',
    }
  }
  catch (error: any) {
    console.error('Error verifying email:', error)

    // User not found
    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to verify email',
    })
  }
})
