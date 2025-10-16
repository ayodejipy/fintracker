import { computed, onMounted, onUnmounted, readonly, ref, watch } from 'vue'
import { clientCache } from '~/utils/cache'
import { performanceMonitor, ResourceMonitor } from '~/utils/performance-monitor'

// Debounce utility for performance optimization
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    const callNow = immediate && !timeout

    if (timeout) { clearTimeout(timeout) }

    timeout = setTimeout(() => {
      timeout = null
      if (!immediate) { func(...args) }
    }, wait)

    if (callNow) { func(...args) }
  }
}

// Throttle utility for performance optimization
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Virtual scrolling for large lists
export function useVirtualScrolling<T>(
  items: Ref<T[]>,
  itemHeight: number,
  containerHeight: number,
  buffer = 5,
) {
  const scrollTop = ref(0)
  const containerRef = ref<HTMLElement>()

  const visibleRange = computed(() => {
    const start = Math.max(0, Math.floor(scrollTop.value / itemHeight) - buffer)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(items.value.length, start + visibleCount + buffer * 2)

    return { start, end }
  })

  const visibleItems = computed(() => {
    const { start, end } = visibleRange.value
    return items.value.slice(start, end).map((item, index) => ({
      item,
      index: start + index,
      top: (start + index) * itemHeight,
    }))
  })

  const totalHeight = computed(() => items.value.length * itemHeight)

  const handleScroll = throttle((event: Event) => {
    const target = event.target as HTMLElement
    scrollTop.value = target.scrollTop
  }, 16) // ~60fps

  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll, { passive: true })
    }
  })

  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll)
    }
  })

  return {
    containerRef,
    visibleItems,
    totalHeight,
    visibleRange,
  }
}

// Optimized data fetching with caching
export function useOptimizedFetch<T>(
  url: string,
  options: {
    cacheKey: string
    cacheKey: string
    refreshInterval?: number
    staleWhileRevalidate?: boolean
    dependencies?: Ref<any>[]
  },
) {
  const { cacheKey: key, refreshInterval, staleWhileRevalidate: _staleWhileRevalidate = true, dependencies = [] } = options

  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const lastFetch = ref<Date | null>(null)

  const fetchData = async (forceRefresh = false) => {
    loading.value = true
    error.value = null

    try {
      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = clientCache.get(key)
        if (cached) {
          data.value = cached
          lastFetch.value = new Date()
          loading.value = false
          return
        }
      }

      // Fetch fresh data
      const result = await $fetch<T>(url)

      // Cache the result
      clientCache.set(key, result)

      data.value = result
      lastFetch.value = new Date()
    }
    catch (err) {
      error.value = err as Error
      console.error('Fetch error:', err)
    }
    finally {
      loading.value = false
    }
  }

  const refresh = () => fetchData(true)

  // Auto-refresh setup
  let refreshTimer: NodeJS.Timeout | null = null

  const startAutoRefresh = () => {
    if (refreshInterval && refreshInterval > 0) {
      refreshTimer = setInterval(() => {
        fetchData(false) // Use cache if available
      }, refreshInterval)
    }
  }

  const stopAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  // Watch dependencies for changes
  if (dependencies.length > 0) {
    watch(dependencies, () => {
      fetchData(true) // Force refresh when dependencies change
    }, { deep: true })
  }

  onMounted(() => {
    fetchData()
    startAutoRefresh()
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    lastFetch: readonly(lastFetch),
    refresh,
    fetchData,
  }
}

// Performance monitoring composable
export function usePerformanceMonitoring() {
  const metrics = ref<any>(null)
  const systemMetrics = ref<any>(null)
  const alerts = ref<any[]>([])

  const updateMetrics = () => {
    metrics.value = {
      api: performanceMonitor.getStats('api', 5 * 60 * 1000), // Last 5 minutes
      database: performanceMonitor.getStats('database', 5 * 60 * 1000),
      calculation: performanceMonitor.getStats('calculation', 5 * 60 * 1000),
      cache: performanceMonitor.getStats('cache', 5 * 60 * 1000),
    }
  }

  const updateSystemMetrics = async () => {
    try {
      systemMetrics.value = await ResourceMonitor.getSystemMetrics()
    }
    catch (error) {
      console.error('Failed to get system metrics:', error)
    }
  }

  const updateAlerts = () => {
    // This would typically come from a performance alerts service
    alerts.value = []
  }

  let metricsInterval: NodeJS.Timeout | null = null

  onMounted(() => {
    // Temporarily disable performance monitoring to debug errors
    console.warn('Performance monitoring temporarily disabled to debug recurring errors')
    return
    
    updateMetrics()
    updateSystemMetrics()
    updateAlerts()

    // Update metrics every 30 seconds
    metricsInterval = setInterval(() => {
      updateMetrics()
      updateSystemMetrics()
      updateAlerts()
    }, 30000)
  })

  onUnmounted(() => {
    if (metricsInterval) {
      clearInterval(metricsInterval)
    }
  })

  return {
    metrics: readonly(metrics),
    systemMetrics: readonly(systemMetrics),
    alerts: readonly(alerts),
    refresh: () => {
      updateMetrics()
      updateSystemMetrics()
      updateAlerts()
    },
  }
}

