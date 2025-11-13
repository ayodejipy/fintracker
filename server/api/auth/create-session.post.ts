import { createUserSession, setAuthCookie } from '../../utils/auth'

interface CreateSessionRequest {
  userId: string
  email: string
  name: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CreateSessionRequest>(event)

    if (!body.userId || !body.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: userId and email',
      })
    }

    console.warn('🔐 create-session: Creating JWT token for OAuth user:', { userId: body.userId, email: body.email })

    // Create JWT token
    const token = await createUserSession({
      id: body.userId,
      email: body.email,
      name: body.name,
    })

    // Set auth cookie
    setAuthCookie(event, token)

    console.warn('✅ create-session: JWT token created and cookie set successfully')

    return {
      success: true,
      token,
    }
  }
  catch (error: any) {
    console.error('❌ create-session error:', error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create session',
    })
  }
})
