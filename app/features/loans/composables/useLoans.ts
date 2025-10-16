import type { ApiResponse, CreateLoanInput, Loan } from '~/types'
import { computed, readonly } from 'vue'

export function useLoans() {
  // Use useFetch for reactive, cached loans list
  const { data: response, pending: loading, error: fetchError, refresh } = useFetch<ApiResponse<Loan[]>>('/api/loans', {
    key: 'loans-list',
    server: true,
    lazy: false,
    default: () => ({ success: false, data: [], message: 'Loading...' }),
  })

  // Extract loans from API response
  const loans = computed(() => {
    return response.value?.success ? response.value.data : []
  })

  // Extract error message
  const error = computed(() => {
    if (fetchError.value) {
      return fetchError.value.data?.message || 'Failed to fetch loans'
    }
    if (response.value && !response.value.success) {
      return response.value.message || 'Failed to fetch loans'
    }
    return null
  })

  // Refresh function for manual cache invalidation
  const fetchLoans = () => {
    return refresh()
  }

  const createLoan = async (loanData: CreateLoanInput) => {
    try {
      loading.value = true
      error.value = null

      const response = await $fetch<ApiResponse<Loan>>('/api/loans', {
        method: 'POST',
        body: loanData,
      })

      if (response.success) {
        loans.value.unshift(response.data)
        return response.data
      }
      else {
        error.value = response.message || 'Failed to create loan'
        throw new Error(error.value)
      }
    }
    catch (err: any) {
      console.error('Error creating loan:', err)
      error.value = err.data?.message || 'Failed to create loan'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const updateLoan = async (id: string, updates: Partial<CreateLoanInput>) => {
    try {
      loading.value = true
      error.value = null

      const response = await $fetch<ApiResponse<Loan>>(`/api/loans/${id}`, {
        method: 'PUT',
        body: updates,
      })

      if (response.success) {
        const index = loans.value.findIndex(loan => loan.id === id)
        if (index !== -1) {
          loans.value[index] = response.data
        }
        return response.data
      }
      else {
        error.value = response.message || 'Failed to update loan'
        throw new Error(error.value)
      }
    }
    catch (err: any) {
      console.error('Error updating loan:', err)
      error.value = err.data?.message || 'Failed to update loan'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const deleteLoan = async (id: string) => {
    try {
      loading.value = true
      error.value = null

      const response = await $fetch<ApiResponse<{ id: string }>>(`/api/loans/${id}`, {
        method: 'DELETE',
      })

      if (response.success) {
        loans.value = loans.value.filter(loan => loan.id !== id)
        return true
      }
      else {
        error.value = response.message || 'Failed to delete loan'
        throw new Error(error.value)
      }
    }
    catch (err: any) {
      console.error('Error deleting loan:', err)
      error.value = err.data?.message || 'Failed to delete loan'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const recordPayment = async (loanId: string, amount: number) => {
    try {
      loading.value = true
      error.value = null

      const response = await $fetch<ApiResponse<Loan>>(`/api/loans/${loanId}/payment`, {
        method: 'POST',
        body: { amount },
      })

      if (response.success) {
        const index = loans.value.findIndex(loan => loan.id === loanId)
        if (index !== -1) {
          loans.value[index] = response.data
        }
        return response.data
      }
      else {
        error.value = response.message || 'Failed to record payment'
        throw new Error(error.value)
      }
    }
    catch (err: any) {
      console.error('Error recording payment:', err)
      error.value = err.data?.message || 'Failed to record payment'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const getLoanProjection = async (loanId: string) => {
    try {
      const response = await $fetch<ApiResponse<{
        remainingBalance: number
        payoffDate: Date | null
        totalInterestPaid: number
        monthsRemaining: number
        paymentSchedule: Array<{
          month: number
          payment: number
          principal: number
          interest: number
          balance: number
        }>
      }>>(`/api/loans/${loanId}/projection`)

      if (response.success) {
        return response.data
      }
      else {
        throw new Error(response.message || 'Failed to get loan projection')
      }
    }
    catch (err: unknown) {
      console.error('Error getting loan projection:', err)
      throw err
    }
  }

  // Computed properties
  const totalDebt = computed(() => {
    return loans.value.reduce((total, loan) => total + loan.currentBalance, 0)
  })

  const totalMonthlyPayments = computed(() => {
    return loans.value.reduce((total, loan) => total + loan.monthlyPayment, 0)
  })

  const activeLoans = computed(() => {
    return loans.value.filter(loan => loan.currentBalance > 0)
  })

  const paidOffLoans = computed(() => {
    return loans.value.filter(loan => loan.currentBalance <= 0)
  })

  return {
    // State
    loans: readonly(loans),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchLoans,
    createLoan,
    updateLoan,
    deleteLoan,
    recordPayment,
    getLoanProjection,

    // Computed
    totalDebt,
    totalMonthlyPayments,
    activeLoans,
    paidOffLoans,
  }
}
