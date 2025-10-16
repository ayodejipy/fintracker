<script setup lang="ts">
import { computed } from 'vue'

// Props interface
interface Props {
  expenses?: number
  monthlyTrends?: readonly {
    readonly month: string
    readonly income: number
    readonly expenses: number
    readonly netIncome: number
  }[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  expenses: 0,
  monthlyTrends: () => [],
  loading: false,
})

const { calculateContextualGrowth } = useCurrency()

const totalSpending = computed(() => {
  return props.expenses || 0
})

const previousMonthSpending = computed(() => {
  if (!props.monthlyTrends || props.monthlyTrends.length < 2) {
    // Fallback: assume 3% decrease in spending if no historical data
    return totalSpending.value * 1.03
  }

  // Get previous month's expenses from trends
  const previousMonth = props.monthlyTrends[props.monthlyTrends.length - 2]
  return previousMonth?.expenses || totalSpending.value * 1.03
})

const spendingGrowth = computed(() => {
  return calculateContextualGrowth(totalSpending.value, previousMonthSpending.value, 'negative')
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Total Spending
          </h3>
        </div>
      </div>
      <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 dark:bg-gray-700/50 rounded">
        <svg class="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
    </div>

    <div class="space-y-2">
      <div v-if="loading" class="animate-pulse">
        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
      </div>
      <div v-else>
        <CurrencyDisplay
          :amount="totalSpending"
          size="xl"
          weight="bold"
          class="text-gray-900 dark:text-white"
        />
        <div v-if="spendingGrowth.showIndicator" class="flex items-center gap-2">
          <div
            class="flex items-center gap-1"
            :class="spendingGrowth.isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            <UIcon
              :name="spendingGrowth.isPositive ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
              class="w-4 h-4"
            />
            <span class="text-sm font-medium">
              {{ spendingGrowth.percentage }}%
            </span>
          </div>
          <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            {{ spendingGrowth.isPositive ? 'increase' : 'decrease' }} from last month
          </span>
        </div>
        <div v-else class="flex items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">No change from last month</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
