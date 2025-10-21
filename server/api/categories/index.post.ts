import type { CreateCustomCategoryInput, CustomCategory } from '~/types'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Create a new custom category
 * POST /api/categories
 */
export default defineEventHandler(async (event): Promise<{ success: boolean, data: CustomCategory }> => {
  try {
    // Get user session
    const session = await getUserSession(event)
    const userId = session?.user.id

    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'Authentication required',
      })
    }

    // Get request body
    const body = await readBody<CreateCustomCategoryInput>(event)

    // Validate input
    if (!body.name || !body.type) {
      throw createError({
        statusCode: 400,
        message: 'Name and type are required',
      })
    }

    if (!['income', 'expense', 'fee'].includes(body.type)) {
      throw createError({
        statusCode: 400,
        message: 'Type must be either "income", "expense", or "fee"',
      })
    }

    // Check if category with same name and type already exists for this user
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name: body.name,
        type: body.type,
      },
    })

    if (existing) {
      throw createError({
        statusCode: 409,
        message: `A ${body.type} category with this name already exists`,
      })
    }

    // Generate value from name if not provided
    const value = body.value || body.name
      .replace(/[&,/\s]+/g, '_')
      .replace(/[()]/g, '')
      .toLowerCase()
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')

    // Create the category
    const category = await prisma.category.create({
      data: {
        userId,
        name: body.name,
        value,
        type: body.type,
        icon: body.icon,
        color: body.color,
        description: body.description,
        sortOrder: body.sortOrder ?? 999,
        isSystem: false, // User-created categories are not system categories
        isActive: true,
      },
    })

    const transformedCategory: CustomCategory = {
      id: category.id,
      userId: category.userId,
      name: category.name,
      value: category.value,
      type: category.type as 'income' | 'expense' | 'fee',
      icon: category.icon || undefined,
      color: category.color || undefined,
      description: category.description || undefined,
      isSystem: category.isSystem,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }

    return {
      success: true,
      data: transformedCategory,
    }
  }
  catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error creating custom category:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create custom category',
    })
  }
})
