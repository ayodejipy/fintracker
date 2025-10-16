// In-memory cache implementation for server-side caching
class MemoryCache {
  private cache = new Map<string, { data: any, expires: number }>()
  private timers = new Map<string, ReturnType<typeof setTimeout>>()

  set(key: string, data: any, ttlMs: number = 300000): void { // Default 5 minutes
    // Clear existing timer if any
    const existingTimer = this.timers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const expires = Date.now() + ttlMs
    this.cache.set(key, { data, expires })

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key)
    }, ttlMs)

    this.timers.set(key, timer)
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    if (Date.now() > item.expires) {
      this.delete(key)
      return null
    }

    return item.data as T
  }

  delete(key: string): boolean {
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }

    return this.cache.delete(key)
  }

  clear(): void {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }

    this.timers.clear()
    this.cache.clear()
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) { return false }

    if (Date.now() > item.expires) {
      this.delete(key)
      return false
    }

    return true
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Get cache statistics
  getStats() {
    const now = Date.now()
    let expired = 0
    let active = 0

    for (const [_key, item] of this.cache.entries()) {
      if (now > item.expires) {
        expired++
      }
      else {
        active++
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      memoryUsage: this.estimateMemoryUsage(),
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let size = 0
    for (const [key, item] of this.cache.entries()) {
      size += key.length * 2 // UTF-16 characters
      size += JSON.stringify(item.data).length * 2
      size += 16 // Overhead for expires timestamp and object structure
    }
    return size
  }
}

// Global cache instance
export const serverCache = new MemoryCache()

// Cache key generators
export const cacheKeys = {
  userDashboard: (userId: string) => `dashboard:${userId}`,
  userTransactions: (userId: string, filters?: string) =>
    `transactions:${userId}${filters ? `:${filters}` : ''}`,
  userBudgets: (userId: string, month?: string) =>
    `budgets:${userId}${month ? `:${month}` : ''}`,
  userLoans: (userId: string) => `loans:${userId}`,
  userSavingsGoals: (userId: string) => `savings:${userId}`,
  transactionSummary: (userId: string, period: string) =>
    `transaction-summary:${userId}:${period}`,
  budgetAnalysis: (userId: string) => `budget-analysis:${userId}`,
  loanProjection: (loanId: string) => `loan-projection:${loanId}`,
  savingsProjection: (goalId: string) => `savings-projection:${goalId}`,
  monthlyTrends: (userId: string, months: number) =>
    `monthly-trends:${userId}:${months}`,
  expenseBreakdown: (userId: string, period: string) =>
    `expense-breakdown:${userId}:${period}`,
}

// Cache TTL constants (in milliseconds)
export const cacheTTL = {
  dashboard: 5 * 60 * 1000, // 5 minutes
  transactions: 2 * 60 * 1000, // 2 minutes
  budgets: 10 * 60 * 1000, // 10 minutes
  loans: 15 * 60 * 1000, // 15 minutes
  savingsGoals: 10 * 60 * 1000, // 10 minutes
  summaries: 30 * 60 * 1000, // 30 minutes
  projections: 60 * 60 * 1000, // 1 hour
  trends: 60 * 60 * 1000, // 1 hour
}

// Cache invalidation helpers
export const invalidateCache = {
  user: (userId: string) => {
    const keysToDelete = serverCache.keys().filter(key =>
      key.includes(userId),
    )
    keysToDelete.forEach(key => serverCache.delete(key))
  },

  userTransactions: (userId: string) => {
    const keysToDelete = serverCache.keys().filter(key =>
      key.startsWith(`transactions:${userId}`)
      || key.startsWith(`transaction-summary:${userId}`)
      || key.startsWith(`dashboard:${userId}`)
      || key.startsWith(`expense-breakdown:${userId}`)
      || key.startsWith(`monthly-trends:${userId}`),
    )
    keysToDelete.forEach(key => serverCache.delete(key))
  },

  userBudgets: (userId: string) => {
    const keysToDelete = serverCache.keys().filter(key =>
      key.startsWith(`budgets:${userId}`)
      || key.startsWith(`budget-analysis:${userId}`)
      || key.startsWith(`dashboard:${userId}`),
    )
    keysToDelete.forEach(key => serverCache.delete(key))
  },

  userLoans: (userId: string) => {
    const keysToDelete = serverCache.keys().filter(key =>
      key.startsWith(`loans:${userId}`)
      || key.startsWith(`dashboard:${userId}`),
    )
    keysToDelete.forEach(key => serverCache.delete(key))
  },

  userSavingsGoals: (userId: string) => {
    const keysToDelete = serverCache.keys().filter(key =>
      key.startsWith(`savings:${userId}`)
      || key.startsWith(`dashboard:${userId}`),
    )
    keysToDelete.forEach(key => serverCache.delete(key))
  },

  loanProjection: (loanId: string) => {
    serverCache.delete(cacheKeys.loanProjection(loanId))
  },

  savingsProjection: (goalId: string) => {
    serverCache.delete(cacheKeys.savingsProjection(goalId))
  },
}

// Cached function wrapper
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttl: number = cacheTTL.dashboard,
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args)

    // Try to get from cache first
    const cached = serverCache.get(key)
    if (cached !== null) {
      return cached
    }

    // Execute function and cache result
    const result = await fn(...args)
    serverCache.set(key, result, ttl)

    return result
  }) as T
}

