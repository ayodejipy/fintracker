import { PrismaClient } from '@prisma/client'
import { getUserSession } from '../../utils/auth'

const prisma = new PrismaClient()

/**
 * Create user profile in database after Supabase auth signup
 * POST /api/users/profile
 */
export default defineEventHandler(async (event) => {
  try {
    // Require authentication before allowing profile creation
    const session = await getUserSession(event)
    if (!session) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: 'You must be authenticated to create a profile',
      })
    }

    const body = await readBody(event)

    // Validate required fields
    if (!body.id || !body.email || !body.name) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: id, email, name',
      })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: body.id },
    })

    if (existingUser) {
      return {
        success: true,
        user: existingUser,
        message: 'User profile already exists',
      }
    }

    // Create user profile
    const user = await prisma.user.create({
      data: {
        id: body.id, // Supabase UUID
        email: body.email,
        name: body.name,
        monthlyIncome: body.monthlyIncome || 0,
        currency: body.currency || 'NGN',
        emailVerified: false, // Will be updated on email confirmation
      },
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        monthlyIncome: user.monthlyIncome,
        currency: user.currency,
      },
      message: 'User profile created successfully',
    }
  }
  catch (error: any) {
    console.error('Error creating user profile:', error)

    // Handle duplicate email error
    if (error.code === 'P2002') {
      throw createError({
        statusCode: 409,
        message: 'User with this email already exists',
      })
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create user profile',
    })
  }
})
