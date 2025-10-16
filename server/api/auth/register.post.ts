import { AUTH_ERRORS, AuthError, hashPassword, registerSchema, sanitizeUser } from '~/utils/auth'
import { prisma } from '~/utils/database'
import { createUserSession, setAuthCookie } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Validate input
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      throw new AuthError('User with this email already exists', AUTH_ERRORS.USER_EXISTS)
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        monthlyIncome: validatedData.monthlyIncome,
        currency: 'NGN',
      },
    })

    // Create JWT token and set cookie
    const token = await createUserSession({
      id: user.id,
      email: user.email,
      name: user.name,
    })

    setAuthCookie(event, token)

    return {
      success: true,
      user: sanitizeUser(user),
      token,
    }
  }
  catch (error: unknown) {
    if (error instanceof AuthError) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message,
        data: { code: error.code },
      })
    }

    if (error instanceof Error && error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: { errors: (error as any).errors },
      })
    }

    console.error('Registration error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
