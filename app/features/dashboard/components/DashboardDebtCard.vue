<script setup lang="ts">
import { computed } from 'vue'

// Props interface
interface Props {
  totalDebt?: number
  monthlyPayments?: number
  activeLoans?: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  totalDebt: 0,
  monthlyPayments: 0,
  activeLoans: 0,
  loading: false,
})

const { calculateContextualGrowth } = useCurrency()

// Calculate previous month debt (estimated - assuming payments reduce debt)
const previousMonthDebt = computed(() => {
  return props.totalDebt + props.monthlyPayments
})

const debtChange = computed(() => {
  return calculateContextualGrowth(props.totalDebt, previousMonthDebt.value, 'negative')
})

const debtStatus = computed(() => {
  if (props.totalDebt === 0) { return { text: 'Debt Free', color: 'text-green-600 dark:text-green-400' } }
  if (props.totalDebt < 100000) { return { text: 'Low Debt', color: 'text-yellow-600 dark:text-yellow-400' } }
  if (props.totalDebt < 500000) { return { text: 'Moderate Debt', color: 'text-orange-600 dark:text-orange-400' } }
  return { text: 'High Debt', color: 'text-red-600 dark:text-red-400' }
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <div class="flex items-start justify-between mb-4">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Total Debt
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
            {{ activeLoans }} active loans
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
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" />
      </div>
      <div v-else>
        <CurrencyDisplay :amount="totalDebt" size="xl" weight="bold" class="text-gray-900 dark:text-white" />
        <div v-if="debtChange.showIndicator" class="flex items-center gap-2">
          <div
            class="flex items-center gap-1"
            :class="debtChange.isGood ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            <UIcon
              :name="debtChange.isPositive ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
              class="w-4 h-4"
            />
            <span class="text-sm font-medium">
              {{ debtChange.percentage }}%
            </span>
          </div>
          <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            {{ debtChange.isPositive ? 'increase' : 'decrease' }} this month
          </span>
        </div>
        <div v-else-if="totalDebt === 0" class="flex items-center gap-2">
          <div class="flex items-center gap-1 text-green-600 dark:text-green-400">
            <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
            <span class="text-sm font-medium">Debt Free!</span>
          </div>
        </div>
        <div v-else class="flex items-center gap-2">
          <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">No change this month</span>
        </div>

        <!-- Debt Status & Monthly Payment -->
        <div class="mt-3 space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Status:</span>
            <span class="text-sm font-medium" :class="debtStatus.color">
              {{ debtStatus.text }}
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Monthly Payment:</span>
            <CurrencyDisplay :amount="monthlyPayments" size="sm" weight="medium" class="text-gray-900 dark:text-white" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
