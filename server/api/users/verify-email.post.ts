import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Update user email verification status
 * POST /api/users/verify-email
 */
export default defineEventHandler(async (event) => {
  try {
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
