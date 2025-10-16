import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const prisma = new PrismaClient()

const currencyUpdateSchema = z.object({
  currency: z.string().min(3).max(3, 'Currency code must be 3 characters'),
  locale: z.string().min(2, 'Locale is required'),
})

export default defineEventHandler(async (event) => {
  try {
    // Check if method is PUT
    if (getMethod(event) !== 'PUT') {
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed',
      })
    }

    // Get and verify JWT token
    const token = getCookie(event, 'auth-token') || getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required',
      })
    }

    let userId: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string }
      userId = decoded.userId
    }
    catch {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token',
      })
    }

    // Parse and validate request body
    const body = await readBody(event)
    const validatedData = currencyUpdateSchema.parse(body)

    // Update user currency
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        currency: validatedData.currency,
      },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        monthlyIncome: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return {
      success: true,
      message: 'Currency preferences updated successfully',
      user: updatedUser,
      preferences: {
        currency: validatedData.currency,
        locale: validatedData.locale,
      },
    }
  }
  catch (error: any) {
    console.error('Currency update error:', error)

    if (error.statusCode) {
      throw error
    }

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: error.errors,
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
  finally {
    await prisma.$disconnect()
  }
})
