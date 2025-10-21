<script setup lang="ts">
import { useDashboard } from '~/composables/useDashboard'
import IncomeByCategoryChart from '~/features/dashboard/components/IncomeByCategoryChart.vue'
import MonthSelector from '~/features/dashboard/components/MonthSelector.vue'
import { formatCurrency } from '~/utils/currency'
import { getCurrentMonth } from '~/utils/date'

// Meta
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

// Set page title
useHead({
  title: 'Income Analysis - Personal Finance Tracker',
})

// Month state
const selectedMonth = ref(getCurrentMonth())

// Dashboard composable with reactive month
const { dashboardData, loading } = useDashboard(selectedMonth)

// Computed properties for income insights
const topIncomeSource = computed(() => {
  if (!dashboardData.value?.income?.byCategory.length) { return null }
  return [...dashboardData.value.income.byCategory].sort((a, b) => b.amount - a.amount)[0]
})

const incomeGrowth = computed(() => {
  if (!dashboardData.value?.trends || dashboardData.value.trends.length < 2) { return null }
  const currentMonth = dashboardData.value.trends[dashboardData.value.trends.length - 1]
  const previousMonth = dashboardData.value.trends[dashboardData.value.trends.length - 2]

  if (!previousMonth.income || previousMonth.income === 0) { return null }

  const growth = ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100
  return {
    percentage: growth,
    isPositive: growth > 0,
    amount: currentMonth.income - previousMonth.income,
  }
})

// Get category metadata
const { categories, fetchCategories } = useCustomCategories()

onMounted(async () => {
  await fetchCategories('income')
})

function getCategoryMetadata(categoryValue: string) {
  const category = categories.value.find(c => c.value === categoryValue)
  return {
    name: category?.name || categoryValue,
    icon: category?.icon || '💰',
    color: category?.color || '#10B981',
    description: category?.description || 'Income source',
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Income Analysis
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Detailed breakdown of your income sources
        </p>
      </div>
      <NuxtLink
        to="/dashboard"
        class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        <span class="text-sm font-medium">Back to Dashboard</span>
      </NuxtLink>
    </div>

    <!-- Month Selector -->
    <MonthSelector v-model="selectedMonth" />

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Total Income -->
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-white" />
            </div>
          </div>
          <p class="text-sm text-green-700 dark:text-green-400 font-medium mb-1">
            Total Income
          </p>
          <p class="text-3xl font-bold text-green-900 dark:text-green-300">
            {{ formatCurrency(dashboardData?.income?.total || 0) }}
          </p>
        </div>

        <!-- Income Sources -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-white" />
            </div>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
            Income Sources
          </p>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ dashboardData?.income?.byCategory?.length || 0 }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Active this month
          </p>
        </div>

        <!-- Income Growth -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm">
              <UIcon name="i-heroicons-arrow-trending-up" class="w-6 h-6 text-white" />
            </div>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
            Month-over-Month
          </p>
          <div v-if="incomeGrowth" class="flex items-baseline gap-2">
            <p class="text-3xl font-bold" :class="incomeGrowth.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ incomeGrowth.isPositive ? '+' : '' }}{{ incomeGrowth.percentage.toFixed(1) }}%
            </p>
          </div>
          <p v-else class="text-3xl font-bold text-gray-400 dark:text-gray-500">
            N/A
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Compared to last month
          </p>
        </div>
      </div>

      <!-- Income Breakdown Chart -->
      <IncomeByCategoryChart
        :income="dashboardData?.income"
        :loading="loading"
      />

      <!-- Detailed Breakdown Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            All Income Sources
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete breakdown of income by category
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="category in dashboardData?.income?.byCategory"
                :key="category.category"
                class="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center"
                      :style="{ backgroundColor: `${getCategoryMetadata(category.category).color}20` }"
                    >
                      <span class="text-lg">{{ getCategoryMetadata(category.category).icon }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ getCategoryMetadata(category.category).name }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ getCategoryMetadata(category.category).description }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ formatCurrency(category.amount) }}
                  </p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <div class="flex items-center justify-end gap-2">
                    <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        class="h-2 rounded-full"
                        :style="{
                          width: `${category.percentage}%`,
                          backgroundColor: getCategoryMetadata(category.category).color,
                        }"
                      />
                    </div>
                    <span class="text-sm font-medium text-gray-900 dark:text-white w-12">
                      {{ Math.round(category.percentage) }}%
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="!dashboardData?.income?.byCategory?.length" class="p-8 text-center">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-heroicons-banknotes" class="w-8 h-8 text-gray-400" />
          </div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            No income data available for this month
          </p>
        </div>
      </div>

      <!-- Insights Section -->
      <div v-if="topIncomeSource" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Key Insight
            </h3>
            <p class="text-blue-700 dark:text-blue-400">
              Your primary income source this month is <strong>{{ getCategoryMetadata(topIncomeSource.category).name }}</strong>,
              accounting for <strong>{{ Math.round(topIncomeSource.percentage) }}%</strong> of your total income
              ({{ formatCurrency(topIncomeSource.amount) }}).
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
