import { z } from 'zod'
import { prisma as db } from '../../../app/utils/database'
import { getUserSession } from '../../utils/auth'

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  avatar: z.string().optional(),
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
    const { name, email, avatar } = updateProfileSchema.parse(body)

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await db.user.findUnique({
        where: { email },
      })

      if (existingUser && existingUser.id !== user.id) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Email is already taken',
        })
      }
    }

    // Update user's profile
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        ...(avatar && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        currency: true,
        monthlyIncome: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return {
      success: true,
      user: updatedUser,
    }
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    console.error('Profile update error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update profile',
    })
  }
})
