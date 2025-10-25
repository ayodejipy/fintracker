import { computed, onMounted, onUnmounted, readonly, ref } from 'vue'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  category: 'timing' | 'memory' | 'network' | 'user'
}

interface NetworkMetric {
  url: string
  method: string
  duration: number
  status: number
  size?: number
  timestamp: number
}

interface MemoryInfo {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

export function usePerformance() {
  const metrics = ref<PerformanceMetric[]>([])
  const networkMetrics = ref<NetworkMetric[]>([])
  const isMonitoring = ref(false)
  const performanceObserver = ref<PerformanceObserver | null>(null)

  const addMetric = (name: string, value: number, unit: string, category: PerformanceMetric['category']) => {
    metrics.value.push({
      name,
      value: Math.round(value * 100) / 100, // Round to 2 decimal places
      unit,
      timestamp: Date.now(),
      category,
    })

    // Keep only last 100 metrics to prevent memory leaks
    if (metrics.value.length > 100) {
      metrics.value = metrics.value.slice(-100)
    }
  }

  const monitorMemoryUsage = () => {
    // Temporarily disable memory monitoring to debug recurring errors
    console.warn('Memory monitoring temporarily disabled to debug recurring errors')
    return

    if (typeof window === 'undefined') { return }

    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory as MemoryInfo
        addMetric('JS Heap Used', memory.usedJSHeapSize / 1024 / 1024, 'MB', 'memory')
        addMetric('JS Heap Total', memory.totalJSHeapSize / 1024 / 1024, 'MB', 'memory')
        addMetric('JS Heap Limit', memory.jsHeapSizeLimit / 1024 / 1024, 'MB', 'memory')
      }
    }

    // Check memory every 30 seconds
    const memoryInterval = setInterval(checkMemory, 30000)
    checkMemory() // Initial check

