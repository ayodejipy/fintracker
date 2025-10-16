import { cacheKeys, serverCache } from '../../../app/utils/cache'
import { DatabaseOptimizer } from '../../../app/utils/database-optimization'
import { performanceMonitor } from '../../../app/utils/performance-monitor'
import { asyncHandler, requireAuth } from '../../utils/error-handler'

export default defineEventHandler(
  asyncHandler(async (event) => {
    const timer = performanceMonitor.startTiming('dashboard-overview', 'api')

    try {
      // Require authentication
      const user = await requireAuth(event)

      // Check cache first
      const cacheKeyStr = cacheKeys.userDashboard(user.id)
      const cached = serverCache.get(cacheKeyStr)
      if (cached) {
        timer.end()
        return cached
      }

      // Get optimized dashboard data
      const dashboardData = await DatabaseOptimizer.getDashboardDataOptimized(user.id, 'current')

      // Get additional metrics in parallel
      const [loanProjections, savingsGoals, recentTransactions] = await Promise.all([
        DatabaseOptimizer.getLoanProjectionsOptimized(user.id),
        $fetch(`/api/savings-goals`, {
          headers: { 'x-user-id': user.id },
          internal: true,
        }).catch(() => []),
        DatabaseOptimizer.getTransactionsOptimized(user.id, {
          limit: 5,
          orderBy: [{ date: 'desc' }],
        }),
      ])

      const response = {
        success: true,
        data: {
          ...dashboardData,
          totalLoans: loanProjections.length,
          totalDebt: loanProjections.reduce((sum, loan) => sum + Number(loan.currentBalance), 0),
          totalSavingsGoals: Array.isArray(savingsGoals) ? savingsGoals.length : 0,
          totalSavingsAmount: Array.isArray(savingsGoals)
            ? savingsGoals.reduce((sum: number, goal: any) => sum + Number(goal.currentAmount || 0), 0)
            : 0,
          recentTransactions: recentTransactions.slice(0, 5),
          lastUpdated: new Date().toISOString(),
        },
      }

      // Cache the response
      serverCache.set(cacheKeyStr, response)

      timer.end()
      return response
    }
    catch (error) {
      const metric = timer.end()
      metric.metadata = { ...metric.metadata, error: error instanceof Error ? error.message : String(error) }
      throw error
    }
  }),
)
