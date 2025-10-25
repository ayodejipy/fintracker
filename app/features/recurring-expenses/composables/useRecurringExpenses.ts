import type {
  CreateRecurringExpenseInput,
  RecurringExpense,
  RecurringExpenseSummary,
  UpdateRecurringExpenseInput,
} from '~/types'

export function useRecurringExpenses() {
  const recurringExpenses = ref<RecurringExpense[]>([])
  const loading = ref(false)
  const error = ref<string>('')

  // Fetch all recurring expenses
  async function fetchRecurringExpenses() {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch('/api/recurring-expenses')
      if (response.success) {
        recurringExpenses.value = response.data
      }
    }
    catch (err: any) {
      console.error('Error fetching recurring expenses:', err)
      error.value = err.data?.message || 'Failed to fetch recurring expenses'
    }
    finally {
      loading.value = false
    }
  }

  // Create new recurring expense
  async function createRecurringExpense(data: CreateRecurringExpenseInput) {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch('/api/recurring-expenses', {
        method: 'POST',
        body: data,
      })

      if (response.success) {
        recurringExpenses.value.push(response.data)
        return response.data
      }
    }
    catch (err: any) {
      console.error('Error creating recurring expense:', err)
      error.value = err.data?.message || 'Failed to create recurring expense'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  // Update recurring expense
  async function updateRecurringExpense(id: string, data: UpdateRecurringExpenseInput) {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch(`/api/recurring-expenses/${id}`, {
        method: 'PUT',
        body: data,
      })

      if (response.success) {
        const index = recurringExpenses.value.findIndex(expense => expense.id === id)
        if (index !== -1) {
          recurringExpenses.value[index] = response.data
        }
        return response.data
      }
    }
    catch (err: any) {
      console.error('Error updating recurring expense:', err)
      error.value = err.data?.message || 'Failed to update recurring expense'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  // Delete recurring expense
  async function deleteRecurringExpense(id: string) {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch(`/api/recurring-expenses/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        recurringExpenses.value = recurringExpenses.value.filter(expense => expense.id !== id)
        return true
      }
    }
    catch (err: any) {
      console.error('Error deleting recurring expense:', err)
      error.value = err.data?.message || 'Failed to delete recurring expense'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  // Toggle active status
  async function toggleRecurringExpense(id: string, isActive: boolean) {
    return updateRecurringExpense(id, { isActive })
  }

  // Mark as paid (update last paid date and calculate next due date)
  async function markAsPaid(id: string) {
    const expense = recurringExpenses.value.find(e => e.id === id)
    if (!expense) { return }

    const today = new Date()
    let nextDueDate = new Date(expense.nextDueDate)

    // Calculate next due date based on frequency
    switch (expense.frequency) {
      case 'weekly':
        nextDueDate.setDate(nextDueDate.getDate() + 7)
        break
      case 'monthly':
        nextDueDate.setMonth(nextDueDate.getMonth() + 1)
        break
      case 'yearly':
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
        break
    }

    return updateRecurringExpense(id, {
      lastPaidDate: today,
      nextDueDate,
    })
  }

  // Get summary data
  async function fetchRecurringExpensesSummary(): Promise<RecurringExpenseSummary | null> {
    try {
      const response = await $fetch('/api/recurring-expenses/summary')
      if (response.success) {
        return response.data
      }
      return null
    }
    catch (err: any) {
      console.error('Error fetching recurring expenses summary:', err)
      return null
    }
  }

  // Computed properties
  const activeExpenses = computed(() =>
    recurringExpenses.value.filter(expense => expense.isActive),
  )

  const upcomingExpenses = computed(() => {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    return activeExpenses.value
      .filter(expense => new Date(expense.nextDueDate) <= thirtyDaysFromNow)
      .map((expense) => {
        const dueDate = new Date(expense.nextDueDate)
        const today = new Date()
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        return {
          ...expense,
          daysUntilDue,
        }
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
  })

  const totalMonthlyCommitments = computed(() => {
    return activeExpenses.value.reduce((sum, expense) => {
      switch (expense.frequency) {
        case 'weekly':
          return sum + (expense.amount * 4.33) // Average weeks per month
        case 'monthly':
          return sum + expense.amount
        case 'yearly':
          return sum + (expense.amount / 12)
        default:
          return sum
      }
    }, 0)
  })

  const overdueExpenses = computed(() => {
    const today = new Date()
    return activeExpenses.value.filter(expense => new Date(expense.nextDueDate) < today)
  })

  return {
    // State
    recurringExpenses: readonly(recurringExpenses),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchRecurringExpenses,
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpense,
    markAsPaid,
    fetchRecurringExpensesSummary,

    // Computed
    activeExpenses,
    upcomingExpenses,
    totalMonthlyCommitments,
    overdueExpenses,
  }
}
