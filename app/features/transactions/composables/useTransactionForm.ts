import type { CreateTransactionInput, Transaction, UpdateTransactionInput } from '~/types'
import { useTransactions } from './useTransactions'

export function useTransactionForm() {
  const { createTransaction, updateTransaction } = useTransactions()
  const toast = useToast()

  // Submit transaction (create or update)
  const submitTransaction = async (
    data: CreateTransactionInput,
    transactionId?: string,
  ): Promise<{ success: boolean, transaction?: Transaction, error?: string }> => {
    try {
      let result: Transaction | null

      if (transactionId) {
        // Update existing transaction
        const updateData: UpdateTransactionInput = {
          amount: data.amount,
          category: data.category,
          description: data.description,
          date: data.date,
          type: data.type,
        }
        result = await updateTransaction(transactionId, updateData)
      }
      else {
        // Create new transaction
        result = await createTransaction(data)
      }

      if (result) {
        // Show success toast
        toast.add({
          title: 'Success',
          description: `Transaction ${transactionId ? 'updated' : 'added'} successfully`,
          color: 'success',
        })

        return { success: true, transaction: result }
      }
      else {
        // Handle case where API call succeeded but returned null
        const errorMessage = `Failed to ${transactionId ? 'update' : 'add'} transaction`

        toast.add({
          title: 'Error',
          description: errorMessage,
          color: 'error',
        })

        return { success: false, error: errorMessage }
      }
    }
    catch (error: unknown) {
      console.error('Error saving transaction:', error)

      // Extract error message
      const errorMessage = (error as any)?.data?.message
        || (error as any)?.message
        || `Failed to ${transactionId ? 'update' : 'add'} transaction`

      // Show error toast
      toast.add({
        title: 'Error',
        description: errorMessage,
        color: 'error',
      })

      return { success: false, error: errorMessage }
    }
  }

  // Validate transaction data
  const validateTransactionData = (data: Partial<CreateTransactionInput>): string[] => {
    const errors: string[] = []

    if (!data.type) {
      errors.push('Transaction type is required')
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be positive')
    }

    if (!data.category) {
      errors.push('Category is required')
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required')
    }

    if (data.description && data.description.length > 255) {
      errors.push('Description too long')
    }

    if (!data.date) {
      errors.push('Date is required')
    }

    return errors
  }

  // Check if transaction data is valid
  const isValidTransactionData = (data: Partial<CreateTransactionInput>): boolean => {
    return validateTransactionData(data).length === 0
  }

  return {
    submitTransaction,
    validateTransactionData,
    isValidTransactionData,
  }
}
