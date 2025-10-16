import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Delete a custom category (soft delete by setting isActive to false)
 * DELETE /api/categories/:id
 */
export default defineEventHandler(async (event): Promise<{ success: boolean, message: string }> => {
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

    // Check if category exists and belongs to user
    const existing = await prisma.customCategory.findUnique({
      where: { id },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Category not found',
      })
    }

    if (existing.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this category',
      })
    }

    // Soft delete the category
    await prisma.customCategory.update({
      where: { id },
      data: { isActive: false },
    })

    return {
      success: true,
      message: 'Category deleted successfully',
    }
  }
  catch (error: any) {
    if (error.statusCode) {
      throw error
    }

    console.error('Error deleting custom category:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete custom category',
    })
  }
})
