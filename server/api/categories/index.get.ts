import type { CustomCategory } from '~/types'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get all custom categories for a user
 * GET /api/categories
 */
export default defineEventHandler(async (event): Promise<{ success: boolean, data: CustomCategory[] }> => {
  try {
    // Get user session
    const session = await getUserSession(event)
    const userId = session?.user.id

    // Fetch all custom categories for the user
    const categories = await prisma.customCategory.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })

    // Transform Decimal to number
    const transformedCategories: CustomCategory[] = categories.map(cat => ({
      id: cat.id,
      userId: cat.userId,
      name: cat.name,
      type: cat.type as 'income' | 'expense',
      icon: cat.icon || undefined,
      color: cat.color || undefined,
      description: cat.description || undefined,
      isActive: cat.isActive,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }))

    return {
      success: true,
      data: transformedCategories,
    }
  }
  catch (error) {
    console.error('Error fetching custom categories:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch custom categories',
    })
  }
})
