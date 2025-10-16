<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard } from '~/composables/useDashboard'
import { formatCurrency } from '~/utils/currency'

// Composables
const { expenseBreakdown } = useDashboard()

// Color palette for categories
const categoryColors = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280', // gray
  '#F97316', // orange
  '#14B8A6', // teal
  '#84CC16', // lime
]

// Computed properties
const chartData = computed(() => {
  if (!expenseBreakdown.value?.byCategory) { return [] }

  return expenseBreakdown.value.byCategory.map((category, index) => ({
    ...category,
    color: categoryColors[index % categoryColors.length],
  }))
})

const hasData = computed(() => {
  return chartData.value.length > 0 && expenseBreakdown.value?.total > 0
})

const maxAmount = computed(() => {
  if (!hasData.value) { return 0 }
  return Math.max(...chartData.value.map(item => item.amount))
})
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">
        Expense Breakdown
      </h2>
      <div v-if="expenseBreakdown" class="text-sm text-gray-500">
        Total: {{ formatCurrency(expenseBreakdown.total) }}
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
        No expense data
      </h3>
      <p class="text-gray-500">
        Start adding transactions to see your expense breakdown.
      </p>
    </div>

    <div v-else class="space-y-4">
      <!-- Chart visualization -->
      <div class="space-y-3">
        <div
          v-for="category in chartData" :key="category.category"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: category.color }" />
            <div>
              <p class="font-medium text-gray-900">
                {{ category.category }}
              </p>
              <p class="text-sm text-gray-500">
                {{ category.percentage.toFixed(1) }}% of total
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="font-semibold text-gray-900">
              {{ formatCurrency(category.amount) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Bar chart representation -->
      <div class="mt-6">
        <h3 class="text-sm font-medium text-gray-700 mb-3">
          Visual Breakdown
        </h3>
        <div class="space-y-2">
          <div v-for="category in chartData" :key="`bar-${category.category}`" class="flex items-center gap-3">
            <div class="w-20 text-xs text-gray-600 truncate">
              {{ category.category }}
            </div>
            <div class="flex-1 bg-gray-200 rounded-full h-3 relative">
              <div
                class="h-3 rounded-full transition-all duration-500"
                :style="{
                  backgroundColor: category.color,
                  width: `${(category.amount / maxAmount) * 100}%`,
                }"
              />
            </div>
            <div class="w-16 text-xs text-gray-600 text-right">
              {{ category.percentage.toFixed(1) }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Summary stats -->
      <div class="mt-6 pt-4 border-t border-gray-200">
        <div class="grid grid-cols-2 gap-4 text-center">
          <div>
            <p class="text-sm text-gray-500">
              Categories
            </p>
            <p class="text-lg font-semibold text-gray-900">
              {{ chartData.length }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">
              Largest Category
            </p>
            <p class="text-lg font-semibold text-gray-900">
              {{ chartData[0]?.category || 'N/A' }}
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