    onUnmounted(() => {
      clearInterval(memoryInterval)
    })
  }

  const monitorWebVitals = () => {
    if (typeof window === 'undefined') { return }

    // Monitor Largest Contentful Paint (LCP)
    if (window.PerformanceObserver) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          if (lastEntry) {
            addMetric('Largest Contentful Paint', lastEntry.startTime, 'ms', 'timing')
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      }
      catch (error) {
        console.warn('LCP observer not supported:', error)
      }

      // Monitor First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            addMetric('First Input Delay', (entry as unknown).processingStart - entry.startTime, 'ms', 'timing')
          }
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      }
      catch (error) {
        console.warn('FID observer not supported:', error)
      }
    }
  }

  // Performance monitoring
  const startMonitoring = () => {
    if (typeof window === 'undefined' || isMonitoring.value) { return }

    isMonitoring.value = true

    // Monitor navigation timing
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing
      const navigationStart = timing.navigationStart

      addMetric('DNS Lookup', timing.domainLookupEnd - timing.domainLookupStart, 'ms', 'timing')
      addMetric('TCP Connection', timing.connectEnd - timing.connectStart, 'ms', 'timing')
      addMetric('Server Response', timing.responseEnd - timing.requestStart, 'ms', 'timing')
      addMetric('DOM Processing', timing.domComplete - timing.domLoading, 'ms', 'timing')
      addMetric('Page Load', timing.loadEventEnd - navigationStart, 'ms', 'timing')
    }

    // Monitor resource timing
    if (window.PerformanceObserver) {
      try {
        performanceObserver.value = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming
              addMetric('First Contentful Paint', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart, 'ms', 'timing')
            }
            else if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming

              // Track network requests
              if (resourceEntry.name.includes('/api/')) {
                networkMetrics.value.push({
                  url: resourceEntry.name,
                  method: 'GET', // Default, actual method not available in resource timing
                  duration: resourceEntry.responseEnd - resourceEntry.requestStart,
                  status: 200, // Default, actual status not available
                  size: resourceEntry.transferSize,
                  timestamp: Date.now(),
                })
              }
            }
            else if (entry.entryType === 'measure') {
              addMetric(entry.name, entry.duration, 'ms', 'user')
            }
          }
        })

        performanceObserver.value.observe({
          entryTypes: ['navigation', 'resource', 'measure', 'paint'],
        })
      }
      catch (error) {
        console.warn('Performance Observer not supported:', error)
      }
    }

    // Monitor memory usage (if available)
    monitorMemoryUsage()

    // Monitor Core Web Vitals
    monitorWebVitals()
  }

  const stopMonitoring = () => {
    isMonitoring.value = false
    if (performanceObserver.value) {
      performanceObserver.value.disconnect()
      performanceObserver.value = null
    }
  }

  const measureAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      addMetric(name, duration, 'ms', 'user')
      return result
    }
    catch (error) {
      const duration = performance.now() - start
      addMetric(`${name} (error)`, duration, 'ms', 'user')
      throw error
    }
  }

  const measureSync = <T>(name: string, fn: () => T): T => {
    const start = performance.now()
    try {
      const result = fn()
      const duration = performance.now() - start
      addMetric(name, duration, 'ms', 'user')
      return result
    }
    catch (error) {
      const duration = performance.now() - start
      addMetric(`${name} (error)`, duration, 'ms', 'user')
      throw error
    }
  }

  // Track API calls
  const trackApiCall = (url: string, method: string, duration: number, status: number, size?: number) => {
    networkMetrics.value.push({
      url,
      method,
      duration,
      status,
      size,
      timestamp: Date.now(),
    })

    // Keep only last 50 network metrics
    if (networkMetrics.value.length > 50) {
      networkMetrics.value = networkMetrics.value.slice(-50)
    }

    // Add to general metrics
    addMetric(`API ${method} ${url}`, duration, 'ms', 'network')
  }

  // Computed metrics
  const averageApiResponseTime = computed(() => {
    if (networkMetrics.value.length === 0) { return 0 }
    const total = networkMetrics.value.reduce((sum, metric) => sum + metric.duration, 0)
    return Math.round((total / networkMetrics.value.length) * 100) / 100
  })

  const slowestApiCalls = computed(() => {
    return [...networkMetrics.value]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)
  })

  const errorRate = computed(() => {
    if (networkMetrics.value.length === 0) { return 0 }
    const errors = networkMetrics.value.filter(metric => metric.status >= 400).length
    return Math.round((errors / networkMetrics.value.length) * 100 * 100) / 100
  })

  const memoryUsage = computed(() => {
    const memoryMetrics = metrics.value.filter(m => m.category === 'memory')
    if (memoryMetrics.length === 0) { return null }

    const latest = memoryMetrics.slice(-3) // Get latest memory metrics
    return {
      used: latest.find(m => m.name === 'JS Heap Used')?.value || 0,
      total: latest.find(m => m.name === 'JS Heap Total')?.value || 0,
      limit: latest.find(m => m.name === 'JS Heap Limit')?.value || 0,
    }
  })

  const performanceSummary = computed(() => {
    const timingMetrics = metrics.value.filter(m => m.category === 'timing')
    const networkMetrics = metrics.value.filter(m => m.category === 'network')

    return {
      pageLoad: timingMetrics.find(m => m.name === 'Page Load')?.value || 0,
      apiCalls: {
        count: networkMetrics.length,
        averageTime: averageApiResponseTime.value,
        errorRate: errorRate.value,
      },
      memory: memoryUsage.value,
      webVitals: {
        lcp: timingMetrics.find(m => m.name === 'Largest Contentful Paint')?.value || 0,
        fid: timingMetrics.find(m => m.name === 'First Input Delay')?.value || 0,
        cls: timingMetrics.find(m => m.name === 'Cumulative Layout Shift')?.value || 0,
      },
    }
  })

  // Performance scoring
  const getPerformanceScore = computed(() => {
    const summary = performanceSummary.value
    let score = 100

    // Page load performance (30% weight)
    if (summary.pageLoad > 3000) { score -= 30 }
    else if (summary.pageLoad > 2000) { score -= 20 }
    else if (summary.pageLoad > 1000) { score -= 10 }

    // API performance (25% weight)
    if (summary.apiCalls.averageTime > 1000) { score -= 25 }
    else if (summary.apiCalls.averageTime > 500) { score -= 15 }
    else if (summary.apiCalls.averageTime > 200) { score -= 5 }

    // Error rate (20% weight)
    if (summary.apiCalls.errorRate > 10) { score -= 20 }
    else if (summary.apiCalls.errorRate > 5) { score -= 10 }
    else if (summary.apiCalls.errorRate > 1) { score -= 5 }

    // Web Vitals (25% weight)
    if (summary.webVitals.lcp > 4000) { score -= 10 }
    else if (summary.webVitals.lcp > 2500) { score -= 5 }

    if (summary.webVitals.fid > 300) { score -= 10 }
    else if (summary.webVitals.fid > 100) { score -= 5 }

    if (summary.webVitals.cls > 0.25) { score -= 5 }
    else if (summary.webVitals.cls > 0.1) { score -= 2 }

    return Math.max(0, Math.min(100, score))
  })

  const getPerformanceGrade = computed(() => {
    const score = getPerformanceScore.value
    if (score >= 90) { return 'A' }
    if (score >= 80) { return 'B' }
    if (score >= 70) { return 'C' }
    if (score >= 60) { return 'D' }
    return 'F'
  })

  // Clear metrics
  const clearMetrics = () => {
    metrics.value = []
    networkMetrics.value = []
  }

  // Export metrics
  const exportMetrics = () => {
    return {
      timestamp: new Date().toISOString(),
      metrics: metrics.value,
      networkMetrics: networkMetrics.value,
      summary: performanceSummary.value,
      score: getPerformanceScore.value,
      grade: getPerformanceGrade.value,
    }
  }

  // Auto-start monitoring on mount
  onMounted(() => {
    startMonitoring()
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    // State
    metrics: readonly(metrics),
    networkMetrics: readonly(networkMetrics),
    isMonitoring: readonly(isMonitoring),

    // Computed
    averageApiResponseTime,
    slowestApiCalls,
    errorRate,
    memoryUsage,
    performanceSummary,
    getPerformanceScore,
    getPerformanceGrade,

    // Methods
    startMonitoring,
    stopMonitoring,
    addMetric,
    measureAsync,
    measureSync,
    trackApiCall,
    clearMetrics,
    exportMetrics,
  }
}
