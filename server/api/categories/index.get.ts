import type { CustomCategory } from '~/types'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get all categories for a user (both system and custom)
 * GET /api/categories?type=income|expense|fee
 */
export default defineEventHandler(async (event): Promise<{ success: boolean, data: CustomCategory[] }> => {
  try {
    // Get user session
    const session = await getUserSession(event)
    const userId = session?.user?.id

    // Get optional type filter from query
    const query = getQuery(event)
    const typeFilter = query.type as string | undefined

    // Build where clause
    const whereClause: any = {
      isActive: true,
      OR: [
        { userId: null, isSystem: true }, // System categories
        ...(userId ? [{ userId, isSystem: false }] : []), // User's custom categories
      ],
    }

    // Add type filter if provided
    if (typeFilter && ['income', 'expense', 'fee'].includes(typeFilter)) {
      whereClause.type = typeFilter
    }

    // Fetch all categories (system + user's custom)
    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: [
        { type: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    // Transform to match CustomCategory type
    const transformedCategories: CustomCategory[] = categories.map(cat => ({
      id: cat.id,
      userId: cat.userId,
      name: cat.name,
      value: cat.value,
      type: cat.type as 'income' | 'expense' | 'fee',
      icon: cat.icon || undefined,
      color: cat.color || undefined,
      description: cat.description || undefined,
      isSystem: cat.isSystem,
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }))

    return {
      success: true,
      data: transformedCategories,
    }
  }
  catch (error) {
    console.error('Error fetching categories:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch categories',
    })
  }
})
