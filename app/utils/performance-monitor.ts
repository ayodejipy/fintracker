import process from 'node:process'

// Use browser performance API or Node.js perf_hooks based on environment
async function _getPerformance() {
  if (typeof window !== 'undefined') {
    return window.performance
  }

  if (typeof (await import('node:process')).default !== 'undefined') {
    try {
      const { performance } = await import('node:perf_hooks')
      return performance
    }
    catch {
      return { now: () => Date.now() }
    }
  }

  return { now: () => Date.now() }
}

const perf = typeof window !== 'undefined'
  ? window.performance
  : { now: () => Date.now() }

// Performance metrics collection
interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
  category: 'api' | 'database' | 'calculation' | 'render' | 'cache'
}

interface PerformanceThresholds {
  api: number
  database: number
  calculation: number
  render: number
  cache: number
}

// Default performance thresholds (in milliseconds)
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  api: 1000, // API calls should complete within 1 second
  database: 500, // Database queries should complete within 500ms
  calculation: 100, // Financial calculations should complete within 100ms
  render: 16, // Render operations should complete within 16ms (60fps)
  cache: 10, // Cache operations should complete within 10ms
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private thresholds: PerformanceThresholds
  private maxMetrics: number = 1000
  private listeners: Array<(metric: PerformanceMetric) => void> = []

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
  }

  // Start timing an operation
  startTiming(name: string, category: PerformanceMetric['category'], metadata?: Record<string, any>) {
    const startTime = perf.now()

    return {
      end: () => {
        const endTime = perf.now()
        const duration = endTime - startTime

        const metric: PerformanceMetric = {
          name,
          duration,
          timestamp: Date.now(),
          metadata,
          category,
        }

        this.recordMetric(metric)
        return metric
      },
    }
  }

  // Record a performance metric
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Check if metric exceeds threshold
    if (metric.duration > this.thresholds[metric.category]) {
      console.warn(`Performance threshold exceeded: ${metric.name} took ${metric.duration.toFixed(2)}ms (threshold: ${this.thresholds[metric.category]}ms)`)
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(metric))
  }

  // Get performance statistics
  getStats(category?: PerformanceMetric['category'], timeWindow?: number) {
    let filteredMetrics = this.metrics

    if (category) {
      filteredMetrics = filteredMetrics.filter(m => m.category === category)
    }

    if (timeWindow) {
      const cutoff = Date.now() - timeWindow
      filteredMetrics = filteredMetrics.filter(m => m.timestamp > cutoff)
    }

    if (filteredMetrics.length === 0) {
      return null
    }

    const durations = filteredMetrics.map(m => m.duration)
    const sum = durations.reduce((a, b) => a + b, 0)
    const avg = sum / durations.length
    const min = Math.min(...durations)
    const max = Math.max(...durations)

    // Calculate percentiles
    const sorted = durations.sort((a, b) => a - b)
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0
    const p90 = sorted[Math.floor(sorted.length * 0.9)] || 0
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0

    return {
      count: filteredMetrics.length,
      avg: Number(avg.toFixed(2)),
      min: Number(min.toFixed(2)),
      max: Number(max.toFixed(2)),
      p50: Number(p50.toFixed(2)),
      p90: Number(p90.toFixed(2)),
      p95: Number(p95.toFixed(2)),
      p99: Number(p99.toFixed(2)),
      thresholdViolations: filteredMetrics.filter(m => m.duration > this.thresholds[m.category]).length,
    }
  }

  // Get slow operations
  getSlowOperations(limit = 10, category?: PerformanceMetric['category']) {
    let filteredMetrics = this.metrics

    if (category) {
      filteredMetrics = filteredMetrics.filter(m => m.category === category)
    }

    return filteredMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(m => ({
        name: m.name,
        duration: Number(m.duration.toFixed(2)),
        category: m.category,
        timestamp: new Date(m.timestamp).toISOString(),
        metadata: m.metadata,
      }))
  }

  // Clear metrics
  clear() {
    this.metrics = []
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// Performance decorators
export function measurePerformance(
  category: PerformanceMetric['category'],
  name?: string,
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const operationName = name || `${target.constructor.name}.${propertyKey}`

    descriptor.value = async function (...args: any[]) {
      const timer = performanceMonitor.startTiming(operationName, category, {
        args: args.length,
        className: target.constructor.name,
        methodName: propertyKey,
      })

      try {
        const result = await originalMethod.apply(this, args)
        timer.end()
        return result
      }
      catch (error) {
        const metric = timer.end()
        metric.metadata = { ...metric.metadata, error: error instanceof Error ? error.message : String(error) }
        throw error
      }
    }

    return descriptor
  }
}

