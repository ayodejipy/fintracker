import type { ParsedTransaction, TransactionFlag } from '../../app/types'

/**
 * Validates parsed transactions and detects edge cases
 * Returns the transaction with flags and confidence levels
 */

const GENERIC_PATTERNS = [
  'transfer',
  'payment',
  'debit',
  'credit',
  'withdrawal',
  'deposit',
  'transaction',
  'pos',
  'atm',
  'web',
  'mobile',
  'online',
  'bank',
]

export function validateTransaction(transaction: ParsedTransaction): ParsedTransaction {
  const flags: TransactionFlag[] = []
  let confidence: 'high' | 'medium' | 'low' | 'manual' = 'high'
  let needsReview = false

  const desc = transaction.description?.trim().toLowerCase() || ''

  // Edge Case 1: Empty or missing description
  if (!desc || desc.length === 0) {
    flags.push('NO_DESCRIPTION')
    confidence = 'manual'
    needsReview = true
  }
  // Edge Case 2: Generic/unhelpful descriptions
  else if (GENERIC_PATTERNS.includes(desc)) {
    flags.push('GENERIC_DESCRIPTION')
    confidence = 'low'
    needsReview = true
  }
  // Edge Case 3: Only numbers or codes (reference numbers)
  else if (/^[\d\s\-/]+$/.test(desc)) {
    flags.push('ONLY_NUMBERS')
    confidence = 'manual'
    needsReview = true
  }
  // Edge Case 4: Very short description (less than 3 characters)
  else if (desc.length < 3) {
    flags.push('GENERIC_DESCRIPTION')
    confidence = 'low'
    needsReview = true
  }

  // Edge Case 5: Unusual amounts
  const amount = Math.abs(transaction.amount)
  if (amount > 1000000) {
    // > 1M NGN
    flags.push('UNUSUAL_AMOUNT')
    needsReview = true
    if (confidence === 'high') { confidence = 'medium' }
  }
  else if (amount < 10) {
    // < 10 NGN
    flags.push('UNUSUAL_AMOUNT')
    needsReview = true
    if (confidence === 'high') { confidence = 'medium' }
  }

  // If no category was assigned, flag for review
  if (!transaction.category) {
    needsReview = true
    if (confidence === 'high') { confidence = 'low' }
  }

  return {
    ...transaction,
    flags: flags.length > 0 ? flags : undefined,
    confidence,
    needsReview,
    originalDesc: transaction.description,
  }
}

/**
 * Batch validate multiple transactions
 */
export function validateTransactions(transactions: ParsedTransaction[]): ParsedTransaction[] {
  const validated = transactions.map(t => validateTransaction(t))

  // Check for potential duplicates
  const duplicateMap = new Map<string, number[]>()

  validated.forEach((transaction, index) => {
    const key = `${transaction.date}-${Math.abs(transaction.amount)}`
    const existing = duplicateMap.get(key) || []
    existing.push(index)
    duplicateMap.set(key, existing)
  })

  // Flag duplicates
  duplicateMap.forEach((indices) => {
    if (indices.length > 1) {
      indices.forEach((index) => {
        const transaction = validated[index]
        const flags = transaction.flags || []
        if (!flags.includes('DUPLICATE_SUSPECTED')) {
          flags.push('DUPLICATE_SUSPECTED')
          validated[index] = {
            ...transaction,
            flags,
            needsReview: true,
          }
        }
      })
    }
  })

  return validated
}

/**
 * Get human-readable flag descriptions
 */
export function getFlagDescription(flag: TransactionFlag): string {
  const descriptions: Record<TransactionFlag, string> = {
    NO_DESCRIPTION: 'Missing description',
    GENERIC_DESCRIPTION: 'Description is too generic',
    ONLY_NUMBERS: 'Only reference numbers',
    AMBIGUOUS: 'Could match multiple categories',
    UNUSUAL_AMOUNT: 'Unusually large or small amount',
    DUPLICATE_SUSPECTED: 'Possible duplicate transaction',
  }

  return descriptions[flag] || 'Unknown flag'
}

/**
 * Get validation summary statistics
 */
export function getValidationSummary(transactions: ParsedTransaction[]) {
  const total = transactions.length
  const needsReview = transactions.filter(t => t.needsReview).length
  const autoCategorized = transactions.filter(t => t.category && !t.needsReview).length
  const flagged = transactions.filter(t => t.flags && t.flags.length > 0).length

  const confidenceCounts = {
    high: transactions.filter(t => t.confidence === 'high').length,
    medium: transactions.filter(t => t.confidence === 'medium').length,
    low: transactions.filter(t => t.confidence === 'low').length,
    manual: transactions.filter(t => t.confidence === 'manual').length,
  }

  return {
    total,
    needsReview,
    autoCategorized,
    flagged,
    confidenceCounts,
  }
}
