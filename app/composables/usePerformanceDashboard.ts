import type { CacheStats } from '~/schemas/performance'
import { serverCache } from '~/utils/cache'

export function usePerformanceDashboard() {
  // Temporarily disable performance dashboard to debug recurring errors
  console.warn('Performance dashboard temporarily disabled to debug recurring errors')

  const metrics = ref(null)
  const systemMetrics = ref(null)
  const refreshMetrics = () => {}

  // const { metrics, systemMetrics, refresh: refreshMetrics } = usePerformanceMonitoring()

  const loading = ref(false)
  const lastUpdated = ref<string | null>(null)
  const cacheStats = ref<CacheStats | null>(null)

  // Auto-refresh interval
  let refreshInterval: NodeJS.Timeout | null = null

  async function refresh() {
    loading.value = true
    try {
      refreshMetrics()
      await getCacheStats()
      lastUpdated.value = new Date().toISOString()
    }
    catch (error) {
      console.error('Failed to refresh metrics:', error)
    }
    finally {
      loading.value = false
    }
  }

  async function getCacheStats() {
    try {
      // This would typically call an API endpoint to get cache stats
      cacheStats.value = {
        dashboard: { hitRate: 85.2, size: 45, hits: 234, misses: 41 },
        transactions: { hitRate: 92.1, size: 128, hits: 456, misses: 39 },
        budgets: { hitRate: 78.9, size: 67, hits: 189, misses: 51 },
        calculations: { hitRate: 96.3, size: 234, hits: 567, misses: 22 },
      }
    }
    catch (error) {
      console.error('Failed to get cache stats:', error)
    }
  }

  async function clearCache() {
    try {
      serverCache.clear()
      await getCacheStats()

      // Show success toast
      useToast().add({
        title: 'Cache Cleared',
        description: 'All cache has been cleared successfully',
        color: 'green',
      })
    }
    catch (error) {
      console.error('Failed to clear cache:', error)

      // Show error toast
      useToast().add({
        title: 'Cache Clear Failed',
        description: 'Failed to clear cache. Please try again.',
        color: 'red',
      })
    }
  }

  function exportMetrics() {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        systemMetrics: systemMetrics.value,
        performanceMetrics: metrics.value,
        cacheStats: cacheStats.value,
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Show success toast
      useToast().add({
        title: 'Metrics Exported',
        description: 'Performance metrics have been exported successfully',
        color: 'green',
      })
    }
    catch (error) {
      console.error('Failed to export metrics:', error)

      // Show error toast
      useToast().add({
        title: 'Export Failed',
        description: 'Failed to export metrics. Please try again.',
        color: 'red',
      })
    }
  }

  function startAutoRefresh(intervalMs = 30000) {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }

    refreshInterval = setInterval(() => {
      refresh()
    }, intervalMs)
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  // Initialize
  onMounted(() => {
    refresh()
    getCacheStats()
    startAutoRefresh()
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  return {
    // State
    loading: readonly(loading),
    lastUpdated: readonly(lastUpdated),
    cacheStats: readonly(cacheStats),
    metrics: readonly(metrics),
    systemMetrics: readonly(systemMetrics),

    // Actions
    refresh,
    clearCache,
    exportMetrics,
    startAutoRefresh,
    stopAutoRefresh,
  }
}
