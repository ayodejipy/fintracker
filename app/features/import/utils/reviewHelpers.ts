/**
 * Transaction review utilities for import feature
 */

/**
 * Get confidence level label
 */
export function getConfidenceLabel(confidence: string): string {
  const labels: Record<string, string> = {
    high: 'Verified',
    medium: 'Review',
    low: 'Uncertain',
    manual: 'Needs Review',
  }
  return labels[confidence] || confidence
}

/**
 * Get confidence level color class
 */
export function getConfidenceColorClass(confidence: string): string {
  const classes: Record<string, string> = {
    high: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    low: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    manual: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  }
  return classes[confidence] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
}

/**
 * Get flag label from flag code
 */
export function getFlagLabel(flag: string): string {
  const labels: Record<string, string> = {
    NO_DESCRIPTION: 'No Description',
    GENERIC_DESCRIPTION: 'Generic',
    ONLY_NUMBERS: 'Ref Only',
    AMBIGUOUS: 'Ambiguous',
    UNUSUAL_AMOUNT: 'Unusual Amount',
    DUPLICATE_SUSPECTED: 'Possible Duplicate',
  }
  return labels[flag] || flag
}

/**
 * Get transaction row background class based on status
 */
export function getTransactionRowClass(needsReview: boolean, hasFlags: boolean): string {
  if (hasFlags) {
    return 'bg-red-50 dark:bg-red-900/10'
  }
  if (needsReview) {
    return 'bg-yellow-50 dark:bg-yellow-900/10'
  }
  return ''
}
