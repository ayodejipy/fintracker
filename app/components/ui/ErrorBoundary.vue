<script setup lang="ts">
import type { AppError } from '~/utils/error-handling'
import { onErrorCaptured, provide, ref } from 'vue'

interface Props {
  fallback?: boolean
  showDetails?: boolean
  onError?: (error: AppError) => void
}

const props = withDefaults(defineProps<Props>(), {
  fallback: true,
  showDetails: false,
})

const hasError = ref(false)
const error = ref<AppError | null>(null)
const { handleError, showErrorDetails } = useErrorHandler()

// Capture errors from child components
onErrorCaptured((err, instance, info) => {
  const appError = handleError(err, {
    component: instance?.$options?.name || 'Unknown',
    errorInfo: info,
    route: useRoute().path,
  }, {
    showToast: false, // Don't show toast, we'll handle it here
    global: false,
  })

  hasError.value = true
  error.value = appError

  // Call custom error handler if provided
  if (props.onError) {
    props.onError(appError)
  }

  // Prevent the error from propagating further
  return false
})

// Provide error state to child components
provide('errorBoundary', {
  hasError: readonly(hasError),
  error: readonly(error),
  retry: () => {
    hasError.value = false
    error.value = null
  },
})

function retry() {
  hasError.value = false
  error.value = null
}

function reportError() {
  if (error.value) {
    showErrorDetails(error.value)
  }
}
</script>

<template>
  <div>
    <!-- Error fallback UI -->
    <div v-if="hasError && fallback" class="error-boundary">
      <UCard class="max-w-2xl mx-auto">
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon
              name="i-heroicons-exclamation-triangle"
              class="w-6 h-6 text-red-500"
            />
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Something went wrong
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                An error occurred while rendering this component
              </p>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <!-- User-friendly error message -->
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p class="text-red-800 dark:text-red-200">
              {{ error ? getUserFriendlyMessage(error) : 'An unexpected error occurred' }}
            </p>
          </div>

          <!-- Error details (if enabled) -->
          <div v-if="showDetails && error" class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              Technical Details
            </h4>
            <div class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <div><strong>Type:</strong> {{ error.type }}</div>
              <div><strong>Message:</strong> {{ error.message }}</div>
              <div v-if="error.code">
                <strong>Code:</strong> {{ error.code }}
              </div>
              <div><strong>Time:</strong> {{ error.timestamp.toLocaleString() }}</div>
            </div>
          </div>

          <!-- Recovery suggestions -->
          <div v-if="error" class="space-y-2">
            <h4 class="font-medium text-gray-900 dark:text-white">
              What you can do:
            </h4>
            <ul class="space-y-1">
              <li
                v-for="(suggestion, index) in getRecoverySuggestions(error)"
                :key="index"
                class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <UIcon
                  name="i-heroicons-light-bulb"
                  class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
                />
                {{ suggestion }}
              </li>
            </ul>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-between">
            <UButton
              variant="ghost"
              icon="i-heroicons-flag"
              @click="reportError"
            >
              Report Issue
            </UButton>

            <div class="flex gap-2">
              <UButton
                variant="ghost"
                icon="i-heroicons-arrow-left"
                @click="$router.go(-1)"
              >
                Go Back
              </UButton>
              <UButton
                color="primary"
                icon="i-heroicons-arrow-path"
                @click="retry"
              >
                Try Again
              </UButton>
            </div>
          </div>
        </template>
      </UCard>
    </div>

    <!-- Normal content when no error -->
    <div v-else>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.error-boundary {
  padding: 2rem;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
