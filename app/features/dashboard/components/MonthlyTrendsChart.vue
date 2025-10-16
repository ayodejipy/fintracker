<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard } from '~/composables/useDashboard'
import { formatCurrency } from '~/utils/currency'

// Composables
const { monthlyTrends } = useDashboard()

// Computed properties
const hasData = computed(() => {
  return monthlyTrends.value && monthlyTrends.value.length > 0
})

const chartData = computed(() => {
  if (!hasData.value) { return [] }
  return monthlyTrends.value
})

const maxValue = computed(() => {
  if (!hasData.value) { return 0 }
  const allValues = chartData.value.flatMap(month => [
    month.income,
    month.expenses,
    Math.abs(month.netIncome),
  ])
  return Math.max(...allValues)
})

function getMonthName(monthStr: string) {
  const date = new Date(`${monthStr}-01`)
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function getBarHeight(value: number) {
  if (maxValue.value === 0) { return '0%' }
  return `${(Math.abs(value) / maxValue.value) * 100}%`
}

function getNetIncomeColor(netIncome: number) {
  return netIncome >= 0 ? 'bg-green-500' : 'bg-red-500'
}

function getNetIncomeTextColor(netIncome: number) {
  return netIncome >= 0 ? 'text-green-600' : 'text-red-600'
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">
        Monthly Trends
      </h2>
      <div v-if="hasData" class="text-sm text-gray-500">
        Last {{ chartData.length }} months
      </div>
    </div>

    <div v-if="!hasData" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No trend data
      </h3>
      <p class="text-gray-500">
        Add more transactions to see monthly trends.
      </p>
    </div>

    <div v-else class="space-y-6">
      <!-- Chart -->
      <div class="relative">
        <div class="flex items-end justify-between h-64 gap-2">
          <div
            v-for="month in chartData" :key="month.month"
            class="flex-1 flex flex-col items-center gap-2"
          >
            <!-- Bars -->
            <div class="flex items-end gap-1 h-48 w-full">
              <!-- Income Bar -->
              <div
                class="flex-1 bg-green-200 rounded-t relative"
                :style="{ height: getBarHeight(month.income) }"
              >
                <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-green-600 font-medium whitespace-nowrap">
                  {{ month.income > 0 ? formatCurrency(month.income) : '' }}
                </div>
              </div>

              <!-- Expenses Bar -->
              <div
                class="flex-1 bg-red-200 rounded-t relative"
                :style="{ height: getBarHeight(month.expenses) }"
              >
                <div class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-red-600 font-medium whitespace-nowrap">
                  {{ month.expenses > 0 ? formatCurrency(month.expenses) : '' }}
                </div>
              </div>

              <!-- Net Income Bar -->
              <div
                class="flex-1 rounded-t relative"
                :class="getNetIncomeColor(month.netIncome)"
                :style="{ height: getBarHeight(month.netIncome) }"
              >
                <div
                  class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap"
                  :class="getNetIncomeTextColor(month.netIncome)"
                >
                  {{ formatCurrency(month.netIncome) }}
                </div>
              </div>
            </div>

            <!-- Month Label -->
            <div class="text-xs text-gray-600 font-medium">
              {{ getMonthName(month.month) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex items-center justify-center gap-6 text-sm">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-green-200 rounded" />
          <span class="text-gray-600">Income</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-red-200 rounded" />
          <span class="text-gray-600">Expenses</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 bg-blue-500 rounded" />
          <span class="text-gray-600">Net Income</span>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="pt-4 border-t border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-sm text-gray-500">
              Avg Monthly Income
            </p>
            <p class="text-lg font-semibold text-green-600">
              {{ formatCurrency(chartData.reduce((sum, m) => sum + m.income, 0) / chartData.length) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">
              Avg Monthly Expenses
            </p>
            <p class="text-lg font-semibold text-red-600">
              {{ formatCurrency(chartData.reduce((sum, m) => sum + m.expenses, 0) / chartData.length) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">
              Avg Net Income
            </p>
            <p
              class="text-lg font-semibold" :class="getNetIncomeTextColor(
                chartData.reduce((sum, m) => sum + m.netIncome, 0) / chartData.length,
              )"
            >
              {{ formatCurrency(chartData.reduce((sum, m) => sum + m.netIncome, 0) / chartData.length) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
