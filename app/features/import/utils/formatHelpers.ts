/**
 * Formatting utilities for import feature
 */

/**
 * Format date to readable string
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Format amount to Nigerian currency format
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2 }).format(amount)
}

/**
 * Format currency with symbol
 */
export function formatCurrency(amount: number, showSign: boolean = false, type?: 'debit' | 'credit'): string {
  const formatted = formatAmount(amount)
  const sign = showSign && type ? (type === 'credit' ? '+' : '-') : ''
  return `${sign}₦${formatted}`
}
