import type {
  Budget,
  BudgetAnalysisResponse,
  BudgetApiResponse,
  BudgetListResponse,
  CreateBudgetInput,
} from '~/types'

interface BudgetFilters {
  month?: string
  category?: string
}

export function useBudgets(filters: BudgetFilters = {}) {
  // Build query params and cache key based on filters
  const query: Record<string, any> = {}
  if (filters.month) { query.month = filters.month }
  if (filters.category) { query.category = filters.category }

  const cacheKey = `budgets-list${filters.month ? `-${filters.month}` : ''}${filters.category ? `-${filters.category}` : ''}`

  // Use useFetch for reactive, cached budgets list
  const { data: response, pending: loading, error: fetchError, refresh } = useFetch<BudgetListResponse>('/api/budgets', {
    key: cacheKey,
    query,
    server: true,
    lazy: false,
    default: () => ({ data: [], success: false, message: 'Loading...' }),
  })

  // Extract budgets from API response
  const budgets = computed(() => {
    return response.value?.success ? response.value.data : []
  })

  // Extract error message
  const error = computed(() => {
    if (fetchError.value) {
      return fetchError.value.data?.message || 'Failed to fetch budgets'
    }
    if (response.value && !response.value.success) {
      return response.value.message || 'Failed to fetch budgets'
    }
    return null
  })

  // Fetch budgets with filters (for backward compatibility)
  const fetchBudgets = async (_newFilters: BudgetFilters = {}): Promise<Budget[] | null> => {
    // If filters are different, we need to use a different composable instance
    // For now, just refresh current data
    await refresh()
    return budgets.value
  }

  // Fetch single budget
  const fetchBudget = async (id: string): Promise<Budget | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch(`/api/budgets/${id}`) as BudgetApiResponse
      return response.data
    }
    catch (err: unknown) {
      const errorMessage = (err as any)?.data?.message || 'Failed to fetch budget'
      error.value = errorMessage
      console.error('Error fetching budget:', err)
      return null
    }
    finally {
      loading.value = false
    }
  }

  // Create budget
  const createBudget = async (data: CreateBudgetInput): Promise<Budget | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch('/api/budgets', {
        method: 'POST',
        body: data,
      }) as BudgetApiResponse
      return response.data
    }
    catch (err: unknown) {
      const errorMessage = (err as any)?.data?.message || 'Failed to create budget'
      error.value = errorMessage
      console.error('Error creating budget:', err)
      return null
    }
    finally {
      loading.value = false
    }
  }

  // Update budget
  const updateBudget = async (id: string, data: Partial<CreateBudgetInput>): Promise<Budget | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch(`/api/budgets/${id}`, {
        method: 'PUT',
        body: data,
      }) as BudgetApiResponse
      return response.data
    }
    catch (err: unknown) {
      const errorMessage = (err as any)?.data?.message || 'Failed to update budget'
      error.value = errorMessage
      console.error('Error updating budget:', err)
      return null
    }
    finally {
      loading.value = false
    }
  }

  // Delete budget
  const deleteBudget = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      await $fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
      })
      return true
    }
    catch (err: unknown) {
      const errorMessage = (err as any)?.data?.message || 'Failed to delete budget'
      error.value = errorMessage
      console.error('Error deleting budget:', err)
      return false
    }
    finally {
      loading.value = false
    }
  }

  // Fetch budget analysis
  const fetchAnalysis = async (month?: string): Promise<BudgetAnalysisResponse['data'] | null> => {
    loading.value = true
    error.value = null

    try {
      const query: Record<string, any> = {}
      if (month) { query.month = month }

      const response = await $fetch('/api/budgets/analysis', { query }) as BudgetAnalysisResponse
      return response.data
    }
    catch (err: unknown) {
      const errorMessage = (err as any)?.data?.message || 'Failed to fetch budget analysis'
      error.value = errorMessage
      console.error('Error fetching analysis:', err)
      return null
    }
    finally {
      loading.value = false
    }
  }

  // Sync budgets with transactions
  const syncBudgets = async (month?: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const body: Record<string, unknown> = {}
      if (month) { body.month = month }

      await $fetch('/api/budgets/sync', {
        method: 'POST',
        body,
      })
      return true
    }
    catch (err: unknown) {
      const errorMessage = (err as unknown)?.data?.message || 'Failed to sync budgets'
      error.value = errorMessage
      console.error('Error syncing budgets:', err)
      return false
    }
    finally {
      loading.value = false
    }
  }

  // Calculate budget metrics
  const calculateMetrics = (budgets: Budget[]) => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0)
    const totalSpent = budgets.reduce((sum, b) => sum + b.currentSpent, 0)
    const totalRemaining = totalBudget - totalSpent
    const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      utilizationRate,
    }
  }

  // Get budget status
  const getBudgetStatus = (budget: Budget): 'under_budget' | 'near_limit' | 'over_budget' => {
    const utilizationRate = budget.monthlyLimit > 0 ? (budget.currentSpent / budget.monthlyLimit) * 100 : 0

    if (budget.currentSpent > budget.monthlyLimit) {
      return 'over_budget'
    }
    else if (utilizationRate >= 80) {
      return 'near_limit'
    }
    else {
      return 'under_budget'
    }
  }

  // Generate budget alerts
  const generateAlerts = (budgets: Budget[]) => {
    const alerts: Array<{
      type: 'warning' | 'danger'
      budget: Budget
      message: string
      amount: number
    }> = []

    budgets.forEach((budget) => {
      const status = getBudgetStatus(budget)
      const remaining = budget.monthlyLimit - budget.currentSpent

      if (status === 'over_budget') {
        alerts.push({
          type: 'danger',
          budget,
          message: `You've exceeded your ${budget.category} budget by ₦${Math.abs(remaining).toLocaleString()}`,
          amount: Math.abs(remaining),
        })
      }
      else if (status === 'near_limit') {
        const utilizationRate = (budget.currentSpent / budget.monthlyLimit) * 100
        alerts.push({
          type: 'warning',
          budget,
          message: `You're approaching your ${budget.category} budget limit (${utilizationRate.toFixed(1)}% used)`,
          amount: remaining,
        })
      }
    })

    return alerts.sort((a, b) => {
      // Sort by severity (danger first) then by amount
      if (a.type !== b.type) {
        return a.type === 'danger' ? -1 : 1
      }
      return b.amount - a.amount
    })
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    fetchBudgets,
    fetchBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    fetchAnalysis,
    syncBudgets,
    calculateMetrics,
    getBudgetStatus,
    generateAlerts,
  }
}
