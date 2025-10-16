import type { DashboardData } from '~/composables/useDashboard'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDashboard } from '~/composables/useDashboard'

// Mock $fetch
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockDashboardData: DashboardData = {
    currentMonth: {
      month: '2024-01',
      income: 5000,
      expenses: 3000,
      netIncome: 2000,
      cashFlow: 1000,
    },
    overview: {
      netWorth: 10000,
      totalDebt: 15000,
      totalSavings: 25000,
      monthlyCommitments: 1000,
    },
    budget: {
      totalBudget: 3500,
      totalSpent: 3000,
      utilization: 85.71,
      remaining: 500,
      categories: [
        {
          category: 'Food',
          budgeted: 1500,
          spent: 1200,
          remaining: 300,
          utilization: 80,
        },
        {
          category: 'Transport',
          budgeted: 1000,
          spent: 800,
          remaining: 200,
          utilization: 80,
        },
      ],
    },
    debt: {
      totalDebt: 15000,
      monthlyPayments: 500,
      activeLoans: 2,
      loans: [
        {
          id: '1',
          name: 'Car Loan',
          balance: 10000,
          monthlyPayment: 300,
        },
        {
          id: '2',
          name: 'Personal Loan',
          balance: 5000,
          monthlyPayment: 200,
        },
      ],
    },
    savings: {
      totalTarget: 50000,
      totalCurrent: 25000,
      progress: 50,
      monthlyContributions: 500,
      activeGoals: 2,
      goals: [
        {
          id: '1',
          name: 'Emergency Fund',
          target: 30000,
          current: 15000,
          progress: 50,
          monthlyContribution: 300,
        },
        {
          id: '2',
          name: 'Vacation',
          target: 20000,
          current: 10000,
          progress: 50,
          monthlyContribution: 200,
        },
      ],
    },
    expenses: {
      total: 3000,
      byCategory: [
        {
          category: 'Food',
          amount: 1200,
          percentage: 40,
        },
        {
          category: 'Transport',
          amount: 800,
          percentage: 26.67,
        },
        {
          category: 'Entertainment',
          amount: 1000,
          percentage: 33.33,
        },
      ],
    },
    recentTransactions: [
      {
        id: '1',
        amount: 100,
        type: 'EXPENSE',
        category: 'Food',
        date: new Date('2024-01-15'),
      },
      {
        id: '2',
        amount: 5000,
        type: 'INCOME',
        category: 'Salary',
        date: new Date('2024-01-01'),
      },
    ],
    trends: [
      {
        month: '2023-12',
        income: 4500,
        expenses: 2800,
        netIncome: 1700,
      },
      {
        month: '2024-01',
        income: 5000,
        expenses: 3000,
        netIncome: 2000,
      },
    ],
  }

  describe('fetchDashboardData', () => {
    it('should fetch dashboard data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockDashboardData,
      })

      const { fetchDashboardData, dashboardData, loading, error } = useDashboard()

      expect(loading.value).toBe(false)
      expect(error.value).toBe(null)
      expect(dashboardData.value).toBe(null)

      await fetchDashboardData()

      expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/overview', {
        query: {},
      })
      expect(dashboardData.value).toEqual(mockDashboardData)
      expect(loading.value).toBe(false)
      expect(error.value).toBe(null)
    })

    it('should fetch dashboard data for specific month', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockDashboardData,
      })

      const { fetchDashboardData } = useDashboard()

      await fetchDashboardData('2024-02')

      expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/overview', {
        query: { month: '2024-02' },
      })
    })

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to fetch dashboard data'
      mockFetch.mockRejectedValueOnce({
        data: { message: errorMessage },
      })

      const { fetchDashboardData, error, loading } = useDashboard()

      await fetchDashboardData()

      expect(error.value).toBe(errorMessage)
      expect(loading.value).toBe(false)
    })

    it('should handle API response errors', async () => {
      const errorMessage = 'Server error'
      mockFetch.mockResolvedValueOnce({
        success: false,
        message: errorMessage,
      })

      const { fetchDashboardData, error } = useDashboard()

      await fetchDashboardData()

      expect(error.value).toBe(errorMessage)
    })
  })

  describe('computed properties', () => {
    it('should provide access to dashboard data sections', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockDashboardData,
      })

      const {
        fetchDashboardData,
        currentMonthSummary,
        financialOverview,
        budgetSummary,
        debtSummary,
        savingsSummary,
        expenseBreakdown,
        recentActivity,
        monthlyTrends,
      } = useDashboard()

      await fetchDashboardData()

      expect(currentMonthSummary.value).toEqual(mockDashboardData.currentMonth)
      expect(financialOverview.value).toEqual(mockDashboardData.overview)
      expect(budgetSummary.value).toEqual(mockDashboardData.budget)
      expect(debtSummary.value).toEqual(mockDashboardData.debt)
      expect(savingsSummary.value).toEqual(mockDashboardData.savings)
      expect(expenseBreakdown.value).toEqual(mockDashboardData.expenses)
      expect(recentActivity.value).toEqual(mockDashboardData.recentTransactions)
      expect(monthlyTrends.value).toEqual(mockDashboardData.trends)
    })
  })

  describe('financial health score', () => {
    it('should calculate financial health score correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockDashboardData,
      })

      const { fetchDashboardData, financialHealthScore, healthScoreColor, healthScoreText } = useDashboard()

      await fetchDashboardData()

      // With the mock data:
      // - Positive cash flow: +25 points
      // - Budget utilization 85.71%: +25 - (85.71 - 80) * 1.25 = +25 - 7.14 = +17.86 points
      // - Savings progress 50%: +50 * 0.25 = +12.5 points
      // - Debt to savings ratio 15000/25000 = 0.6: +15 points (between 0.5 and 1)
      // Total: 25 + 17.86 + 12.5 + 15 = 70.36 ≈ 70 points

      expect(financialHealthScore.value).toBeGreaterThan(60)
      expect(financialHealthScore.value).toBeLessThan(80)
      expect(healthScoreColor.value).toBe('yellow')
      expect(healthScoreText.value).toBe('Good')
    })

    it('should handle excellent financial health', async () => {
      const excellentData = {
        ...mockDashboardData,
        currentMonth: {
          ...mockDashboardData.currentMonth,
          cashFlow: 2000, // Positive cash flow
        },
        budget: {
          ...mockDashboardData.budget,
          utilization: 70, // Good budget utilization
        },
        savings: {
          ...mockDashboardData.savings,
          progress: 80, // High savings progress
        },
        overview: {
          ...mockDashboardData.overview,
          totalDebt: 5000, // Low debt
          totalSavings: 25000, // High savings
        },
      }

      mockFetch.mockResolvedValueOnce({
        success: true,
        data: excellentData,
      })

      const { fetchDashboardData, financialHealthScore, healthScoreColor, healthScoreText } = useDashboard()

      await fetchDashboardData()

      expect(financialHealthScore.value).toBeGreaterThanOrEqual(80)
      expect(healthScoreColor.value).toBe('green')
      expect(healthScoreText.value).toBe('Excellent')
    })
  })

  describe('insights', () => {
    it('should generate appropriate insights', async () => {
      const insightData = {
        ...mockDashboardData,
        currentMonth: {
          ...mockDashboardData.currentMonth,
          cashFlow: -500, // Negative cash flow
        },
        budget: {
          ...mockDashboardData.budget,
          utilization: 110, // Over budget
        },
      }

      mockFetch.mockResolvedValueOnce({
        success: true,
        data: insightData,
      })

      const { fetchDashboardData, insights } = useDashboard()

      await fetchDashboardData()

      expect(insights.value).toHaveLength(2)

      const negativeFlowInsight = insights.value.find(i => i.title === 'Negative Cash Flow')
      expect(negativeFlowInsight).toBeDefined()
      expect(negativeFlowInsight?.type).toBe('warning')
      expect(negativeFlowInsight?.priority).toBe('high')

      const budgetInsight = insights.value.find(i => i.title === 'Budget Exceeded')
      expect(budgetInsight).toBeDefined()
      expect(budgetInsight?.type).toBe('error')
      expect(budgetInsight?.priority).toBe('high')
    })

    it('should generate positive insights for good financial health', async () => {
      const goodData = {
        ...mockDashboardData,
        currentMonth: {
          ...mockDashboardData.currentMonth,
          income: 5000,
          cashFlow: 1500, // Strong positive cash flow (30% of income)
        },
      }

      mockFetch.mockResolvedValueOnce({
        success: true,
        data: goodData,
      })

      const { fetchDashboardData, insights } = useDashboard()

      await fetchDashboardData()

      const positiveInsight = insights.value.find(i => i.title === 'Strong Cash Flow')
      expect(positiveInsight).toBeDefined()
      expect(positiveInsight?.type).toBe('success')
      expect(positiveInsight?.priority).toBe('low')
    })
  })

  describe('refreshDashboard', () => {
    it('should refresh dashboard data', async () => {
      mockFetch.mockResolvedValueOnce({
        success: true,
        data: mockDashboardData,
      })

      const { refreshDashboard } = useDashboard()

      await refreshDashboard()

      expect(mockFetch).toHaveBeenCalledWith('/api/dashboard/overview', {
        query: {},
      })
    })
  })
})
