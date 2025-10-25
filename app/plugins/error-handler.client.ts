import { categorizeError, logError } from '~/utils/error-handling'

export default defineNuxtPlugin((nuxtApp) => {
  // Initialize error handler once at plugin level
  const { showErrorToast } = useErrorHandler()

  // Enhanced error tracking to debug recurring errors
  const errorCounts = new Map<string, number>()
  const MAX_ERROR_COUNT = 3

  // Prevent infinite loops by tracking recent errors
  const recentErrors = new Set<string>()
  const ERROR_COOLDOWN = 5000 // 5 seconds

  const shouldShowError = (errorKey: string): boolean => {
    // Track error counts
    const count = errorCounts.get(errorKey) || 0
    errorCounts.set(errorKey, count + 1)

    // Log recurring errors for debugging
    if (count > 0) {
      console.error(`Recurring error detected (${count + 1}x):`, errorKey)
    }

    // Stop showing errors after max count
    if (count >= MAX_ERROR_COUNT) {
      console.error(`Error suppressed after ${MAX_ERROR_COUNT} occurrences:`, errorKey)
      return false
    }

    if (recentErrors.has(errorKey)) {
      return false
    }

    recentErrors.add(errorKey)
    setTimeout(() => {
      recentErrors.delete(errorKey)
      // Reset error count after cooldown
      errorCounts.delete(errorKey)
    }, ERROR_COOLDOWN)

    return true
  }

  // Global error handler for Vue errors
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    const appError = categorizeError(error)

    // Add Vue-specific context
    appError.details = {
      ...appError.details,
      vueErrorInfo: info,
      componentName: instance?.$options?.name || 'Unknown',
      route: nuxtApp.$router?.currentRoute?.value?.path || 'unknown',
    }

    logError(appError, {
      type: 'vue-error',
      instance: instance?.$options?.name,
      info,
    })

    // Show user-friendly error message (with cooldown)
    const errorKey = `vue-${appError.code}-${appError.message}`
    if (shouldShowError(errorKey)) {
      showErrorToast(appError)
    }
  }

  // Global unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const appError = categorizeError(event.reason)

    appError.details = {
      ...appError.details,
      type: 'unhandled-promise-rejection',
      route: nuxtApp.$router?.currentRoute?.value?.path || 'unknown',
    }

    logError(appError, {
      type: 'unhandled-promise-rejection',
      reason: event.reason,
    })

    // Prevent the default browser error handling
    event.preventDefault()

    // Show user-friendly error message (with cooldown)
    // Don't show toasts for AbortError (request cancellation is expected behavior)
    const isAbortError = event.reason?.name === 'AbortError' || appError.message.includes('Request aborted')
    const errorKey = `promise-${appError.code}-${appError.message}`
    if (shouldShowError(errorKey) && !isAbortError) {
      showErrorToast(appError)
    }
  })

  // Global error handler for uncaught exceptions
  window.addEventListener('error', (event) => {
    const appError = categorizeError(event.error || new Error(event.message))

    appError.details = {
      ...appError.details,
      type: 'uncaught-exception',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      route: nuxtApp.$router?.currentRoute?.value?.path || 'unknown',
    }

    logError(appError, {
      type: 'uncaught-exception',
      event: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    })

    // Show user-friendly error message (with cooldown)
    const errorKey = `exception-${appError.code}-${appError.message}`
    if (shouldShowError(errorKey)) {
      showErrorToast(appError)
    }
  })

  // Network error handler for fetch requests
  const originalFetch = window.fetch
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args)

      // Handle HTTP error responses
      if (!response.ok) {
        const appError = categorizeError(
          new Error(`HTTP ${response.status}: ${response.statusText}`),
        )

        appError.details = {
          ...appError.details,
          status: response.status,
          statusText: response.statusText,
          url: args[0],
          method: args[1]?.method || 'GET',
        }

        logError(appError, {
          type: 'http-error',
          status: response.status,
          url: args[0],
        })

        // Don't show toast for 4xx errors (client errors) as they're usually handled by the app
        // Also don't show toasts for auth-related endpoints that commonly fail
        const isAuthEndpoint = args[0]?.toString().includes('/api/auth/')
        if (response.status >= 500 && !isAuthEndpoint) {
          const errorKey = `http-${response.status}-${args[0]}`
          if (shouldShowError(errorKey)) {
            showErrorToast(appError)
          }
        }
      }

      return response
    }
    catch (error) {
      const appError = categorizeError(error)

      appError.details = {
        ...appError.details,
        url: args[0],
        method: args[1]?.method || 'GET',
        type: 'network-error',
      }

      logError(appError, {
        type: 'network-error',
        url: args[0],
      })

      // Don't show toasts for auth-related endpoints that commonly fail
      // Also don't show toasts for AbortError (request cancellation is expected behavior)
      const isAuthEndpoint = args[0]?.toString().includes('/api/auth/')
      const isAbortError = error.name === 'AbortError' || appError.message.includes('Request aborted')
      const errorKey = `network-${args[0]}-${appError.message}`
      if (shouldShowError(errorKey) && !isAuthEndpoint && !isAbortError) {
        showErrorToast(appError)
      }

      throw error
    }
  }
})
