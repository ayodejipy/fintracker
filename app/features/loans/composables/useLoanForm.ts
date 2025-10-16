import type { CreateLoanInput, LoanForm } from '~/types'
import { readonly, ref } from 'vue'
import { useLoans } from './useLoans'

export function useLoanForm() {
  const { createLoan, updateLoan } = useLoans()

  const form = ref<LoanForm>({
    name: '',
    initialAmount: 0,
    monthlyPayment: 0,
    interestRate: 0,
    startDate: new Date().toISOString().split('T')[0],
  })

  const errors = ref<Record<string, string>>({})
  const isSubmitting = ref(false)

  const validateForm = (): boolean => {
    errors.value = {}

    if (!form.value.name.trim()) {
      errors.value.name = 'Loan name is required'
    }

    if (form.value.initialAmount <= 0) {
      errors.value.initialAmount = 'Initial amount must be greater than 0'
    }

    if (form.value.monthlyPayment <= 0) {
      errors.value.monthlyPayment = 'Monthly payment must be greater than 0'
    }

    if (form.value.interestRate < 0 || form.value.interestRate > 100) {
      errors.value.interestRate = 'Interest rate must be between 0 and 100'
    }

    if (!form.value.startDate) {
      errors.value.startDate = 'Start date is required'
    }

    // Validate that monthly payment is reasonable compared to initial amount
    if (form.value.monthlyPayment > form.value.initialAmount) {
      errors.value.monthlyPayment = 'Monthly payment cannot be greater than initial amount'
    }

    return Object.keys(errors.value).length === 0
  }

  const resetForm = () => {
    form.value = {
      name: '',
      initialAmount: 0,
      monthlyPayment: 0,
      interestRate: 0,
      startDate: new Date().toISOString().split('T')[0],
    }
    errors.value = {}
  }

  const submitForm = async (): Promise<boolean> => {
    if (!validateForm()) {
      return false
    }

    try {
      isSubmitting.value = true

      const loanData: CreateLoanInput = {
        name: form.value.name.trim(),
        initialAmount: form.value.initialAmount,
        monthlyPayment: form.value.monthlyPayment,
        interestRate: form.value.interestRate,
        startDate: new Date(form.value.startDate),
      }

      await createLoan(loanData)
      resetForm()
      return true
    }
    catch (error: any) {
      console.error('Error submitting loan form:', error)
      errors.value.general = error.message || 'Failed to create loan'
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  const updateLoanForm = async (loanId: string): Promise<boolean> => {
    if (!validateForm()) {
      return false
    }

    try {
      isSubmitting.value = true

      const updates: Partial<CreateLoanInput> = {
        name: form.value.name.trim(),
        monthlyPayment: form.value.monthlyPayment,
        interestRate: form.value.interestRate,
      }

      await updateLoan(loanId, updates)
      return true
    }
    catch (error: any) {
      console.error('Error updating loan:', error)
      errors.value.general = error.message || 'Failed to update loan'
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  const populateForm = (loan: any) => {
    form.value = {
      name: loan.name,
      initialAmount: loan.initialAmount,
      monthlyPayment: loan.monthlyPayment,
      interestRate: loan.interestRate,
      startDate: new Date(loan.startDate).toISOString().split('T')[0],
    }
    errors.value = {}
  }

  const clearError = (field: string) => {
    if (errors.value[field]) {
      delete errors.value[field]
    }
  }

  return {
    // State
    form,
    errors: readonly(errors),
    isSubmitting: readonly(isSubmitting),

    // Actions
    validateForm,
    submitForm,
    updateLoanForm,
    resetForm,
    populateForm,
    clearError,
  }
}
