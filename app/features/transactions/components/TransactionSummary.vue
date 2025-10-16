<script setup lang="ts">
import { formatCurrency } from '~/utils/currency'

interface Props {
  totalIncome: number
  totalExpenses: number
  netAmount: number
  loading?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  loading: false,
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Total Income -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Total Income
          </p>
          <p v-if="loading" class="text-2xl font-bold text-gray-400 dark:text-gray-500">
            Loading...
          </p>
          <p v-else class="text-2xl font-bold text-green-600">
            {{ formatCurrency(totalIncome) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Total Expenses -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <UIcon name="i-heroicons-arrow-trending-down" class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Total Expenses
          </p>
          <p v-if="loading" class="text-2xl font-bold text-gray-400 dark:text-gray-500">
            Loading...
          </p>
          <p v-else class="text-2xl font-bold text-red-600">
            {{ formatCurrency(totalExpenses) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Net Amount -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-white" />
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Net Amount
          </p>
          <p v-if="loading" class="text-2xl font-bold text-gray-400 dark:text-gray-500">
            Loading...
          </p>
          <p v-else class="text-2xl font-bold" :class="netAmount >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatCurrency(netAmount) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
