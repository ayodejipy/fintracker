import type { BulkImportRequest, ParsedTransaction } from '~/types'

/**
 * Composable for importing reviewed transactions
 */
export function useStatementImport() {
  const importing = ref(false)
  const error = ref<string | null>(null)

  /**
   * Import reviewed transactions into database
   */
  async function importTransactions(
    transactions: ParsedTransaction[],
    importSource: string,
  ): Promise<{ success: boolean, error?: string }> {
    if (!transactions || transactions.length === 0) {
      return { success: false, error: 'No transactions to import' }
    }

    importing.value = true
    error.value = null

    try {
      const importRequest: BulkImportRequest = {
        transactions: transactions.map((t: ParsedTransaction) => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          type: t.type === 'debit' ? 'expense' : 'income',
          category: t.category!,
          // Include fee breakdown if available
          vat: t.vat,
          serviceFee: t.serviceFee,
          commission: t.commission,
          stampDuty: t.stampDuty,
          transferFee: t.transferFee,
          processingFee: t.processingFee,
          otherFees: t.otherFees,
          feeNote: t.feeNote,
        })),
        importSource,
      }

      const response = await $fetch('/api/statements/import', {
        method: 'POST',
        body: importRequest,
      })

      if (response.success) {
        // Clear Nuxt data cache to refresh dashboard and transactions
        await clearNuxtData()

        return { success: true }
      }

      return {
        success: false,
        error: response.message || 'Failed to import transactions',
      }
    }
    catch (err: any) {
      console.error('Import error:', err)

      const errorMessage = err.data?.message || err.message || 'Failed to import transactions'
      error.value = errorMessage

      return {
        success: false,
        error: errorMessage,
      }
    }
    finally {
      importing.value = false
    }
  }

  /**
   * Reset import state
   */
  function resetImportState() {
    importing.value = false
    error.value = null
  }

  return {
    // State
    importing: readonly(importing),
    error: readonly(error),

    // Methods
    importTransactions,
    resetImportState,
  }
}
