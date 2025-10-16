<script setup lang="ts">
import { formatCurrency } from '~/utils/currency'

interface Props {
  totalDebt: number
  totalMonthlyPayments: number
  activeLoansCount: number
  loading?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  loading: false,
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Total Debt -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Total Debt
          </p>
          <p v-if="loading" class="text-2xl font-bold text-gray-400">
            Loading...
          </p>
          <p v-else class="text-2xl font-bold text-red-600">
            {{ formatCurrency(totalDebt) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Monthly Payments -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <UIcon name="i-heroicons-calendar-days" class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Monthly Payments
          </p>
          <p v-if="loading" class="text-2xl font-bold text-gray-400">
            Loading...
          </p>
          <p v-else class="text-2xl font-bold text-blue-600">
            {{ formatCurrency(totalMonthlyPayments) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Active Loans -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Active Loans
          </p>
          <p v-if="loading" class="text-2xl font-bold text-gray-400">
            Loading...
          </p>
          <p v-else class="text-2xl font-bold text-green-600">
            {{ activeLoansCount }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
