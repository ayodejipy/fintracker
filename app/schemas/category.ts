import { z } from 'zod'

// Category type enum
export const categoryTypeEnum = z.enum(['income', 'expense', 'fee'])

// Base category schema
export const categorySchema = z.object({
  name: z.string({
    required_error: 'Category name is required',
  }).min(1, 'Category name is required').max(100, 'Category name must be less than 100 characters'),
  type: categoryTypeEnum,
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  sortOrder: z.number().int().nonnegative().optional(),
})

// Create category schema
export const createCategorySchema = categorySchema

// Update category schema (all fields optional)
export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
})

// Category filter schema
export const categoryFilterSchema = z.object({
  type: categoryTypeEnum.optional(),
  isSystem: z.boolean().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
})

// Type exports
export type CategoryType = z.infer<typeof categoryTypeEnum>
export type CategoryInput = z.infer<typeof categorySchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CategoryFilterInput = z.infer<typeof categoryFilterSchema>
