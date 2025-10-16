<script setup lang="ts">
import { computed } from 'vue'

// Props interface
interface Props {
  monthlyIncome?: number
  netIncome?: number
  monthlyTrends?: readonly {
    readonly month: string
    readonly income: number
    readonly expenses: number
    readonly netIncome: number
  }[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  monthlyIncome: 0,
  netIncome: 0,
  monthlyTrends: () => [],
  loading: false,
})

const { calculateContextualGrowth } = useCurrency()

// Calculate previous month income from trends
const previousMonthIncome = computed(() => {
  if (!props.monthlyTrends || props.monthlyTrends.length < 2) {
    // Fallback: assume 2% growth if no historical data
    return props.monthlyIncome * 0.98
  }

  // Get previous month's income from trends
  const previousMonth = props.monthlyTrends[props.monthlyTrends.length - 2]
  return previousMonth?.income || props.monthlyIncome * 0.98
})

const incomeGrowth = computed(() => {
  return calculateContextualGrowth(props.monthlyIncome, previousMonthIncome.value, 'positive')
})

const incomeStatus = computed(() => {
  const ratio = props.netIncome / props.monthlyIncome
  if (ratio >= 0.3) { return { text: 'Excellent', color: 'text-green-600' } }
  if (ratio >= 0.2) { return { text: 'Good', color: 'text-blue-600' } }
  if (ratio >= 0.1) { return { text: 'Fair', color: 'text-yellow-600' } }
  return { text: 'Needs Attention', color: 'text-red-600' }
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
            Monthly Income
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-500">
            Current month earnings
          </p>
        </div>
      </div>
      <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
        <svg class="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>

    <div class="space-y-3">
      <div v-if="loading" class="animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
      </div>
      <div v-else>
        <CurrencyDisplay :amount="monthlyIncome" size="xl" weight="bold" class="text-gray-900 dark:text-white" />
        <div v-if="incomeGrowth.showIndicator" class="flex items-center gap-2">
          <div
            class="flex items-center gap-1"
            :class="incomeGrowth.isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            <UIcon
              :name="incomeGrowth.isPositive ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
              class="w-4 h-4"
            />
            <span class="text-sm font-medium">
              {{ incomeGrowth.isPositive ? '+' : '-' }}{{ incomeGrowth.percentage }}%
            </span>
          </div>
          <span class="text-sm text-gray-500 dark:text-gray-400">from last month</span>
        </div>
        <div v-else class="flex items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">Stable income</span>
        </div>

        <!-- Income Details -->
        <div class="mt-3 space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">Net Income:</span>
            <CurrencyDisplay :amount="netIncome" size="sm" weight="medium" class="text-gray-900 dark:text-white" />
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">Savings Rate:</span>
            <span class="text-sm font-medium" :class="incomeStatus.color">
              {{ incomeStatus.text }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
