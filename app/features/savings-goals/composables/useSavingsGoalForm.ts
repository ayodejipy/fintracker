import type { CreateSavingsGoalInput, SavingsGoalForm } from '~/types'
import { readonly, ref } from 'vue'
import { useSavingsGoals } from './useSavingsGoals'

export function useSavingsGoalForm() {
  const { createSavingsGoal, updateSavingsGoal } = useSavingsGoals()

  const form = ref<SavingsGoalForm>({
    name: '',
    targetAmount: 0,
    targetDate: '',
    monthlyContribution: 0,
  })

  const errors = ref<Record<string, string>>({})
  const isSubmitting = ref(false)

  const validateForm = (): boolean => {
    errors.value = {}

    if (!form.value.name.trim()) {
      errors.value.name = 'Goal name is required'
    }

    if (form.value.targetAmount <= 0) {
      errors.value.targetAmount = 'Target amount must be greater than 0'
    }

    if (form.value.monthlyContribution <= 0) {
      errors.value.monthlyContribution = 'Monthly contribution must be greater than 0'
    }

    if (!form.value.targetDate) {
      errors.value.targetDate = 'Target date is required'
    }
    else {
      const targetDate = new Date(form.value.targetDate)
      const today = new Date()
      if (targetDate <= today) {
        errors.value.targetDate = 'Target date must be in the future'
      }
    }

    // Validate that monthly contribution is reasonable for the target
    if (form.value.monthlyContribution > form.value.targetAmount) {
      errors.value.monthlyContribution = 'Monthly contribution cannot be greater than target amount'
    }

    return Object.keys(errors.value).length === 0
  }

  const resetForm = () => {
    form.value = {
      name: '',
      targetAmount: 0,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      monthlyContribution: 0,
    }
    errors.value = {}
  }

  const submitForm = async (): Promise<boolean> => {
    if (!validateForm()) {
      return false
    }

    try {
      isSubmitting.value = true

      const goalData: CreateSavingsGoalInput = {
        name: form.value.name.trim(),
        targetAmount: form.value.targetAmount,
        targetDate: new Date(form.value.targetDate),
        monthlyContribution: form.value.monthlyContribution,
      }

      await createSavingsGoal(goalData)
      resetForm()
      return true
    }
    catch (error: any) {
      console.error('Error submitting savings goal form:', error)
      errors.value.general = error.message || 'Failed to create savings goal'
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  const updateGoalForm = async (goalId: string): Promise<boolean> => {
    if (!validateForm()) {
      return false
    }

    try {
      isSubmitting.value = true

      const updates: Partial<CreateSavingsGoalInput> = {
        name: form.value.name.trim(),
        targetAmount: form.value.targetAmount,
        targetDate: new Date(form.value.targetDate),
        monthlyContribution: form.value.monthlyContribution,
      }

      await updateSavingsGoal(goalId, updates)
      return true
    }
    catch (error: any) {
      console.error('Error updating savings goal:', error)
      errors.value.general = error.message || 'Failed to update savings goal'
      return false
    }
    finally {
      isSubmitting.value = false
    }
  }

  const populateForm = (goal: any) => {
    form.value = {
      name: goal.name,
      targetAmount: goal.targetAmount,
      targetDate: new Date(goal.targetDate).toISOString().split('T')[0],
      monthlyContribution: goal.monthlyContribution,
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
    updateGoalForm,
    resetForm,
    populateForm,
    clearError,
  }
}
