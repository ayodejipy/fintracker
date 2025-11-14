import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma as db } from '../../../app/utils/database'
import { getUserSession } from '../../utils/auth'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
})

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

    // Validate request body
    const body = await readBody(event)
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    // Get user with password hash and oauthProvider
    const userWithPassword = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, password: true, oauthProvider: true },
    })

    if (!userWithPassword) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    // Prevent OAuth users from changing password
    if (userWithPassword.oauthProvider) {
      const providerName = userWithPassword.oauthProvider.charAt(0).toUpperCase() + userWithPassword.oauthProvider.slice(1)
      throw createError({
        statusCode: 400,
        statusMessage: `You're signed in with ${providerName}. Password management is handled by your ${providerName} account.`,
      })
    }

    // Verify password field exists for email/password users
    if (!userWithPassword.password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No password set for this account',
      })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.password)
    if (!isCurrentPasswordValid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Current password is incorrect',
      })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    })

    return {
      success: true,
      message: 'Password updated successfully',
    }
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Password change error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to change password',
    })
  }
})
