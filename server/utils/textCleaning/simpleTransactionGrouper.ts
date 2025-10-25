/**
 * Simple Transaction Grouper
 *
 * Groups related transaction rows (main transaction + fees/charges)
 * without complex parsing. Just identifies patterns and groups them.
 *
 * The grouped data is then sent to LLM for intelligent categorization.
 */

import { cleanDescription, isFeeTransaction } from './bankFieldMappings'

/**
 * A raw transaction row (parsed from statement)
 */
export interface RawTransactionRow {
  date: string
  valueDate?: string
  description: string
  debit?: string
  credit?: string
  balance: string
  reference?: string
  branch?: string
}

/**
 * A grouped transaction (main + related fees)
 */
export interface GroupedTransaction {
  // Main transaction details
  mainTransaction: RawTransactionRow

  // Related fee transactions (if any)
  fees: RawTransactionRow[]

  // Cleaned description for LLM
  cleanedDescription: string

  // Total debits (main + all fees)
  totalDebit: number

  // Total credits
  totalCredit: number

  // Whether this transaction has associated fees
  hasFees: boolean

  // Index in original array (for reference)
  originalIndex: number
}

/**
 * Grouping options
 */
export interface GroupingOptions {
  // How many rows to look ahead for fees (default: 3)
  lookAheadRows?: number

  // Clean descriptions (default: true)
  cleanDescriptions?: boolean
}

/**
 * Parse amount string to number
 * Handles formats like: "1,000.00", "1000", "₦1,000"
 */
function parseAmount(amountStr: string | undefined): number {
  if (!amountStr) { return 0 }

  // Remove currency symbols, commas, spaces
  const cleaned = amountStr
    .replace(/[₦,\s]/g, '')
    .trim()

  const parsed = Number.parseFloat(cleaned)
  return Number.isNaN(parsed) ? 0 : parsed
}

/**
 * Check if two transaction dates are the same or close enough
 * (fees usually appear on same date or next day)
 */
function isDatesClose(date1: string, date2: string): boolean {
  // Simple check: exact match or within 1 day
  // You can make this more sophisticated if needed
  return date1 === date2
}

/**
 * Group transactions with their related fees
 *
 * Algorithm:
 * 1. Iterate through all transactions
 * 2. For each non-fee transaction, look ahead for related fees
 * 3. Group main transaction + fees together
 * 4. Skip already-grouped fee transactions
 * 5. Return grouped array
 */
export function groupTransactions(
  transactions: RawTransactionRow[],
  options: GroupingOptions = {},
): GroupedTransaction[] {
  const {
    lookAheadRows = 3,
    cleanDescriptions = true,
  } = options

  const grouped: GroupedTransaction[] = []
  const processedIndices = new Set<number>()

  for (let i = 0; i < transactions.length; i++) {
    // Skip if already processed as a fee
    if (processedIndices.has(i)) { continue }

    const current = transactions[i]

    // Check if this is a fee transaction
    // If so, it should have been grouped with previous transaction
    // If we reach here, it's an orphaned fee - treat as standalone
    if (isFeeTransaction(current.description)) {
      // Orphaned fee - add as standalone
      grouped.push({
        mainTransaction: current,
        fees: [],
        cleanedDescription: cleanDescriptions
          ? cleanDescription(current.description)
          : current.description,
        totalDebit: parseAmount(current.debit),
        totalCredit: parseAmount(current.credit),
        hasFees: false,
        originalIndex: i,
      })
      processedIndices.add(i)
      continue
    }

    // This is a main transaction - look ahead for fees
    const relatedFees: RawTransactionRow[] = []
    let feeTotal = 0

    for (let j = i + 1; j < Math.min(i + 1 + lookAheadRows, transactions.length); j++) {
      const next = transactions[j]

      // Check if this is a fee and dates are close
      if (
        isFeeTransaction(next.description)
        && isDatesClose(current.date, next.date)
      ) {
        relatedFees.push(next)
        feeTotal += parseAmount(next.debit)
        processedIndices.add(j)
      }
      else {
        // Stop looking if we hit a non-fee transaction
        break
      }
    }

    // Create grouped transaction
    grouped.push({
      mainTransaction: current,
      fees: relatedFees,
      cleanedDescription: cleanDescriptions
        ? cleanDescription(current.description)
        : current.description,
      totalDebit: parseAmount(current.debit) + feeTotal,
      totalCredit: parseAmount(current.credit),
      hasFees: relatedFees.length > 0,
      originalIndex: i,
    })

    processedIndices.add(i)
  }

  return grouped
}

/**
 * Convert grouped transactions to LLM-friendly format
 * Returns array of objects ready to send to LLM for categorization
 */
export function prepareForLLM(grouped: GroupedTransaction[]) {
  return grouped.map((txn, index) => ({
    id: index + 1,
    date: txn.mainTransaction.date,
    description: txn.cleanedDescription,
    amount: txn.totalDebit > 0 ? txn.totalDebit : txn.totalCredit,
    type: txn.totalDebit > 0 ? 'debit' : 'credit',
    hasFees: txn.hasFees,
    feeBreakdown: txn.fees.map(fee => ({
      description: cleanDescription(fee.description),
      amount: parseAmount(fee.debit),
    })),
    balance: txn.mainTransaction.balance,
    reference: txn.mainTransaction.reference,

    // Include original for debugging
    original: {
      mainDescription: txn.mainTransaction.description,
      feeDescriptions: txn.fees.map(f => f.description),
    },
  }))
}

/**
 * Generate summary statistics for grouped transactions
 */
export function getGroupingStats(grouped: GroupedTransaction[]) {
  const totalTransactions = grouped.length
  const transactionsWithFees = grouped.filter(t => t.hasFees).length
  const totalFees = grouped.reduce((sum, t) => sum + t.fees.length, 0)

  const totalDebits = grouped.reduce((sum, t) => sum + t.totalDebit, 0)
  const totalCredits = grouped.reduce((sum, t) => sum + t.totalCredit, 0)

  return {
    totalTransactions,
    transactionsWithFees,
    totalFees,
    totalDebits,
    totalCredits,
    netAmount: totalCredits - totalDebits,
  }
}
