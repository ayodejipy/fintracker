<script setup lang="ts">
import { computed } from 'vue'

// Props interface
interface Props {
  netWorth?: number
  monthlyTrends?: readonly {
    readonly month: string
    readonly income: number
    readonly expenses: number
    readonly netIncome: number
  }[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  netWorth: 0,
  monthlyTrends: () => [],
  loading: false,
})

const { calculateContextualGrowth } = useCurrency()

// Use net worth from props
const totalBalance = computed(() => {
  return props.netWorth || 0
})

// Calculate previous month's net worth from trends data
const previousMonthBalance = computed(() => {
  if (!props.monthlyTrends || props.monthlyTrends.length < 2) {
    // Fallback: assume 5% growth if no historical data
    return totalBalance.value * 0.95
  }

  // Get the second-to-last month's net income as a proxy for net worth change
  const previousMonth = props.monthlyTrends[props.monthlyTrends.length - 2]
  const currentMonth = props.monthlyTrends[props.monthlyTrends.length - 1]

  if (!previousMonth || !currentMonth) {
    // Fallback if data is incomplete
    return totalBalance.value * 0.95
  }

  // Estimate previous net worth based on the difference in net income
  const netIncomeChange = currentMonth.netIncome - previousMonth.netIncome
  return totalBalance.value - netIncomeChange
})

const balanceGrowth = computed(() => {
  return calculateContextualGrowth(totalBalance.value, previousMonthBalance.value, 'positive')
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">
            Net Worth
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-500">
            Assets - Liabilities
          </p>
        </div>
      </div>
      <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded transition-colors">
        <svg class="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>
    </div>

    <div class="space-y-2">
      <div v-if="loading" class="animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      </div>
      <div v-else>
        <CurrencyDisplay :amount="totalBalance" size="xl" weight="bold" class="text-gray-900 dark:text-white" />
        <div v-if="balanceGrowth.showIndicator" class="flex items-center gap-2">
          <div
            class="flex items-center gap-1"
            :class="balanceGrowth.isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            <UIcon
              :name="balanceGrowth.isPositive ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
              class="w-4 h-4"
            />
            <span class="text-sm font-medium">
              {{ balanceGrowth.isPositive ? '+' : '-' }}{{ balanceGrowth.percentage }}%
            </span>
          </div>
          <span class="text-sm text-gray-500 dark:text-gray-400">from last month</span>
        </div>
        <div v-else class="flex items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">No change from last month</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
