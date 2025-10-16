import { AUTH_ERRORS, AuthError, loginSchema, sanitizeUser, verifyPassword } from '~/utils/auth'
import { prisma } from '~/utils/database'
import { createUserSession, setAuthCookie } from '../../../server/utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Validate input
    const validatedData = loginSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      throw new AuthError('Invalid email or password', AUTH_ERRORS.INVALID_CREDENTIALS)
    }

    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password)

    if (!isValidPassword) {
      throw new AuthError('Invalid email or password', AUTH_ERRORS.INVALID_CREDENTIALS)
    }

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
        statusCode: 401,
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

    console.error('Login error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
