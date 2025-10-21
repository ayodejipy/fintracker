import type { CreateCustomCategoryInput, CustomCategory } from '~/types'

/**
 * Composable for managing custom categories
 */
export function useCustomCategories() {
  const categories = ref<CustomCategory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all custom categories
   * @param type - Optional filter by type (income, expense, fee)
   */
  async function fetchCategories(type?: 'income' | 'expense' | 'fee') {
    loading.value = true
    error.value = null

    try {
      const queryParams = type ? `?type=${type}` : ''
      const response = await $fetch<{ success: boolean, data: CustomCategory[] }>(`/api/categories${queryParams}`)

      if (response.success) {
        categories.value = response.data
      }
    }
    catch (err: any) {
      console.error('Error fetching categories:', err)
      error.value = err.data?.message || 'Failed to fetch categories'
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Create a new custom category
   */
  async function createCategory(input: CreateCustomCategoryInput): Promise<{ success: boolean, category?: CustomCategory, error?: string }> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, data: CustomCategory }>('/api/categories', {
        method: 'POST',
        body: input,
      })

      if (response.success) {
        categories.value.push(response.data)
        return { success: true, category: response.data }
      }

      return { success: false, error: 'Failed to create category' }
    }
    catch (err: any) {
      console.error('Error creating category:', err)
      const errorMessage = err.data?.message || 'Failed to create category'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Update a custom category
   */
  async function updateCategory(id: string, input: Partial<CreateCustomCategoryInput>): Promise<{ success: boolean, category?: CustomCategory, error?: string }> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, data: CustomCategory }>(`/api/categories/${id}`, {
        method: 'PATCH',
        body: input,
      })

      if (response.success) {
        const index = categories.value.findIndex(c => c.id === id)
        if (index !== -1) {
          categories.value[index] = response.data
        }
        return { success: true, category: response.data }
      }

      return { success: false, error: 'Failed to update category' }
    }
    catch (err: any) {
      console.error('Error updating category:', err)
      const errorMessage = err.data?.message || 'Failed to update category'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Delete a custom category (soft delete)
   */
  async function deleteCategory(id: string): Promise<{ success: boolean, error?: string }> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, message: string }>(`/api/categories/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        categories.value = categories.value.filter(c => c.id !== id)
        return { success: true }
      }

      return { success: false, error: 'Failed to delete category' }
    }
    catch (err: any) {
      console.error('Error deleting category:', err)
      const errorMessage = err.data?.message || 'Failed to delete category'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Get categories by type
   */
  function getCategoriesByType(type: 'income' | 'expense' | 'fee'): CustomCategory[] {
    return categories.value.filter(c => c.type === type)
  }

  /**
   * Get system categories (non-editable defaults)
   */
  function getSystemCategories(): CustomCategory[] {
    return categories.value.filter(c => c.isSystem)
  }

  /**
   * Get user custom categories (user-created)
   */
  function getUserCategories(): CustomCategory[] {
    return categories.value.filter(c => !c.isSystem)
  }

  /**
   * Get all category names for a type (for display in selects)
   */
  function getCategoryOptions(type: 'income' | 'expense' | 'fee') {
    const customCategories = getCategoriesByType(type)

    return customCategories.map(c => ({
      label: c.icon ? `${c.icon} ${c.name}` : c.name,
      value: c.value, // ✅ Use actual DB value instead of generating it
      icon: c.icon,
      color: c.color,
      isSystem: c.isSystem,
    }))
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
    getSystemCategories,
    getUserCategories,
    getCategoryOptions,
  }
}