// Client-side caching utilities
export class ClientCache {
  private storage: Storage
  private prefix: string

  constructor(storage?: Storage, prefix: string = 'pfd_cache_') {
    // Use localStorage only in browser environment
    this.storage = storage || (typeof window !== 'undefined' ? localStorage : null as unknown)
    this.prefix = prefix
  }

  set(key: string, data: unknown, ttlMs: number = 300000): void {
    if (!this.storage || typeof window === 'undefined') { return }

    const item = {
      data,
      expires: Date.now() + ttlMs,
    }

    try {
      this.storage.setItem(this.prefix + key, JSON.stringify(item))
    }
    catch (error) {
      console.warn('Failed to cache data:', error)
    }
  }

  get<T>(key: string): T | null {
    if (!this.storage || typeof window === 'undefined') { return null }

    try {
      const itemStr = this.storage.getItem(this.prefix + key)
      if (!itemStr) { return null }

      const item = JSON.parse(itemStr)

      if (Date.now() > item.expires) {
        this.delete(key)
        return null
      }

      return item.data as T
    }
    catch (error) {
      console.warn('Failed to retrieve cached data:', error)
      return null
    }
  }

  delete(key: string): void {
    if (!this.storage || typeof window === 'undefined') { return }

    try {
      this.storage.removeItem(this.prefix + key)
    }
    catch (error) {
      console.warn('Failed to delete cached data:', error)
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(this.storage).filter(key =>
        key.startsWith(this.prefix),
      )
      if (this.storage && typeof window !== 'undefined') {
        keys.forEach(key => this.storage.removeItem(key))
      }
    }
    catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }

  // Clean expired items
  cleanup(): void {
    try {
      const now = Date.now()
      const keys = Object.keys(this.storage).filter(key =>
        key.startsWith(this.prefix),
      )

      if (this.storage && typeof window !== 'undefined') {
        keys.forEach((key) => {
          try {
            const itemStr = this.storage.getItem(key)
            if (itemStr) {
              const item = JSON.parse(itemStr)
              if (now > item.expires) {
                this.storage.removeItem(key)
              }
            }
          }
          catch {
            // Remove corrupted items
            this.storage.removeItem(key)
          }
        })
      }
    }
    catch (error) {
      console.warn('Failed to cleanup cache:', error)
    }
  }
}

// Global client cache instance
export const clientCache = new ClientCache()

// Auto-cleanup client cache every 10 minutes
// Temporarily disabled to debug recurring errors
if (false && typeof window !== 'undefined') {
  setInterval(() => {
    clientCache.cleanup()
  }, 10 * 60 * 1000)
}

// Cache warming utilities
export const warmCache = {
  async userDashboard(userId: string) {
    // Pre-load dashboard data
    const dashboardKey = cacheKeys.userDashboard(userId)
    if (!serverCache.has(dashboardKey)) {
      // This would typically call the actual dashboard data function
      console.log(`Warming cache for user dashboard: ${userId}`)
    }
  },

  async userFinancialData(userId: string) {
    // Pre-load all user financial data
    const _keys = [
      cacheKeys.userTransactions(userId),
      cacheKeys.userBudgets(userId),
      cacheKeys.userLoans(userId),
      cacheKeys.userSavingsGoals(userId),
    ]

    console.log(`Warming cache for user financial data: ${userId}`)
    // Implementation would call actual data loading functions
  },
}

// Cache monitoring
export const cacheMonitor = {
  getStats() {
    return {
      server: serverCache.getStats(),
      client: this.getClientStats(),
    }
  },

  getClientStats() {
    if (typeof window === 'undefined') { return null }

    try {
      if (typeof window === 'undefined') { return { totalSize: 0, itemCount: 0 } }

      const keys = Object.keys(localStorage).filter(key =>
        key.startsWith('pfd_cache_'),
      )

      let totalSize = 0
      let active = 0
      let expired = 0
      const now = Date.now()

      keys.forEach((key) => {
        try {
          const itemStr = localStorage.getItem(key)
          if (itemStr) {
            totalSize += itemStr.length * 2 // UTF-16
            const item = JSON.parse(itemStr)
            if (now > item.expires) {
              expired++
            }
            else {
              active++
            }
          }
        }
        catch {
          // Ignore corrupted items
        }
      })

      return {
        total: keys.length,
        active,
        expired,
        estimatedSize: totalSize,
      }
    }
    catch (error) {
      console.warn('Failed to get client cache stats:', error)
      return null
    }
  },
}
