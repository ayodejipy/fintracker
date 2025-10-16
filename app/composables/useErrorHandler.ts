import type { AppError } from '~/utils/error-handling'
import { computed, ref } from 'vue'
import {

  categorizeError,
  ErrorSeverity,
  getRecoverySuggestions,
  getUserFriendlyMessage,
  logError,
} from '~/utils/error-handling'

// Global error state
const globalErrors = ref<AppError[]>([])
const isLoading = ref(false)

export function useErrorHandler() {
  // Local error state for component-specific errors
  const localErrors = ref<AppError[]>([])

  // Computed properties
  const hasErrors = computed(() => localErrors.value.length > 0)
  const hasGlobalErrors = computed(() => globalErrors.value.length > 0)
  const criticalErrors = computed(() =>
    localErrors.value.filter(error => error.severity === ErrorSeverity.CRITICAL),
  )

  // Show detailed error information
  const showErrorDetails = (error: AppError) => {
    const modal = useModal()
    const suggestions = getRecoverySuggestions(error)

    modal.open({
      component: 'ErrorDetailsModal',
      props: {
        error,
        suggestions,
        userFriendlyMessage: getUserFriendlyMessage(error),
      },
    })
  }

  // Show error toast
  const showErrorToast = (error: AppError) => {
    const toast = useToast()
    const message = getUserFriendlyMessage(error)
    const suggestions = getRecoverySuggestions(error)

    toast.add({
      title: 'Error',
      description: message,
      color: error.severity === ErrorSeverity.CRITICAL ? 'red' : 'orange',
      timeout: error.severity === ErrorSeverity.CRITICAL ? 0 : 5000, // Critical errors don't auto-dismiss
      actions: suggestions.length > 0
        ? [{
            label: 'Help',
            click: () => showErrorDetails(error),
          }]
        : undefined,
    })
  }

  // Handle error function
  const handleError = (
    error: unknown,
    context?: Record<string, any>,
    options?: {
      showToast?: boolean
      global?: boolean
      silent?: boolean
    },
  ) => {
    const appError = categorizeError(error)

    // Add context information
    if (context) {
      appError.details = { ...appError.details, ...context }
    }

    // Log the error
    logError(appError, context)

    // Add to appropriate error store
    if (options?.global) {
      globalErrors.value.push(appError)
    }
    else {
      localErrors.value.push(appError)
    }

    // Show toast notification if requested
    if (options?.showToast !== false && !options?.silent) {
      showErrorToast(appError)
    }

    return appError
  }

  // Clear errors
  const clearErrors = () => {
    localErrors.value = []
  }

  const clearGlobalErrors = () => {
    globalErrors.value = []
  }

  const clearError = (index: number) => {
    localErrors.value.splice(index, 1)
  }

  // Retry mechanism
  const withRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
  ): Promise<T> => {
    let lastError: unknown

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      }
      catch (error) {
        lastError = error

        if (attempt === maxRetries) {
          throw error
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }

    throw lastError
  }

  // Safe async operation wrapper
  const safeAsync = async <T>(
    operation: () => Promise<T>,
    options?: {
      showToast?: boolean
      global?: boolean
      silent?: boolean
      context?: Record<string, any>
      fallback?: T
    },
  ): Promise<T | undefined> => {
    try {
      isLoading.value = true
      return await operation()
    }
    catch (error) {
      handleError(error, options?.context, {
        showToast: options?.showToast,
        global: options?.global,
        silent: options?.silent,
      })
      return options?.fallback
    }
    finally {
      isLoading.value = false
    }
  }

  // Form validation helper
  const validateForm = <T>(
    data: T,
    schema: any, // Zod schema
    options?: {
      showToast?: boolean
      context?: Record<string, any>
    },
  ): { isValid: boolean, errors?: AppError, data?: T } => {
    try {
      const validatedData = schema.parse(data)
      return { isValid: true, data: validatedData }
    }
    catch (error) {
      const appError = handleError(error, options?.context, {
        showToast: options?.showToast,
        silent: false,
      })
      return { isValid: false, errors: appError }
    }
  }

  // API call wrapper with error handling
  const apiCall = async <T>(
    url: string,
    options?: RequestInit & {
      showToast?: boolean
      context?: Record<string, any>
      retries?: number
    },
  ): Promise<T | undefined> => {
    const operation = async () => {
      const response = await $fetch<T>(url, options)
      return response
    }

    if (options?.retries && options.retries > 1) {
      return safeAsync(() => withRetry(operation, options.retries), {
        showToast: options.showToast,
        context: { url, ...options.context },
      })
    }

    return safeAsync(operation, {
      showToast: options.showToast,
      context: { url, ...options.context },
    })
  }

  // Error boundary for components
  const errorBoundary = (error: unknown, instance: any) => {
    handleError(error, {
      component: instance?.$options?.name || 'Unknown',
      route: useRoute().path,
    }, {
      global: true,
      showToast: true,
    })
  }

  return {
    // State
    localErrors: readonly(localErrors),
    globalErrors: readonly(globalErrors),
    isLoading: readonly(isLoading),

    // Computed
    hasErrors,
    hasGlobalErrors,
    criticalErrors,

    // Methods
    handleError,
    showErrorToast,
    showErrorDetails,
    clearErrors,
    clearGlobalErrors,
    clearError,
    withRetry,
    safeAsync,
    validateForm,
    apiCall,
    errorBoundary,
  }
}
