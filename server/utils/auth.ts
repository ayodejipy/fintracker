import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { PrismaClient } from '@prisma/client'
import { deleteCookie, getCookie, setCookie } from 'h3'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const prisma = new PrismaClient()

// Dynamic import for jsonwebtoken to avoid CommonJS issues
async function getJWT() {
  const jwt = await import('jsonwebtoken')
  return jwt.default || jwt
}

export interface UserSession {
  user: {
    id: string
    email: string
    name: string
  }
}

export async function getUserSession(event: H3Event): Promise<UserSession | null> {
  try {
    // First try to get Supabase user (handles OAuth tokens from Supabase)
    try {
      console.warn('🔐 Attempting Supabase auth...')
      const supabaseUser = await serverSupabaseUser(event)
      console.warn('🔐 Supabase user exists:', !!supabaseUser)
      console.warn('🔐 Supabase user type:', typeof supabaseUser)
      console.warn('🔐 Supabase user object:', supabaseUser)
      if (supabaseUser) {
        console.warn('🔐 Supabase user keys:', Object.keys(supabaseUser))
        console.warn('🔐 Supabase user.id:', (supabaseUser as any)?.id)
        console.warn('🔐 Supabase user.sub:', (supabaseUser as any)?.sub)
        console.warn('🔐 Supabase user.email:', (supabaseUser as any)?.email)
        console.warn('🔐 Supabase user.user_id:', (supabaseUser as any)?.user_id)
      }

      // Try to get user ID from different possible fields
      const userId = supabaseUser?.id || (supabaseUser as Record<string, unknown>)?.sub || (supabaseUser as Record<string, unknown>)?.user_id
      const userEmail = supabaseUser?.email || (supabaseUser as Record<string, unknown>)?.email

      console.warn('🔐 Extracted userId:', userId, 'email:', userEmail)

      if (userId && userEmail) {
        // Get user from database to ensure they exist
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, email: true, name: true },
        })

        if (dbUser) {
          console.warn('✅ Supabase user authenticated:', { id: dbUser.id, email: dbUser.email })
          return {
            user: {
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name || 'User',
            },
          }
        }
        console.warn('⚠️ Supabase user found but not in database:', userId)
      }
      else {
        console.warn('⚠️ No Supabase user found in token - missing userId or email')
      }
    }
    catch (error) {
      // Supabase auth failed, fall back to custom JWT
      console.error('❌ Supabase auth failed:', error instanceof Error ? error.message : String(error))
    }

    // Fall back to custom JWT token from cookies
    const customToken = getCookie(event, 'auth-token')
    console.warn('🔐 Checking JWT cookie - customToken exists:', !!customToken)

    if (!customToken) {
      console.warn('⚠️ No JWT cookie found')
      return null
    }

    // Verify and decode the JWT token
    console.warn('🔐 Verifying JWT token...')
    const jwt = await getJWT()
    const decoded = jwt.verify(customToken, JWT_SECRET) as Record<string, unknown>
    console.warn('✅ JWT token verified successfully')

    const decodedUser = decoded?.user as { id?: string; email?: string; name?: string } | undefined

    if (!decodedUser || !decodedUser.id) {
      return null
    }

    // Verify user still exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: decodedUser.id },
      select: { id: true },
    })

    if (!userExists) {
      // User was deleted from database, clear their session
      clearAuthCookie(event)
      return null
    }

    return {
      user: {
        id: decodedUser.id,
        email: decodedUser.email || '',
        name: decodedUser.name || 'User',
      },
    }
  }
  catch (error) {
    console.error('Error getting user session:', error)
    return null
  }
}

export async function createUserSession(user: { id: string, email: string, name: string }): Promise<string> {
  const jwt = await getJWT()
  return jwt.sign(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    },
    JWT_SECRET,
    { expiresIn: '7d' },
  )
}

export function setAuthCookie(event: H3Event, token: string) {
  setCookie(event, 'auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, 'auth-token')
}
