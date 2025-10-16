<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard } from '~/composables/useDashboard'
import { formatCurrency } from '~/utils/currency'

// Composables
const {
  financialOverview,
  currentMonthSummary,
  financialHealthScore,
  healthScoreColor,
  healthScoreText,
} = useDashboard()

// Computed properties
const netWorthColor = computed(() => {
  if (!financialOverview.value) { return 'gray' }
  return financialOverview.value.netWorth >= 0 ? 'green' : 'red'
})

const cashFlowColor = computed(() => {
  if (!currentMonthSummary.value) { return 'gray' }
  return currentMonthSummary.value.cashFlow >= 0 ? 'green' : 'red'
})

const healthScoreWidth = computed(() => {
  return `${financialHealthScore.value}%`
})
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">
        Financial Overview
      </h2>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">Health Score:</span>
        <span
          class="text-sm font-medium" :class="{
            'text-green-600': healthScoreColor === 'green',
            'text-yellow-600': healthScoreColor === 'yellow',
            'text-orange-600': healthScoreColor === 'orange',
            'text-red-600': healthScoreColor === 'red',
          }"
        >
          {{ financialHealthScore }}/100 ({{ healthScoreText }})
        </span>
      </div>
    </div>

    <!-- Health Score Bar -->
    <div class="mb-6">
      <div class="flex justify-between text-sm text-gray-600 mb-2">
        <span>Financial Health Score</span>
        <span>{{ financialHealthScore }}/100</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-3">
        <div
          class="h-3 rounded-full transition-all duration-500" :class="{
            'bg-green-500': healthScoreColor === 'green',
            'bg-yellow-500': healthScoreColor === 'yellow',
            'bg-orange-500': healthScoreColor === 'orange',
            'bg-red-500': healthScoreColor === 'red',
          }" :style="{ width: healthScoreWidth }"
        />
      </div>
    </div>

    <!-- Key Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Net Worth -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 font-medium">
              Net Worth
            </p>
            <p
              class="text-2xl font-bold" :class="{
                'text-green-600': netWorthColor === 'green',
                'text-red-600': netWorthColor === 'red',
                'text-gray-600': netWorthColor === 'gray',
              }"
            >
              {{ financialOverview ? formatCurrency(financialOverview.netWorth) : '₦0' }}
            </p>
          </div>
          <div
            class="p-2 rounded-full" :class="{
              'bg-green-100': netWorthColor === 'green',
              'bg-red-100': netWorthColor === 'red',
              'bg-gray-100': netWorthColor === 'gray',
            }"
          >
            <svg
              class="w-6 h-6" :class="{
                'text-green-600': netWorthColor === 'green',
                'text-red-600': netWorthColor === 'red',
                'text-gray-600': netWorthColor === 'gray',
              }" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Monthly Cash Flow -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 font-medium">
              Cash Flow
            </p>
            <p
              class="text-2xl font-bold" :class="{
                'text-green-600': cashFlowColor === 'green',
                'text-red-600': cashFlowColor === 'red',
                'text-gray-600': cashFlowColor === 'gray',
              }"
            >
              {{ currentMonthSummary ? formatCurrency(currentMonthSummary.cashFlow) : '₦0' }}
            </p>
          </div>
          <div
            class="p-2 rounded-full" :class="{
              'bg-green-100': cashFlowColor === 'green',
              'bg-red-100': cashFlowColor === 'red',
              'bg-gray-100': cashFlowColor === 'gray',
            }"
          >
            <svg
              class="w-6 h-6" :class="{
                'text-green-600': cashFlowColor === 'green',
                'text-red-600': cashFlowColor === 'red',
                'text-gray-600': cashFlowColor === 'gray',
              }" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Total Debt -->
      <div class="bg-red-50 p-4 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-red-600 font-medium">
              Total Debt
            </p>
            <p class="text-2xl font-bold text-red-700">
              {{ financialOverview ? formatCurrency(financialOverview.totalDebt) : '₦0' }}
            </p>
          </div>
          <div class="p-2 bg-red-100 rounded-full">
            <svg class="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Total Savings -->
      <div class="bg-green-50 p-4 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-green-600 font-medium">
              Total Savings
            </p>
            <p class="text-2xl font-bold text-green-700">
              {{ financialOverview ? formatCurrency(financialOverview.totalSavings) : '₦0' }}
            </p>
          </div>
          <div class="p-2 bg-green-100 rounded-full">
            <svg class="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Monthly Summary -->
    <div v-if="currentMonthSummary" class="mt-6 pt-6 border-t border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-4">
        This Month
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center">
          <p class="text-sm text-gray-500">
            Income
          </p>
          <p class="text-xl font-semibold text-green-600">
            {{ formatCurrency(currentMonthSummary.income) }}
          </p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-500">
            Expenses
          </p>
          <p class="text-xl font-semibold text-red-600">
            {{ formatCurrency(currentMonthSummary.expenses) }}
          </p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-500">
            Net Income
          </p>
          <p
            class="text-xl font-semibold" :class="{
              'text-green-600': currentMonthSummary.netIncome >= 0,
              'text-red-600': currentMonthSummary.netIncome < 0,
            }"
          >
            {{ formatCurrency(currentMonthSummary.netIncome) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
