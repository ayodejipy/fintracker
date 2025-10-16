import type { Transaction } from '~/types'

export function useTransactionDelete() {
  const toast = useToast()

  async function deleteTransaction(transaction: Transaction, onSuccess?: () => void) {
    const confirmed = await openConfirmation({
      title: 'Delete Transaction?',
      message: `Are you sure you want to delete this transaction? ${transaction.description || 'This action cannot be undone.'}`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'i-heroicons-trash',
    })

    if (!confirmed)
      return false

    try {
      await $fetch(`/api/transactions/${transaction.id}`, {
        method: 'DELETE' as const,
      })

      toast.add({
        title: 'Success',
        description: 'Transaction deleted successfully',
        color: 'success',
      })

      onSuccess?.()
      return true
    }
    catch (error) {
      console.error('Error deleting transaction:', error)
      toast.add({
        title: 'Error',
        description: 'Failed to delete transaction',
        color: 'error',
      })
      return false
    }
  }

  return {
    deleteTransaction,
  }
}
