import type { ApiResponse } from '~/types'
import { computed } from 'vue'

// Dashboard data types
export interface DashboardData {
  currentMonth: {
    month: string
    income: number
    expenses: number
    netIncome: number
    cashFlow: number
  }
  overview: {
    netWorth: number
    totalDebt: number
    totalSavings: number
    monthlyCommitments: number
  }
  budget: {
    totalBudget: number
    totalSpent: number
    utilization: number
    remaining: number
    categories: Array<{
      category: string
      budgeted: number
      spent: number
      remaining: number
      utilization: number
    }>
  }
  debt: {
    totalDebt: number
    monthlyPayments: number
    activeLoans: number
    loans: Array<{
      id: string
      name: string
      balance: number
      monthlyPayment: number
    }>
  }
  savings: {
    totalTarget: number
    totalCurrent: number
    progress: number
    monthlyContributions: number
    activeGoals: number
    goals: Array<{
      id: string
      name: string
      target: number
      current: number
      progress: number
      monthlyContribution: number
    }>
  }
  expenses: {
    total: number
    byCategory: Array<{
      category: string
      amount: number
      percentage: number
    }>
  }
  recentTransactions: Array<{
    id: string
    amount: number
    type: string
    category: string
    date: Date
  }>
  trends: Array<{
    month: string
    income: number
    expenses: number
    netIncome: number
  }>
}

export function useDashboard(month?: string) {
  // Build query params for cache key
  const queryParams = month ? { month } : {}
  const cacheKey = `dashboard-overview${month ? `-${month}` : ''}`

  // Use useFetch for reactive, cached data
  const { data: response, pending: loading, error: fetchError, refresh } = useFetch<ApiResponse<DashboardData>>('/api/dashboard/overview', {
    key: cacheKey,
    query: queryParams,
    server: true,
    lazy: false,
    default: () => ({ success: false, data: null, message: 'Loading...' }),
    transform: (data: ApiResponse<DashboardData>) => data,
  })

  // Extract dashboard data from API response
  const dashboardData = computed(() => {
    return response.value?.success ? response.value.data : null
  })

  // Extract error message
  const error = computed(() => {
    if (fetchError.value) {
      return fetchError.value.data?.message || 'Failed to fetch dashboard data'
    }
    if (response.value && !response.value.success) {
      return response.value.message || 'Failed to fetch dashboard data'
    }
    return null
  })

  // Refresh function for manual cache invalidation
  const refreshDashboard = () => {
    return refresh()
  }

  // Fetch data for different month (creates new cache entry)
  const fetchDashboardData = async (_newMonth?: string) => {
    // If month is different, we need to use a different composable instance
    // For now, just refresh current data
    return refresh()
  }

  // Computed properties for easy access to dashboard metrics
  const currentMonthSummary = computed(() => dashboardData.value?.currentMonth || null)

  const financialOverview = computed(() => dashboardData.value?.overview || null)

  const budgetSummary = computed(() => dashboardData.value?.budget || null)

  const debtSummary = computed(() => dashboardData.value?.debt || null)

  const savingsSummary = computed(() => dashboardData.value?.savings || null)

  const expenseBreakdown = computed(() => dashboardData.value?.expenses || null)

  const recentActivity = computed(() => dashboardData.value?.recentTransactions || [])

  const monthlyTrends = computed(() => dashboardData.value?.trends || [])

  // Financial health indicators
  const financialHealthScore = computed(() => {
    if (!dashboardData.value) { return 0 }

    let score = 0
    const data = dashboardData.value

    // Positive cash flow (25 points)
    if (data.currentMonth.cashFlow > 0) {
      score += 25
    }

    // Budget adherence (25 points)
    if (data.budget.utilization <= 100) {
      score += 25 - Math.max(0, (data.budget.utilization - 80) * 1.25)
    }

    // Savings progress (25 points)
    if (data.savings.progress > 0) {
      score += Math.min(25, data.savings.progress * 0.25)
    }

    // Debt management (25 points)
    const debtToSavingsRatio = data.overview.totalSavings > 0
      ? data.overview.totalDebt / data.overview.totalSavings
      : data.overview.totalDebt > 0 ? 2 : 0

    if (debtToSavingsRatio <= 0.5) {
      score += 25
    }
    else if (debtToSavingsRatio <= 1) {
      score += 15
    }
    else if (debtToSavingsRatio <= 2) {
      score += 5
    }

    return Math.round(Math.max(0, Math.min(100, score)))
  })

  const healthScoreColor = computed(() => {
    const score = financialHealthScore.value
    if (score >= 80) { return 'green' }
    if (score >= 60) { return 'yellow' }
    if (score >= 40) { return 'orange' }
    return 'red'
  })

  const healthScoreText = computed(() => {
    const score = financialHealthScore.value
    if (score >= 80) { return 'Excellent' }
    if (score >= 60) { return 'Good' }
    if (score >= 40) { return 'Fair' }
    return 'Needs Improvement'
  })

  // Key insights
  const insights = computed(() => {
    if (!dashboardData.value) { return [] }

    const insights = []
    const data = dashboardData.value

    // Cash flow insights
    if (data.currentMonth.cashFlow < 0) {
      insights.push({
        type: 'warning',
        title: 'Negative Cash Flow',
        message: `You're spending more than you earn this month. Consider reviewing your expenses.`,
        priority: 'high',
      })
    }
    else if (data.currentMonth.cashFlow > data.currentMonth.income * 0.2) {
      insights.push({
        type: 'success',
        title: 'Strong Cash Flow',
        message: `Great job! You have strong positive cash flow this month.`,
        priority: 'low',
      })
    }

    // Budget insights
    if (data.budget.utilization > 100) {
      insights.push({
        type: 'error',
        title: 'Budget Exceeded',
        message: `You've exceeded your budget by ${((data.budget.utilization - 100)).toFixed(1)}%.`,
        priority: 'high',
      })
    }
    else if (data.budget.utilization > 90) {
      insights.push({
        type: 'warning',
        title: 'Budget Alert',
        message: `You're close to your budget limit at ${data.budget.utilization.toFixed(1)}% utilization.`,
        priority: 'medium',
      })
    }

    // Savings insights
    if (data.savings.activeGoals > 0 && data.savings.progress < 10) {
      insights.push({
        type: 'info',
        title: 'Savings Goals',
        message: `You have ${data.savings.activeGoals} active savings goals. Consider increasing contributions.`,
        priority: 'medium',
      })
    }

    // Debt insights
    if (data.debt.totalDebt > data.overview.totalSavings * 2) {
      insights.push({
        type: 'warning',
        title: 'High Debt Ratio',
        message: `Your debt is significantly higher than your savings. Focus on debt reduction.`,
        priority: 'high',
      })
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
    })
  })

  return {
    // State
    dashboardData: readonly(dashboardData),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchDashboardData,
    refreshDashboard,

    // Computed data sections
    currentMonthSummary,
    financialOverview,
    budgetSummary,
    debtSummary,
    savingsSummary,
    expenseBreakdown,
    recentActivity,
    monthlyTrends,

    // Financial health
    financialHealthScore,
    healthScoreColor,
    healthScoreText,
    insights,
  }
}