// Async function performance wrapper
export function withPerformanceTracking<T extends (...args: any[]) => Promise<unknown>>(
  fn: T,
  name: string,
  category: PerformanceMetric['category'],
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const timer = performanceMonitor.startTiming(name, category, {
      args: args.length,
    })

    try {
      const result = await fn(...args)
      timer.end()
      return result
    }
    catch (error) {
      const metric = timer.end()
      metric.metadata = { ...metric.metadata, error: error instanceof Error ? error.message : String(error) }
      throw error
    }
  }) as T
}

// Memory usage monitoring
export class MemoryMonitor {
  private static snapshots: Array<{ timestamp: number, usage: NodeJS.MemoryUsage }> = []
  private static maxSnapshots = 100

  static takeSnapshot() {
    const usage = process.memoryUsage()
    this.snapshots.push({
      timestamp: Date.now(),
      usage,
    })

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots)
    }

    return usage
  }

  static getMemoryStats() {
    if (this.snapshots.length === 0) {
      return null
    }

    const latest = this.snapshots[this.snapshots.length - 1]
    const oldest = this.snapshots[0]

    if (!latest || !oldest) {
      return null
    }

    const heapUsedGrowth = latest.usage.heapUsed - oldest.usage.heapUsed
    const heapTotalGrowth = latest.usage.heapTotal - oldest.usage.heapTotal
    const externalGrowth = latest.usage.external - oldest.usage.external

    return {
      current: {
        heapUsed: this.formatBytes(latest.usage.heapUsed),
        heapTotal: this.formatBytes(latest.usage.heapTotal),
        external: this.formatBytes(latest.usage.external),
        rss: this.formatBytes(latest.usage.rss),
      },
      growth: {
        heapUsed: this.formatBytes(heapUsedGrowth),
        heapTotal: this.formatBytes(heapTotalGrowth),
        external: this.formatBytes(externalGrowth),
      },
      snapshots: this.snapshots.length,
      timespan: latest.timestamp - oldest.timestamp,
    }
  }

  private static formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) { return '0 Bytes' }
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / 1024 ** i * 100) / 100} ${sizes[i]}`
  }

  static startMonitoring(intervalMs = 30000) {
    const interval = setInterval(() => {
      this.takeSnapshot()
    }, intervalMs)

    return () => clearInterval(interval)
  }
}

// Resource usage monitoring
export class ResourceMonitor {
  static async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage()
      const startTime = process.hrtime()

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage)
        const endTime = process.hrtime(startTime)

        const totalTime = endTime[0] * 1000000 + endTime[1] / 1000 // microseconds
        const cpuTime = endUsage.user + endUsage.system // microseconds

        const cpuPercent = (cpuTime / totalTime) * 100
        resolve(Math.round(cpuPercent * 100) / 100)
      }, 100)
    })
  }

  static getEventLoopLag(): Promise<number> {
    return new Promise((resolve) => {
      const start = process.hrtime.bigint()

      setImmediate(() => {
        const end = process.hrtime.bigint()
        const lag = Number(end - start) / 1000000 // Convert to milliseconds
        resolve(Math.round(lag * 100) / 100)
      })
    })
  }

  static async getSystemMetrics() {
    const [cpuUsage, eventLoopLag, memoryStats] = await Promise.all([
      this.getCPUUsage(),
      this.getEventLoopLag(),
      Promise.resolve(MemoryMonitor.getMemoryStats()),
    ])

    return {
      cpu: {
        usage: cpuUsage,
        threshold: 80, // 80% CPU usage threshold
        status: cpuUsage > 80 ? 'warning' : 'ok',
      },
      eventLoop: {
        lag: eventLoopLag,
        threshold: 10, // 10ms event loop lag threshold
        status: eventLoopLag > 10 ? 'warning' : 'ok',
      },
      memory: memoryStats,
      timestamp: new Date().toISOString(),
    }
  }
}

// Start monitoring if in production (only on server-side)
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
  // Take memory snapshots every 30 seconds
  MemoryMonitor.startMonitoring(30000)
}

export type { PerformanceMetric, PerformanceThresholds }
