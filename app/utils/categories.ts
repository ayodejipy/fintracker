import type { ExpenseCategory, NigerianExpenseCategories } from '../types'

/**
 * Nigerian-specific expense category labels
 */
export const NIGERIAN_EXPENSE_CATEGORIES: NigerianExpenseCategories = {
  loan_repayment: '💳 Loan Repayment',
  home_allowance: '🏠 Home Allowance',
  rent: '🏘️ Rent',
  transport: '🚗 Transport',
  food: '🛒 Food & Groceries',
  data_airtime: '📱 Data & Airtime',
  miscellaneous: '📦 Miscellaneous',
  savings: '💰 Savings',
}

/**
 * Get display name for expense category
 */
export function getCategoryDisplayName(category: ExpenseCategory): string {
  return NIGERIAN_EXPENSE_CATEGORIES[category] || category
}

/**
 * Get all expense categories as options for forms
 */
export function getCategoryOptions() {
  return Object.entries(NIGERIAN_EXPENSE_CATEGORIES).map(([value, label]) => ({
    value: value as ExpenseCategory,
    label,
  }))
}

/**
 * Get category color for charts and UI
 */
export function getCategoryColor(category: ExpenseCategory): string {
  const colors: Record<ExpenseCategory, string> = {
    loan_repayment: '#ef4444', // red
    home_allowance: '#f59e0b', // amber
    rent: '#8b5cf6', // violet
    transport: '#06b6d4', // cyan
    food: '#10b981', // emerald
    data_airtime: '#3b82f6', // blue
    miscellaneous: '#6b7280', // gray
    savings: '#22c55e', // green
  }

  return colors[category] || '#6b7280'
}
