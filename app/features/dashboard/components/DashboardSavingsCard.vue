<script setup lang="ts">
import { computed } from 'vue'

// Props interface
interface Props {
  totalSavings?: number
  savingsProgress?: number
  activeGoals?: number
  monthlyContributions?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  totalSavings: 0,
  savingsProgress: 0,
  activeGoals: 0,
  monthlyContributions: 0,
  loading: false,
})

const { calculateContextualGrowth } = useCurrency()

// Calculate previous month savings (estimated)
const previousMonthSavings = computed(() => {
  return Math.max(0, props.totalSavings - props.monthlyContributions)
})

const savingsGrowth = computed(() => {
  return calculateContextualGrowth(props.totalSavings, previousMonthSavings.value, 'positive')
})

const progressColor = computed(() => {
  if (props.savingsProgress >= 80) { return 'bg-green-500' }
  if (props.savingsProgress >= 50) { return 'bg-blue-500' }
  if (props.savingsProgress >= 25) { return 'bg-yellow-500' }
  return 'bg-gray-300'
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Total Savings
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
            {{ activeGoals }} active goals
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
        <CurrencyDisplay :amount="totalSavings" size="xl" weight="bold" class="text-gray-900 dark:text-white" />
        <div v-if="savingsGrowth.showIndicator" class="flex items-center gap-2">
          <div
            class="flex items-center gap-1"
            :class="savingsGrowth.isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            <UIcon
              :name="savingsGrowth.isPositive ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
              class="w-4 h-4"
            />
            <span class="text-sm font-medium">
              {{ savingsGrowth.isPositive ? '+' : '-' }}{{ savingsGrowth.percentage }}%
            </span>
          </div>
          <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">this month</span>
        </div>
        <div v-else class="flex items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Steady savings</span>
        </div>

        <!-- Progress Bar -->
        <div class="mt-3">
          <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">
            <span>Progress</span>
            <span>{{ Math.round(savingsProgress) }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              :class="progressColor"
              class="h-2 rounded-full transition-all duration-300"
              :style="{ width: `${Math.min(100, savingsProgress)}%` }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
