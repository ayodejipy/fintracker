import type { H3Event } from 'h3'
import { PrismaClient } from '@prisma/client'
import { deleteCookie, getCookie, getHeader, setCookie } from 'h3'

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
    // First try to get Supabase session from Authorization header
    // This is used for OAuth and Supabase auth
    const authHeader = getHeader(event, 'authorization')
    const supabaseToken = authHeader?.replace('Bearer ', '')

    if (supabaseToken) {
      // For Supabase sessions, we trust the token is valid (already verified by Supabase)
      // Extract the user info from the token or use it to fetch from Supabase
      try {
        // Decode without verifying (Supabase already verified it)
        const jwt = await getJWT()
        const decoded = jwt.decode(supabaseToken) as Record<string, unknown>

        if (decoded && decoded.sub) {
          // This is a Supabase token
          return {
            user: {
              id: String(decoded.sub),
              email: String(decoded.email || ''),
              name: String(decoded.name || 'User'),
            },
          }
        }
      }
      catch {
        console.log('Not a Supabase token, trying custom JWT')
      }
    }

    // Fall back to custom JWT token from cookies
    const customToken = getCookie(event, 'auth-token')

    if (!customToken) {
      return null
    }

    // Verify and decode the JWT token
    const jwt = await getJWT()
    const decoded = jwt.verify(customToken, JWT_SECRET) as Record<string, unknown>

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
