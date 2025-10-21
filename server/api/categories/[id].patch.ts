import type { CustomCategory, UpdateCustomCategoryInput } from '~/types'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Update a custom category
 * PATCH /api/categories/:id
 */
export default defineEventHandler(async (event): Promise<{ success: boolean, data: CustomCategory }> => {
  try {
    // Get user session
    const session = await getUserSession(event)
    const userId = session?.user.id

    // Get category ID from route params
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Category ID is required',
      })
    }

    // Get request body
    const body = await readBody<UpdateCustomCategoryInput>(event)

    // Check if category exists and belongs to user
    const existing = await prisma.category.findUnique({
      where: { id },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Category not found',
      })
    }

    // Prevent updating system categories
    if (existing.isSystem) {
      throw createError({
        statusCode: 403,
        message: 'System categories cannot be modified',
      })
    }

    if (existing.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this category',
      })
    }

    // If updating name, check for duplicates
    if (body.name && body.name !== existing.name) {
      const duplicate = await prisma.category.findFirst({
        where: {
          userId,
          name: body.name,
          type: existing.type,
          id: { not: id },
        },
      })

      if (duplicate) {
        throw createError({
          statusCode: 409,
          message: `A ${existing.type} category with this name already exists`,
        })
      }
    }

    // Update the category
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        icon: body.icon,
        color: body.color,
        description: body.description,
        isActive: body.isActive,
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

    console.error('Error updating custom category:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update custom category',
    })
  }
})
