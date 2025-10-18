import type { ParsedTransaction } from '../../app/types'
import { matchDescriptionToCategory } from './categoryMapper'

/**
 * NEW Dynamic Transaction Categorization
 * Uses database categories instead of hardcoded ones
 */

/**
 * Categorize a single transaction using database categories
 */
export async function categorizeTransaction(transaction: ParsedTransaction): Promise<ParsedTransaction> {
  const description = transaction.description?.toLowerCase().trim() || ''

  // Skip if already has category
  if (transaction.category) {
    return transaction
  }

  // Skip if empty description
  if (!description) {
    return transaction
  }

  // Determine transaction type
  const transactionType = transaction.type === 'credit' ? 'income' : 'expense'

  // Match description to category
  const category = await matchDescriptionToCategory(description, transactionType)

  if (category) {
    return {
      ...transaction,
      category,
    }
  }

  // No match found - return without category
  return transaction
}

/**
 * Categorize multiple transactions
 */
export async function categorizeTransactions(transactions: ParsedTransaction[]): Promise<ParsedTransaction[]> {
  const categorized: ParsedTransaction[] = []

  for (const transaction of transactions) {
    const categorizedTransaction = await categorizeTransaction(transaction)
    categorized.push(categorizedTransaction)
  }

  return categorized
}
