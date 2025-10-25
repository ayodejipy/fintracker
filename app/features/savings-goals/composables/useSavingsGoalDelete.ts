import type { SavingsGoal } from '~/types'

export function useSavingsGoalDelete() {
  const toast = useToast()

  async function deleteSavingsGoal(goal: SavingsGoal, onSuccess?: () => void) {
    const confirmed = await openConfirmation({
      title: 'Delete Savings Goal?',
      message: `Are you sure you want to delete "${goal.name}"? This action cannot be undone and will remove all associated data.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'i-heroicons-trash',
    })

    if (!confirmed) { return false }

    try {
      await $fetch(`/api/savings-goals/${goal.id}`, {
        method: 'DELETE' as const,
      })

      toast.add({
        title: 'Success',
        description: 'Savings goal deleted successfully',
        color: 'success',
      })

      onSuccess?.()
      return true
    }
    catch (error) {
      console.error('Error deleting savings goal:', error)
      toast.add({
        title: 'Error',
        description: 'Failed to delete savings goal',
        color: 'error',
      })
      return false
    }
  }

  return {
    deleteSavingsGoal,
  }
}