// Optimized form handling
export function useOptimizedForm<T extends Record<string, any>>(
  initialData: T,
  validationSchema?: any,
  options: {
    debounceMs?: number
    autoSave?: boolean
    autoSaveInterval?: number
  } = {},
) {
  const { debounceMs = 300, autoSave = false, autoSaveInterval = 30000 } = options

  const formData = ref<T>({ ...initialData })
  const isDirty = ref(false)
  const isValidating = ref(false)
  const errors = ref<Record<string, string>>({})

  // Debounced validation
  const debouncedValidate = debounce(async () => {
    if (!validationSchema) { return }

    isValidating.value = true
    try {
      await validationSchema.parseAsync(formData.value)
      errors.value = {}
    }
    catch (error: any) {
      if (error.errors) {
        errors.value = error.errors.reduce((acc: any, err: any) => {
          acc[err.path.join('.')] = err.message
          return acc
        }, {})
      }
    }
    finally {
      isValidating.value = false
    }
  }, debounceMs)

  // Auto-save functionality
  const debouncedAutoSave = debounce(async () => {
    if (!autoSave || !isDirty.value) { return }

    try {
      // This would typically call an API to save the form data
      console.log('Auto-saving form data:', formData.value)
      isDirty.value = false
    }
    catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, autoSaveInterval)

  // Watch for form changes
  watch(formData, () => {
    isDirty.value = true
    debouncedValidate()

    if (autoSave) {
      debouncedAutoSave()
    }
  }, { deep: true })

  const updateField = (field: keyof T, value: unknown) => {
    formData.value[field] = value
  }

  const resetForm = () => {
    formData.value = { ...initialData }
    isDirty.value = false
    errors.value = {}
  }

  const validateForm = async () => {
    await debouncedValidate()
    return Object.keys(errors.value).length === 0
  }

  return {
    formData,
    isDirty: readonly(isDirty),
    isValidating: readonly(isValidating),
    errors: readonly(errors),
    updateField,
    resetForm,
    validateForm,
  }
}

// Image lazy loading composable
export function useLazyLoading() {
  const observer = ref<IntersectionObserver | null>(null)
  const loadedImages = ref(new Set<string>())

  const createObserver = () => {
    if (typeof window === 'undefined') { return }

    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src

            if (src && !loadedImages.value.has(src)) {
              img.src = src
              img.classList.remove('lazy')
              loadedImages.value.add(src)
              observer.value?.unobserve(img)
            }
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
      },
    )
  }

  const observeImage = (img: HTMLImageElement) => {
    if (!observer.value) { createObserver() }
    observer.value?.observe(img)
  }

  const unobserveImage = (img: HTMLImageElement) => {
    observer.value?.unobserve(img)
  }

  onMounted(() => {
    createObserver()
  })

  onUnmounted(() => {
    observer.value?.disconnect()
  })

  return {
    observeImage,
    unobserveImage,
    loadedImages: readonly(loadedImages),
  }
}

// Intersection observer composable for animations
export function useIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {},
) {
  const observer = ref<IntersectionObserver | null>(null)
  const isSupported = typeof window !== 'undefined' && 'IntersectionObserver' in window

  const createObserver = () => {
    if (!isSupported) { return }

    observer.value = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '0px',
      ...options,
    })
  }

  const observe = (target: Element) => {
    if (!observer.value) { createObserver() }
    observer.value?.observe(target)
  }

  const unobserve = (target: Element) => {
    observer.value?.unobserve(target)
  }

  const disconnect = () => {
    observer.value?.disconnect()
  }

  onMounted(() => {
    createObserver()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    isSupported,
    observe,
    unobserve,
    disconnect,
  }
}

// Export utilities
export { debounce, throttle }
