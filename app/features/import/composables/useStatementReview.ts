import type { BankStatementParseResult, ParsedTransaction } from '~/types'

/**
 * Composable for managing statement review state and actions
 */
export function useStatementReview() {
  const parseResult = ref<BankStatementParseResult | null>(null)
  const reviewTransactions = ref<ParsedTransaction[]>([])

  /**
   * Initialize review with parse result
   */
  function initializeReview(result: BankStatementParseResult) {
    parseResult.value = result
    reviewTransactions.value = [...result.transactions]
  }

  /**
   * Remove transaction from review list
   */
  function removeTransaction(index: number) {
    reviewTransactions.value.splice(index, 1)
  }

  /**
   * Update transaction category
   */
  function updateTransactionCategory(index: number, category: string) {
    if (reviewTransactions.value[index]) {
      reviewTransactions.value[index].category = category
    }
  }

  /**
   * Update transaction description
   */
  function updateTransactionDescription(index: number, description: string) {
    if (reviewTransactions.value[index]) {
      reviewTransactions.value[index].description = description
    }
  }

  /**
   * Reset review state
   */
  function resetReview() {
    parseResult.value = null
    reviewTransactions.value = []
  }

  /**
   * Check if ready to import
   */
  const canImport = computed(() => {
    return reviewTransactions.value.length > 0
      && reviewTransactions.value.every(t => t.category)
  })

  return {
    // State
    parseResult: readonly(parseResult),
    reviewTransactions,
    canImport,

    // Methods
    initializeReview,
    removeTransaction,
    updateTransactionCategory,
    updateTransactionDescription,
    resetReview,
  }
}
