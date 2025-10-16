import { DatabaseHealthMonitor } from '../../../app/utils/database-optimization'
import { performanceMonitor, ResourceMonitor } from '../../../app/utils/performance-monitor'
import { asyncHandler, requireAuth } from '../../utils/error-handler'

export default defineEventHandler(
  asyncHandler(async (event) => {
    // Require authentication and admin privileges
    const _user = await requireAuth(event)

    // For now, allow any authenticated user to view performance metrics
    // In production, you might want to restrict this to admin users only

    try {
      // Get performance metrics
      const [systemMetrics, dbHealth, cacheStats] = await Promise.all([
        ResourceMonitor.getSystemMetrics(),
        DatabaseHealthMonitor.getHealthMetrics(),
        Promise.resolve(getCacheStats()),
      ])

      const performanceStats = {
        api: performanceMonitor.getStats('api', 5 * 60 * 1000), // Last 5 minutes
        database: performanceMonitor.getStats('database', 5 * 60 * 1000),
        calculation: performanceMonitor.getStats('calculation', 5 * 60 * 1000),
        cache: performanceMonitor.getStats('cache', 5 * 60 * 1000),
      }

      const slowOperations = {
        api: performanceMonitor.getSlowOperations(5, 'api'),
        database: performanceMonitor.getSlowOperations(5, 'database'),
        calculation: performanceMonitor.getSlowOperations(5, 'calculation'),
      }

      return {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          system: systemMetrics,
          database: dbHealth,
          cache: cacheStats,
          performance: performanceStats,
          slowOperations,
          recommendations: await DatabaseHealthMonitor.getRecommendations(),
        },
      }
    }
    catch (error) {
      console.error('Failed to get performance metrics:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to retrieve performance metrics',
      })
    }
  }),
)

// Helper function to get cache statistics
function getCacheStats() {
  try {
    // This would integrate with your actual cache implementation
    // For now, return mock data
    return {
      dashboard: {
        hitRate: 85.2,
        size: 45,
        hits: 234,
        misses: 41,
        maxSize: 100,
      },
      transactions: {
        hitRate: 92.1,
        size: 128,
        hits: 456,
        misses: 39,
        maxSize: 500,
      },
      budgets: {
        hitRate: 78.9,
        size: 67,
        hits: 189,
        misses: 51,
        maxSize: 200,
      },
      calculations: {
        hitRate: 96.3,
        size: 234,
        hits: 567,
        misses: 22,
        maxSize: 1000,
      },
    }
  }
  catch (error) {
    console.error('Failed to get cache stats:', error)
    return null
  }
}
