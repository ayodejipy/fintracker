import type { ApiResponse, CreateSavingsGoalInput, SavingsGoal } from '~/types'
import { computed, readonly } from 'vue'
import { invalidateAfterSavingsChange } from '~/utils/cache-invalidation'

export function useSavingsGoals() {
  // Use useFetch for reactive, cached savings goals list
  const { data: response, pending: loading, error: fetchError, refresh } = useFetch<ApiResponse<SavingsGoal[]>>('/api/savings-goals', {
    key: 'savings-goals-list',
    server: true,
    lazy: false,
    default: () => ({ success: false, data: [], message: 'Loading...' }),
  })

  // Extract savings goals from API response
  const savingsGoals = computed(() => {
    return response.value?.success ? response.value.data : []
  })

  // Extract error message
  const error = computed(() => {
    if (fetchError.value) {
      return fetchError.value.data?.message || 'Failed to fetch savings goals'
    }
    if (response.value && !response.value.success) {
      return response.value.message || 'Failed to fetch savings goals'
    }
    return null
  })

  // Refresh function for manual cache invalidation
  const fetchSavingsGoals = () => {
    return refresh()
  }

  const createSavingsGoal = async (goalData: CreateSavingsGoalInput) => {
    try {
      loading.value = true
      error.value = null

      const response = await $fetch<ApiResponse<SavingsGoal>>('/api/savings-goals', {
        method: 'POST',
        body: goalData,
      })

      if (response.success) {
        // Invalidate related caches
        await invalidateAfterSavingsChange()
        return response.data
      }
      else {
        error.value = response.message || 'Failed to create savings goal'
        throw new Error(error.value)
      }
    }
    catch (err: any) {
      console.error('Error creating savings goal:', err)
      error.value = err.data?.message || 'Failed to create savings goal'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateSavingsGoal = async (id: string, updates: Partial<CreateSavingsGoalInput>) => {
    try {
      loading.value = true
      error.value = null

      const response = await $fetch<ApiResponse<SavingsGoal>>(`/api/savings-goals/${id}`, {
        method: 'PUT',
        body: updates,
      })

      if (response.success) {
        // Invalidate related caches
        await invalidateAfterSavingsChange()
        return response.data
      }
      else {
        error.value = response.message || 'Failed to update savings goal'
        throw new Error(error.value)
      }
    }
    catch (err: any) {
      console.error('Error updating savings goal:', err)
      error.value = err.data?.message || 'Failed to update savings goal'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteSavingsGoal = async (id: string) => {
    try {
      loading.value = true
      error.value = null

      const response = await $fetch<ApiResponse<{ id: string }>>(`/api/savings-goals/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        // Invalidate related caches
        await invalidateAfterSavingsChange()
        return true
      }
      else {
        error.value = response.message || 'Failed to delete savings goal'
        throw new Error(error.value)
      }
    }
    catch (err: any) {
      console.error('Error deleting savings goal:', err)
      error.value = err.data?.message || 'Failed to delete savings goal'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const addContribution = async (goalId: string, amount: number, description?: string) => {
    try {
      loading.value = true
      error.value = null

      const response = await $fetch<ApiResponse<any>>(`/api/savings-goals/${goalId}/contribute`, {
        method: 'POST',
        body: { amount, description },
      })

      if (response.success) {
        const index = savingsGoals.value.findIndex(goal => goal.id === goalId)
        if (index !== -1) {
          savingsGoals.value[index] = response.data.data
        }
        return response
      }
      else {
        error.value = response.message || 'Failed to add contribution'
        throw new Error(error.value)
      }
    }
    catch (err: any) {
      console.error('Error adding contribution:', err)
      error.value = err.data?.message || 'Failed to add contribution'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const getSavingsProjection = async (goalId: string) => {
    try {
      const response = await $fetch<ApiResponse<any>>(`/api/savings-goals/${goalId}/projection`)

      if (response.success) {
        return response.data
      }
      else {
        throw new Error(response.message || 'Failed to get savings projection')
      }
    }
    catch (err: any) {
      console.error('Error getting savings projection:', err)
      throw err
    }
  }

  const getSavingsAnalytics = async () => {
    try {
      const response = await $fetch<ApiResponse<any>>('/api/savings-goals/analytics')

      if (response.success) {
        return response.data
      }
      else {
        throw new Error(response.message || 'Failed to get savings analytics')
      }
    }
    catch (err: unknown) {
      console.error('Error getting savings analytics:', err)
      throw err
    }
  }

  // Computed properties
  const totalTargetAmount = computed(() => {
    return savingsGoals.value.reduce((total, goal) => total + goal.targetAmount, 0)
  })

  const totalCurrentAmount = computed(() => {
    return savingsGoals.value.reduce((total, goal) => total + goal.currentAmount, 0)
  })

  const totalMonthlyContributions = computed(() => {
    return savingsGoals.value.reduce((total, goal) => total + goal.monthlyContribution, 0)
  })

  const activeGoals = computed(() => {
    return savingsGoals.value.filter(goal => goal.currentAmount < goal.targetAmount)
  })

  const completedGoals = computed(() => {
    return savingsGoals.value.filter(goal => goal.currentAmount >= goal.targetAmount)
  })

  const overallProgress = computed(() => {
    if (totalTargetAmount.value === 0) { return 0 }
    return Math.min((totalCurrentAmount.value / totalTargetAmount.value) * 100, 100)
  })

  return {
    // State
    savingsGoals: readonly(savingsGoals),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchSavingsGoals,
    createSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addContribution,
    getSavingsProjection,
    getSavingsAnalytics,

    // Computed
    totalTargetAmount,
    totalCurrentAmount,
    totalMonthlyContributions,
    activeGoals,
    completedGoals,
    overallProgress,
  }
}
