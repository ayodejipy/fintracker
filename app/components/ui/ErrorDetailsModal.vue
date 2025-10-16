<script setup lang="ts">
import type { AppError } from '~/utils/error-handling'

interface Props {
  modelValue: boolean
  error: AppError
  suggestions: string[]
  userFriendlyMessage: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'retry'): void
  (e: 'report'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const showTechnicalDetails = ref(false)

const severityColor = computed(() => {
  switch (props.error.severity) {
    case 'critical': return 'red'
    case 'high': return 'orange'
    case 'medium': return 'yellow'
    case 'low': return 'blue'
    default: return 'gray'
  }
})

const severityIcon = computed(() => {
  switch (props.error.severity) {
    case 'critical': return 'i-heroicons-exclamation-triangle'
    case 'high': return 'i-heroicons-exclamation-circle'
    case 'medium': return 'i-heroicons-information-circle'
    case 'low': return 'i-heroicons-light-bulb'
    default: return 'i-heroicons-question-mark-circle'
  }
})

async function copyErrorDetails() {
  const errorDetails = {
    type: props.error.type,
    message: props.error.message,
    code: props.error.code,
    timestamp: props.error.timestamp,
    details: props.error.details,
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
    useToast().add({
      title: 'Copied',
      description: 'Error details copied to clipboard',
      color: 'green',
    })
  }
  catch (err) {
    console.error('Failed to copy error details:', err)
  }
}

function reportError() {
  emit('report')
  // In a real app, this might open a support ticket or send error report
  useToast().add({
    title: 'Error Reported',
    description: 'Thank you for reporting this issue. Our team will investigate.',
    color: 'blue',
  })
}

function retryAction() {
  emit('retry')
  isOpen.value = false
}
</script>

<template>
  <UModal v-model="isOpen" :close="true" :dismissible="true" :ui="{ width: 'sm:max-w-2xl' }">
    <template #header>
      <div class="flex items-center gap-3">
        <UIcon
          :name="severityIcon"
          :class="`w-6 h-6 text-${severityColor}-500`"
        />
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Error Details
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {{ error.severity }} severity • {{ error.type.replace('_', ' ') }}
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- User-friendly message -->
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 class="font-medium text-gray-900 dark:text-white mb-2">
            What happened?
          </h4>
          <p class="text-gray-700 dark:text-gray-300">
            {{ userFriendlyMessage }}
          </p>
        </div>

        <!-- Suggestions -->
        <div v-if="suggestions.length > 0">
          <h4 class="font-medium text-gray-900 dark:text-white mb-3">
            What can you do?
          </h4>
          <ul class="space-y-2">
            <li
              v-for="(suggestion, index) in suggestions"
              :key="index"
              class="flex items-start gap-2"
            >
              <UIcon
                name="i-heroicons-light-bulb"
                class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ suggestion }}
              </span>
            </li>
          </ul>
        </div>

        <!-- Technical details (collapsible) -->
        <div>
          <UButton
            variant="ghost"
            size="sm"
            class="mb-3"
            @click="showTechnicalDetails = !showTechnicalDetails"
          >
            <UIcon
              :name="showTechnicalDetails ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
              class="w-4 h-4 mr-1"
            />
            Technical Details
          </UButton>

          <div v-if="showTechnicalDetails" class="bg-gray-900 rounded-lg p-4 text-sm">
            <div class="text-gray-300 space-y-2 font-mono">
              <div><span class="text-gray-500">Type:</span> {{ error.type }}</div>
              <div><span class="text-gray-500">Message:</span> {{ error.message }}</div>
              <div v-if="error.code">
                <span class="text-gray-500">Code:</span> {{ error.code }}
              </div>
              <div><span class="text-gray-500">Time:</span> {{ error.timestamp.toISOString() }}</div>
              <div v-if="error.requestId">
                <span class="text-gray-500">Request ID:</span> {{ error.requestId }}
              </div>

              <div v-if="error.details" class="mt-3">
                <div class="text-gray-500 mb-1">
                  Details:
                </div>
                <pre class="text-xs text-gray-400 whitespace-pre-wrap">{{ JSON.stringify(error.details, null, 2) }}</pre>
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-gray-700">
              <UButton
                variant="ghost"
                size="xs"
                icon="i-heroicons-clipboard"
                @click="copyErrorDetails"
              >
                Copy Details
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between">
        <div class="flex gap-2">
          <UButton
            variant="ghost"
            icon="i-heroicons-flag"
            @click="reportError"
          >
            Report Issue
          </UButton>
        </div>

        <div class="flex gap-2">
          <UButton
            variant="ghost"
            @click="isOpen = false"
          >
            Close
          </UButton>
          <UButton
            color="primary"
            icon="i-heroicons-arrow-path"
            @click="retryAction"
          >
            Try Again
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
