import type { Budget, CreateBudgetInput } from '~/types'
import { useBudgets } from './useBudgets'

export function useBudgetForm() {
  const { createBudget, updateBudget } = useBudgets()
  const toast = useToast()

  // Submit budget (create or update)
  const submitBudget = async (
    data: CreateBudgetInput,
    budgetId?: string,
  ): Promise<{ success: boolean, budget?: Budget, error?: string }> => {
    try {
      let result: Budget | null

      if (budgetId) {
        // Update existing budget
        result = await updateBudget(budgetId, {
          monthlyLimit: data.monthlyLimit,
          month: data.month,
        })
      }
      else {
        // Create new budget
        result = await createBudget(data)
      }

      if (result) {
        // Show success toast
        toast.add({
          title: 'Success',
          description: `Budget ${budgetId ? 'updated' : 'created'} successfully`,
          color: 'success',
        })

        return { success: true, budget: result }
      }
      else {
        // Handle case where API call succeeded but returned null
        const errorMessage = `Failed to ${budgetId ? 'update' : 'create'} budget`

        toast.add({
          title: 'Error',
          description: errorMessage,
          color: 'error',
        })

        return { success: false, error: errorMessage }
      }
    }
    catch (error: unknown) {
      console.error('Error saving budget:', error)

      // Extract error message
      const errorMessage = (error as any)?.data?.message
        || (error as any)?.message
        || `Failed to ${budgetId ? 'update' : 'create'} budget`

      // Show error toast
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error',
      })

      return { success: false, error: errorMessage }
    }
  }

  // Validate budget data
  const validateBudgetData = (data: Partial<CreateBudgetInput>): string[] => {
    const errors: string[] = []

    if (!data.category) {
      errors.push('Category is required')
    }

    if (!data.monthlyLimit || data.monthlyLimit <= 0) {
      errors.push('Monthly limit must be positive')
    }

    if (!data.month || !/^\d{4}-\d{2}$/.test(data.month)) {
      errors.push('Month must be in YYYY-MM format')
    }

    return errors
  }

  // Check if budget data is valid
  const isValidBudgetData = (data: Partial<CreateBudgetInput>): boolean => {
    return validateBudgetData(data).length === 0
  }

  return {
    submitBudget,
    validateBudgetData,
    isValidBudgetData,
  }
}
