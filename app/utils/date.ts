// Date utility functions for the personal finance dashboard

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrencySimple(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function getEndOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function getStartOfYear(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), 0, 1)
}

export function getEndOfYear(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), 11, 31)
}

export function isToday(date: Date | string): boolean {
  const d = new Date(date)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

export function isThisMonth(date: Date | string): boolean {
  const d = new Date(date)
  const today = new Date()
  return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
}

export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

/**
 * Format month string (YYYY-MM) to readable format
 */
export function formatMonthLabel(month: string): string {
  const date = new Date(`${month}-01`)
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
  })
}

/**
 * Get previous month in YYYY-MM format
 */
export function getPreviousMonth(month: string): string {
  const date = new Date(`${month}-01`)
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().slice(0, 7)
}

/**
 * Get next month in YYYY-MM format
 */
export function getNextMonth(month: string): string {
  const date = new Date(`${month}-01`)
  date.setMonth(date.getMonth() + 1)
  return date.toISOString().slice(0, 7)
}

/**
 * Check if month is in the future
 */
export function isMonthInFuture(month: string): boolean {
  const monthDate = new Date(`${month}-01`)
  const currentMonth = new Date(`${getCurrentMonth()}-01`)
  return monthDate > currentMonth
}

/**
 * Generate list of months for selection (last N months + current)
 * Includes a disabled "Select month" option as the first item
 */
export function getMonthOptions(numberOfMonths: number = 12): Array<{ label: string, value: string, disabled?: boolean }> {
  const options: Array<{ label: string, value: string, disabled?: boolean }> = []

  // Add disabled "Select month" placeholder as first option
  options.push({ label: 'Select month', value: '', disabled: true })

  const currentDate = new Date()

  for (let i = 0; i < numberOfMonths; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
    const value = date.toISOString().slice(0, 7)
    const label = formatMonthLabel(value)

    options.push({ label, value })
  }

  return options
}
