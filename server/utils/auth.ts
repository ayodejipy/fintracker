import type { H3Event } from 'h3'
import { deleteCookie, getCookie, getHeader, setCookie } from 'h3'
import { PrismaClient } from '@prisma/client'

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
    // Get token from Authorization header or cookies
    const authHeader = getHeader(event, 'authorization')
    const token = authHeader?.replace('Bearer ', '') || getCookie(event, 'auth-token')

    if (!token) {
      return null
    }

    // Verify and decode the JWT token
    const jwt = await getJWT()
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (!decoded || !decoded.user) {
      return null
    }

    // Verify user still exists in database
    const userExists = await prisma.user.findUnique({
      where: { id: decoded.user.id },
      select: { id: true },
    })

    if (!userExists) {
      // User was deleted from database, clear their session
      clearAuthCookie(event)
      return null
    }

    return {
      user: {
        id: decoded.user.id,
        email: decoded.user.email,
        name: decoded.user.name,
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
