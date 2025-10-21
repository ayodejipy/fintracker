<script setup lang="ts">
import { useDashboard } from '~/composables/useDashboard'
import SpendingByCategoryChart from '~/features/dashboard/components/SpendingByCategoryChart.vue'
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
  title: 'Expense Analysis - Personal Finance Tracker',
})

// Month state
const selectedMonth = ref(getCurrentMonth())

// Dashboard composable with reactive month
const { dashboardData, loading } = useDashboard(selectedMonth)

// Computed properties for expense insights
const topExpenseCategory = computed(() => {
  if (!dashboardData.value?.expenses?.byCategory.length) return null
  return [...dashboardData.value.expenses.byCategory].sort((a, b) => b.amount - a.amount)[0]
})

const expenseGrowth = computed(() => {
  if (!dashboardData.value?.trends || dashboardData.value.trends.length < 2) return null
  const currentMonth = dashboardData.value.trends[dashboardData.value.trends.length - 1]
  const previousMonth = dashboardData.value.trends[dashboardData.value.trends.length - 2]

  if (!previousMonth.expenses || previousMonth.expenses === 0) return null

  const growth = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100
  return {
    percentage: growth,
    isPositive: growth > 0,
    amount: currentMonth.expenses - previousMonth.expenses,
  }
})

const savingsRate = computed(() => {
  if (!dashboardData.value?.currentMonth) return null
  const { income, expenses } = dashboardData.value.currentMonth
  if (!income || income === 0) return null

  const saved = income - expenses
  const rate = (saved / income) * 100

  return {
    percentage: rate,
    amount: saved,
    isPositive: rate > 0,
  }
})

// Get category metadata
const { categories, fetchCategories } = useCustomCategories()

onMounted(async () => {
  // Fetch both expense and fee categories since fees show in expense breakdown
  await Promise.all([
    fetchCategories('expense'),
    fetchCategories('fee'),
  ])
})

const getCategoryMetadata = (categoryValue: string) => {
  const category = categories.value.find(c => c.value === categoryValue)
  return {
    name: category?.name || categoryValue,
    icon: category?.icon || '📦',
    color: category?.color || '#6B7280',
    description: category?.description || 'Expense category',
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Expense Analysis
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Detailed breakdown of your spending patterns
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
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Total Expenses -->
        <div class="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
              <UIcon name="i-heroicons-arrow-trending-down" class="w-6 h-6 text-white" />
            </div>
          </div>
          <p class="text-sm text-red-700 dark:text-red-400 font-medium mb-1">
            Total Expenses
          </p>
          <p class="text-3xl font-bold text-red-900 dark:text-red-300">
            {{ formatCurrency(dashboardData?.expenses?.total || 0) }}
          </p>
        </div>

        <!-- Expense Categories -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-sm">
              <UIcon name="i-heroicons-chart-pie" class="w-6 h-6 text-white" />
            </div>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
            Expense Categories
          </p>
          <p class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ dashboardData?.expenses?.byCategory?.length || 0 }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Active this month
          </p>
        </div>

        <!-- Savings Rate -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <UIcon name="i-heroicons-arrow-up-circle" class="w-6 h-6 text-white" />
            </div>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
            Savings Rate
          </p>
          <div v-if="savingsRate" class="flex items-baseline gap-2">
            <p class="text-3xl font-bold" :class="savingsRate.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ savingsRate.percentage.toFixed(1) }}%
            </p>
          </div>
          <p v-else class="text-3xl font-bold text-gray-400 dark:text-gray-500">
            N/A
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Of income saved
          </p>
        </div>
      </div>

      <!-- Expense Breakdown Chart -->
      <SpendingByCategoryChart
        :expenses="dashboardData?.expenses"
        :loading="loading"
      />

      <!-- Detailed Breakdown Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            All Expense Categories
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete breakdown of expenses by category
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
                v-for="category in dashboardData?.expenses?.byCategory"
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
        <div v-if="!dashboardData?.expenses?.byCategory?.length" class="p-8 text-center">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-heroicons-chart-pie" class="w-8 h-8 text-gray-400" />
          </div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            No expense data available for this month
          </p>
        </div>
      </div>

      <!-- Insights Section -->
      <div class="space-y-4">
        <!-- Top Spending Insight -->
        <div v-if="topExpenseCategory" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-amber-900 dark:text-amber-300 mb-2">
                Spending Insight
              </h3>
              <p class="text-amber-700 dark:text-amber-400">
                Your largest expense category is <strong>{{ getCategoryMetadata(topExpenseCategory.category).name }}</strong>,
                accounting for <strong>{{ Math.round(topExpenseCategory.percentage) }}%</strong> of your total spending
                ({{ formatCurrency(topExpenseCategory.amount) }}).
              </p>
            </div>
          </div>
        </div>

        <!-- Savings Rate Insight -->
        <div v-if="savingsRate" class="border rounded-lg p-6" :class="savingsRate.isPositive ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" :class="savingsRate.isPositive ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'">
              <UIcon :name="savingsRate.isPositive ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'" class="w-5 h-5" :class="savingsRate.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" />
            </div>
            <div>
              <h3 class="text-lg font-semibold mb-2" :class="savingsRate.isPositive ? 'text-green-900 dark:text-green-300' : 'text-red-900 dark:text-red-300'">
                {{ savingsRate.isPositive ? 'Great Job!' : 'Needs Attention' }}
              </h3>
              <p :class="savingsRate.isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
                <template v-if="savingsRate.isPositive">
                  You're saving <strong>{{ savingsRate.percentage.toFixed(1) }}%</strong> of your income this month
                  ({{ formatCurrency(savingsRate.amount) }}). Keep up the good work!
                </template>
                <template v-else>
                  You're spending more than you earn this month. Your expenses exceed your income by
                  <strong>{{ formatCurrency(Math.abs(savingsRate.amount)) }}</strong>.
                </template>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
