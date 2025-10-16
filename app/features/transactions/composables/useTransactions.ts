import type {
  CreateTransactionInput,
  PaginatedResponse,
  Transaction,
  TransactionApiResponse,
  TransactionSummaryResponse,
  UpdateTransactionInput,
} from '~/types'

interface TransactionFilters {
  search?: string
  category?: string
  type?: 'income' | 'expense'
  month?: string
  page?: number
  limit?: number
}

interface TransactionSummary {
  totalIncome: number
  totalExpenses: number
  netAmount: number
  categoryBreakdown: Array<{
    category: string
    amount: number
    count: number
  }>
}

export function useTransactions(filters: MaybeRef<TransactionFilters> = {}) {
  // Make filters reactive
  const reactiveFilters = ref(filters)

  // Build query params based on reactive filters
  const query = computed(() => {
    const f = unref(reactiveFilters)
    const q: Record<string, string | number> = {
      page: f.page || 1,
      limit: f.limit || 10,
    }

    if (f.search) { q.search = f.search }
    if (f.category) { q.category = f.category }
    if (f.type) { q.type = f.type }
    if (f.month) { q.month = f.month }

    return q
  })

  // Use useFetch for reactive, cached transactions list
  const { data: response, pending: loading, error: fetchError, refresh } = useFetch<PaginatedResponse<Transaction>>('/api/transactions', {
    query,
    server: true,
    lazy: false,
    watch: [query],
    default: () => ({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    }),
  })

  // Extract transactions from API response
  const transactions = computed(() => {
    return response.value?.data || []
  })

  // Extract pagination info
  const pagination = computed(() => {
    if (!response.value) { return { page: 1, limit: 10, total: 0, totalPages: 0 } }
    return {
      page: response.value.page,
      limit: response.value.limit,
      total: response.value.total,
      totalPages: response.value.totalPages,
    }
  })

  // Extract error message
  const error = computed(() => {
    if (fetchError.value) {
      return fetchError.value.data?.message || 'Failed to fetch transactions'
    }
    return null
  })

  // Fetch transactions with filters (for backward compatibility)
  const fetchTransactions = async (_newFilters: TransactionFilters = {}): Promise<PaginatedResponse<Transaction> | null> => {
    // If filters are different, we need to use a different composable instance
    // For now, just refresh current data
    await refresh()
    return response.value
  }

  // Fetch single transaction
  const fetchTransaction = async (id: string): Promise<Transaction | null> => {
    try {
      const response = await $fetch(`/api/transactions/${id}`) as TransactionApiResponse
      return response.data
    }
    catch (err: unknown) {
      const errorMessage = (err as Record<string, any>)?.data?.message || 'Failed to fetch transaction'
      console.error('Error fetching transaction:', err)
      throw new Error(errorMessage)
    }
  }

  // Create transaction
  const createTransaction = async (data: CreateTransactionInput): Promise<Transaction | null> => {
    try {
      const response = await $fetch('/api/transactions', {
        method: 'POST' as const,
        body: data,
      }) as TransactionApiResponse
      return response.data
    }
    catch (err: unknown) {
      const errorMessage = (err as Record<string, any>)?.data?.message || 'Failed to create transaction'
      console.error('Error creating transaction:', err)
      throw new Error(errorMessage)
    }
  }

  // Update transaction
  const updateTransaction = async (id: string, data: UpdateTransactionInput): Promise<Transaction | null> => {
    try {
      const response = await $fetch(`/api/transactions/${id}`, {
        method: 'PUT' as const,
        body: data,
      }) as TransactionApiResponse
      return response.data
    }
    catch (err: unknown) {
      const errorMessage = (err as Record<string, any>)?.data?.message || 'Failed to update transaction'
      console.error('Error updating transaction:', err)
      throw new Error(errorMessage)
    }
  }

  // Delete transaction
  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      await $fetch(`/api/transactions/${id}`, {
        method: 'DELETE' as const,
      })
      return true
    }
    catch (err: unknown) {
      const errorMessage = (err as Record<string, any>)?.data?.message || 'Failed to delete transaction'
      console.error('Error deleting transaction:', err)
      throw new Error(errorMessage)
    }
  }

  // Fetch transaction summary
  const fetchSummary = async (summaryFilters: { month?: string, year?: string } = {}): Promise<TransactionSummary | null> => {
    try {
      const query: Record<string, string> = {}
      if (summaryFilters.month) { query.month = summaryFilters.month }
      if (summaryFilters.year) { query.year = summaryFilters.year }

      const response = await $fetch('/api/transactions/summary', { query }) as TransactionSummaryResponse
      return response.data
    }
    catch (err: unknown) {
      const errorMessage = (err as Record<string, unknown>)?.data?.message || 'Failed to fetch summary'
      console.error('Error fetching summary:', err)
      throw new Error(errorMessage)
    }
  }

  return {
    transactions,
    pagination,
    loading: readonly(loading),
    error: readonly(error),
    refresh,
    fetchTransactions,
    fetchTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchSummary,
  }
}
