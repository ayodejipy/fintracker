<script setup lang="ts">
import { getStatusDescription, getStepClass, getStepIconClass, getStepLabelClass, PROCESSING_STEPS } from '../utils/progressHelpers'

// Props
interface Props {
  uploadStatus: string
  uploadProgress: number
  fileName?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="space-y-4">
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
      <div class="flex items-center gap-3 mb-4">
        <div class="animate-spin">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-blue-600" />
        </div>
        <div class="flex-1">
          <span class="text-sm font-semibold text-blue-900 dark:text-blue-100 block">
            {{ props.uploadStatus }}
          </span>
          <span class="text-xs text-blue-700 dark:text-blue-300 mt-1 block">
            {{ getStatusDescription(props.uploadProgress) }}
          </span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-blue-200 dark:bg-blue-900/40 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          class="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500 ease-out rounded-full"
          :style="{ width: `${uploadProgress}%` }"
        />
      </div>

      <div class="mt-3 flex items-center justify-between">
        <span class="text-xs text-blue-700 dark:text-blue-300 font-medium">
          {{ props.uploadProgress }}% Complete
        </span>
        <span v-if="fileName" class="text-xs text-blue-600 dark:text-blue-400">
          {{ props.fileName }}
        </span>
      </div>
    </div>

    <!-- Processing Steps Indicator -->
    <div class="grid grid-cols-4 gap-2">
      <div
        v-for="(step, index) in PROCESSING_STEPS"
        :key="index"
        class="flex flex-col items-center gap-2 p-3 rounded-lg transition-all"
        :class="getStepClass(step.progress, uploadProgress)"
      >
        <UIcon
          :name="step.icon"
          class="w-5 h-5 transition-colors"
          :class="getStepIconClass(step.progress, uploadProgress)"
        />
        <span
          class="text-xs text-center font-medium"
          :class="getStepLabelClass(step.progress, uploadProgress)"
        >
          {{ step.label }}
        </span>
      </div>
    </div>
  </div>
</template>
