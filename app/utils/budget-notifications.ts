import type { ExpenseCategory } from '~/types'

export interface BudgetAlert {
  id: string
  type: 'warning' | 'danger' | 'info'
  category: ExpenseCategory
  title: string
  message: string
  amount: number
  percentage: number
  timestamp: Date
  isRead: boolean
}

export interface BudgetNotificationConfig {
  warningThreshold: number // Percentage (e.g., 80)
  dangerThreshold: number // Percentage (e.g., 100)
  enableNotifications: boolean
  categories: ExpenseCategory[]
}

/**
 * Generate budget alerts based on spending patterns
 */
export function generateBudgetAlerts(
  budgets: Array<{
    category: ExpenseCategory
    monthlyLimit: number
    currentSpent: number
    month: string
  }>,
  config: BudgetNotificationConfig = {
    warningThreshold: 80,
    dangerThreshold: 100,
    enableNotifications: true,
    categories: ['loan_repayment', 'home_allowance', 'rent', 'transport', 'food', 'data_airtime', 'miscellaneous', 'savings'],
  },
): BudgetAlert[] {
  if (!config.enableNotifications) {
    return []
  }

  const alerts: BudgetAlert[] = []
  const now = new Date()

  budgets.forEach((budget) => {
    if (!config.categories.includes(budget.category)) {
      return
    }

    const percentage = budget.monthlyLimit > 0 ? (budget.currentSpent / budget.monthlyLimit) * 100 : 0
    const remaining = budget.monthlyLimit - budget.currentSpent

    // Over budget (danger)
    if (percentage > config.dangerThreshold) {
      alerts.push({
        id: `${budget.category}-${budget.month}-danger`,
        type: 'danger',
        category: budget.category,
        title: 'Budget Exceeded',
        message: `You've exceeded your ${getCategoryDisplayName(budget.category)} budget by ₦${Math.abs(remaining).toLocaleString()}`,
        amount: Math.abs(remaining),
        percentage,
        timestamp: now,
        isRead: false,
      })
    }
    // Approaching limit (warning)
    else if (percentage >= config.warningThreshold) {
      alerts.push({
        id: `${budget.category}-${budget.month}-warning`,
        type: 'warning',
        category: budget.category,
        title: 'Budget Warning',
        message: `You're approaching your ${getCategoryDisplayName(budget.category)} budget limit (${percentage.toFixed(1)}% used)`,
        amount: remaining,
        percentage,
        timestamp: now,
        isRead: false,
      })
    }
  })

  return alerts.sort((a, b) => b.percentage - a.percentage) // Sort by severity
}

/**
 * Generate savings recommendations based on budget analysis
 */
export function generateSavingsRecommendations(
  budgets: Array<{
    category: ExpenseCategory
    monthlyLimit: number
    currentSpent: number
    month: string
  }>,
  monthlyIncome: number,
): Array<{
  type: 'savings' | 'reallocation' | 'adjustment'
  title: string
  message: string
  amount?: number
  category?: ExpenseCategory
}> {
  const recommendations = []

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.currentSpent, 0)
  const totalRemaining = totalBudgeted - totalSpent

  // Find under-utilized budgets
  const underUtilizedBudgets = budgets.filter((b) => {
    const utilization = b.monthlyLimit > 0 ? (b.currentSpent / b.monthlyLimit) * 100 : 0
    return utilization < 50 && b.monthlyLimit > 10000
  })

  if (underUtilizedBudgets.length > 0) {
    const totalUnderUtilized = underUtilizedBudgets.reduce((sum, b) => sum + (b.monthlyLimit - b.currentSpent), 0)
    recommendations.push({
      type: 'reallocation',
      title: 'Reallocation Opportunity',
      message: `You have ₦${totalUnderUtilized.toLocaleString()} unspent across ${underUtilizedBudgets.length} categories. Consider reallocating to savings or other priorities.`,
      amount: totalUnderUtilized,
    })
  }

  // Suggest increasing savings if spending is low
  if (totalRemaining > 20000) {
    const savingsRate = ((monthlyIncome - totalSpent) / monthlyIncome) * 100
    recommendations.push({
      type: 'savings',
      title: 'Savings Opportunity',
      message: `Great job staying under budget! You could save an additional ₦${totalRemaining.toLocaleString()} this month (${savingsRate.toFixed(1)}% savings rate).`,
      amount: totalRemaining,
    })
  }

  // Suggest budget adjustments for over-budget categories
  const overBudgetCategories = budgets.filter(b => b.currentSpent > b.monthlyLimit)
  overBudgetCategories.forEach((budget) => {
    const overage = budget.currentSpent - budget.monthlyLimit
    recommendations.push({
      type: 'adjustment',
      title: 'Budget Adjustment Needed',
      message: `Consider increasing your ${getCategoryDisplayName(budget.category)} budget by ₦${overage.toLocaleString()} based on your spending pattern.`,
      amount: overage,
      category: budget.category,
    })
  })

  return recommendations
}

/**
 * Check if user should receive salary allocation reminder
 */
export function shouldShowSalaryReminder(
  lastSalaryDate: Date | null,
  monthlyIncome: number,
): boolean {
  if (!lastSalaryDate || monthlyIncome <= 0) {
    return false
  }

  const now = new Date()
  const daysSinceLastSalary = Math.floor((now.getTime() - lastSalaryDate.getTime()) / (1000 * 60 * 60 * 24))

  // Show reminder if it's been more than 25 days since last salary
  // (assuming monthly salary cycle)
  return daysSinceLastSalary >= 25
}

/**
 * Get category display name
 */
function getCategoryDisplayName(category: ExpenseCategory): string {
  const categoryNames: Record<ExpenseCategory, string> = {
    loan_repayment: 'Loan Repayment',
    home_allowance: 'Home Allowance',
    rent: 'Rent',
    transport: 'Transport',
    food: 'Food & Groceries',
    data_airtime: 'Data & Airtime',
    miscellaneous: 'Miscellaneous',
    savings: 'Savings',
  }

  return categoryNames[category] || category
}

/**
 * Format budget alert for display
 */
export function formatBudgetAlert(alert: BudgetAlert): string {
  switch (alert.type) {
    case 'danger':
      return `🚨 ${alert.title}: ${alert.message}`
    case 'warning':
      return `⚠️ ${alert.title}: ${alert.message}`
    case 'info':
      return `ℹ️ ${alert.title}: ${alert.message}`
    default:
      return alert.message
  }
}

/**
 * Get alert color for UI
 */
export function getAlertColor(type: BudgetAlert['type']): string {
  switch (type) {
    case 'danger':
      return 'error'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'info'
  }
}
