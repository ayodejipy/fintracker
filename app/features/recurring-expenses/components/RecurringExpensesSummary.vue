<script setup lang="ts">
import type { RecurringExpenseSummary } from '~/types'
import { onMounted, ref } from 'vue'
import { formatCurrency } from '~/utils/currency'
import { useRecurringExpenses } from '../composables/useRecurringExpenses'

interface Props {
  totalMonthlyCommitments: number
  activeCount: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Composables
const { fetchRecurringExpensesSummary } = useRecurringExpenses()

// Local state
const summary = ref<RecurringExpenseSummary | null>(null)
const summaryLoading = ref(false)

// Load summary data
onMounted(async () => {
  try {
    summaryLoading.value = true
    summary.value = await fetchRecurringExpensesSummary()
  }
  catch (error) {
    console.error('Error loading summary:', error)
  }
  finally {
    summaryLoading.value = false
  }
})

// Computed
const disposableIncomeImpact = computed(() => {
  // This would ideally come from user's monthly income
  // For now, we'll show the percentage impact assuming a typical income
  const assumedMonthlyIncome = 500000 // ₦500k - could be fetched from user profile
  return props.totalMonthlyCommitments > 0
    ? (props.totalMonthlyCommitments / assumedMonthlyIncome) * 100
    : 0
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
        <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Monthly Commitments
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Your recurring expenses
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading || summaryLoading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>

    <!-- Summary Content -->
    <div v-else class="space-y-6">
      <!-- Total Monthly Commitments -->
      <div class="text-center">
        <p class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {{ formatCurrency(totalMonthlyCommitments) }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Total monthly commitments
        </p>
        <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
          {{ Math.round(disposableIncomeImpact) }}% of typical income
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-4">
        <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p class="text-xl font-bold text-blue-600 dark:text-blue-400">
            {{ activeCount }}
          </p>
          <p class="text-xs text-blue-700 dark:text-blue-300">
            Active Expenses
          </p>
        </div>

        <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p class="text-xl font-bold text-green-600 dark:text-green-400">
            {{ summary?.upcomingExpenses?.length || 0 }}
          </p>
          <p class="text-xs text-green-700 dark:text-green-300">
            Due Soon
          </p>
        </div>
      </div>

      <!-- Recurring vs Non-Recurring -->
      <div v-if="summary?.recurringVsNonRecurring" class="space-y-3">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Spending Breakdown
        </h4>

        <div class="space-y-2">
          <!-- Recurring -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Recurring</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(summary.recurringVsNonRecurring.recurring) }}
            </span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-blue-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${summary.recurringVsNonRecurring.recurringPercentage}%` }"
            />
          </div>

          <!-- Non-Recurring -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Non-Recurring</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(summary.recurringVsNonRecurring.nonRecurring) }}
            </span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="bg-purple-500 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${100 - summary.recurringVsNonRecurring.recurringPercentage}%` }"
            />
          </div>
        </div>

        <!-- Percentage Display -->
        <div class="text-center pt-2">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ Math.round(summary.recurringVsNonRecurring.recurringPercentage) }}% of your expenses are recurring
          </p>
        </div>
      </div>

      <!-- Insight -->
      <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h5 class="text-sm font-medium text-yellow-900 dark:text-yellow-300 mb-1">
              Financial Insight
            </h5>
            <p class="text-sm text-yellow-700 dark:text-yellow-400">
              Your recurring expenses represent a significant portion of your monthly budget.
              Consider reviewing these commitments regularly to optimize your cash flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
