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

    // Get request body
    const body = await readBody<CreateCustomCategoryInput>(event)

    // Validate input
    if (!body.name || !body.type) {
      throw createError({
        statusCode: 400,
        message: 'Name and type are required',
      })
    }

    if (!['income', 'expense'].includes(body.type)) {
      throw createError({
        statusCode: 400,
        message: 'Type must be either "income" or "expense"',
      })
    }

    // Check if category with same name and type already exists
    const existing = await prisma.customCategory.findFirst({
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

    // Create the category
    const category = await prisma.customCategory.create({
      data: {
        userId,
        name: body.name,
        type: body.type,
        icon: body.icon,
        color: body.color,
        description: body.description,
      },
    })

    const transformedCategory: CustomCategory = {
      id: category.id,
      userId: category.userId,
      name: category.name,
      type: category.type as 'income' | 'expense',
      icon: category.icon || undefined,
      color: category.color || undefined,
      description: category.description || undefined,
      isActive: category.isActive,
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
