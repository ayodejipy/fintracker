<script setup lang="ts">
import { computed } from 'vue'

// Props interface
interface Props {
  totalBudget?: number
  totalSpent?: number
  utilization?: number
  remaining?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  totalBudget: 0,
  totalSpent: 0,
  utilization: 0,
  remaining: 0,
  loading: false,
})

const budgetStatus = computed(() => {
  if (props.utilization <= 70) {
    return {
      text: 'On Track',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500',
    }
  }
  if (props.utilization <= 90) {
    return {
      text: 'Warning',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500',
    }
  }
  if (props.utilization <= 100) {
    return {
      text: 'Critical',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500',
    }
  }
  return {
    text: 'Over Budget',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500',
  }
})

const utilizationPercentage = computed(() => {
  return Math.min(100, Math.max(0, props.utilization))
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Budget Status
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
            Monthly budget tracking
          </p>
        </div>
      </div>
      <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 dark:bg-gray-700/50 rounded">
        <svg class="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>

    <div class="space-y-3">
      <div v-if="loading" class="animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
      </div>
      <div v-else>
        <CurrencyDisplay :amount="totalSpent" size="xl" weight="bold" class="text-gray-900 dark:text-white" />
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">of</span>
          <CurrencyDisplay :amount="totalBudget" size="sm" weight="medium" class="text-gray-600 dark:text-gray-400 dark:text-gray-500" />
          <span class="text-sm font-medium" :class="budgetStatus.color">
            ({{ budgetStatus.text }})
          </span>
        </div>

        <!-- Budget Progress Bar -->
        <div class="mt-3">
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">
            <span>Utilization</span>
            <span>{{ Math.round(utilization) }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              :class="budgetStatus.bgColor"
              class="h-2 rounded-full transition-all duration-300"
              :style="{ width: `${utilizationPercentage}%` }"
            />
          </div>
        </div>

        <!-- Remaining Budget -->
        <div class="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Remaining:</span>
            <CurrencyDisplay
              :amount="remaining"
              size="sm"
              weight="bold"
              :class="remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
