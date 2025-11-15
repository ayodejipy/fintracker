<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '~/utils/currency'

interface MonthlyData {
  month: string
  income: number
  expenses: number
  netIncome: number
  cashFlow: number
  monthlyPayments?: number
  monthlySavingsContributions?: number
}

interface Props {
  currentMonth?: MonthlyData
  monthlyTrends?: Array<{
    month: string
    income: number
    expenses: number
    netIncome: number
  }>
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Calculate projections and insights
const monthlyInsights = computed(() => {
  if (!props.currentMonth || !props.monthlyTrends?.length) { return null }

  const current = props.currentMonth
  const trends = props.monthlyTrends

  // Calculate average from trends
  const avgIncome = trends.reduce((sum, t) => sum + t.income, 0) / trends.length
  const avgExpenses = trends.reduce((sum, t) => sum + t.expenses, 0) / trends.length

  // Calculate month-to-date projection (assuming we're partway through month)
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysPassed = today.getDate()
  const projectionMultiplier = daysInMonth / daysPassed

  const projectedIncome = current.income * projectionMultiplier
  const projectedExpenses = current.expenses * projectionMultiplier
  const projectedSavings = projectedIncome - projectedExpenses

  // Calculate trends
  const incomeChange = avgIncome > 0 ? ((current.income - avgIncome) / avgIncome) * 100 : 0
  const expenseChange = avgExpenses > 0 ? ((current.expenses - avgExpenses) / avgExpenses) * 100 : 0

  return {
    projectedIncome,
    projectedExpenses,
    projectedSavings,
    incomeChange,
    expenseChange,
    isIncomeUp: incomeChange > 0,
    isExpenseUp: expenseChange > 0,
    savingsRate: projectedIncome > 0 ? (projectedSavings / projectedIncome) * 100 : 0,
    daysPassed,
    daysRemaining: daysInMonth - daysPassed,
  }
})

// Status based on financial health
const financialStatus = computed(() => {
  if (!props.currentMonth) { return { status: 'neutral', message: 'No data available' } }

  const { netIncome, cashFlow } = props.currentMonth

  if (cashFlow > 0 && netIncome > 0) {
    return {
      status: 'excellent',
      message: 'Great job! You\'re saving money and staying within budget.',
      color: 'green',
    }
  }
  else if (netIncome > 0 && cashFlow >= 0) {
    return {
      status: 'good',
      message: 'You\'re earning more than you spend. Consider increasing savings.',
      color: 'blue',
    }
  }
  else if (netIncome >= 0) {
    return {
      status: 'warning',
      message: 'Income covers expenses, but watch your commitments.',
      color: 'yellow',
    }
  }
  else {
    return {
      status: 'danger',
      message: 'Expenses exceed income. Review your spending.',
      color: 'red',
    }
  }
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
          <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Monthly Overview
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Income vs expenses this month
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
    </div>

    <!-- Content -->
    <div v-else-if="currentMonth" class="space-y-6">
      <!-- Current Month Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Income -->
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-green-700 dark:text-green-300">
              Income
            </p>
            <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4 text-green-600" />
          </div>
          <p class="text-xl font-bold text-green-900 dark:text-green-100">
            {{ formatCurrency(currentMonth.income) }}
          </p>
          <div v-if="monthlyInsights" class="flex items-center gap-1 mt-1">
            <UIcon
              :name="monthlyInsights.isIncomeUp ? 'i-heroicons-arrow-up' : 'i-heroicons-arrow-down'"
              class="w-3 h-3"
              :class="monthlyInsights.isIncomeUp ? 'text-green-600' : 'text-red-600'"
            />
            <span class="text-xs" :class="monthlyInsights.isIncomeUp ? 'text-green-600' : 'text-red-600'">
              {{ Math.abs(Math.round(monthlyInsights.incomeChange)) }}% vs avg
            </span>
          </div>
        </div>

        <!-- Expenses -->
        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-red-700 dark:text-red-300">
              Expenses
            </p>
            <UIcon name="i-heroicons-arrow-trending-down" class="w-4 h-4 text-red-600" />
          </div>
          <p class="text-xl font-bold text-red-900 dark:text-red-100">
            {{ formatCurrency(currentMonth.expenses) }}
          </p>
          <div v-if="monthlyInsights" class="flex items-center gap-1 mt-1">
            <UIcon
              :name="monthlyInsights.isExpenseUp ? 'i-heroicons-arrow-up' : 'i-heroicons-arrow-down'"
              class="w-3 h-3"
              :class="monthlyInsights.isExpenseUp ? 'text-red-600' : 'text-green-600'"
            />
            <span class="text-xs" :class="monthlyInsights.isExpenseUp ? 'text-red-600' : 'text-green-600'">
              {{ Math.abs(Math.round(monthlyInsights.expenseChange)) }}% vs avg
            </span>
          </div>
        </div>

        <!-- Net Income -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-blue-700 dark:text-blue-300">
              Net Income
            </p>
            <UIcon name="i-heroicons-calculator" class="w-4 h-4 text-blue-600" />
          </div>
          <p class="text-xl font-bold" :class="currentMonth.netIncome >= 0 ? 'text-blue-900 dark:text-blue-100' : 'text-red-900 dark:text-red-100'">
            {{ formatCurrency(currentMonth.netIncome) }}
          </p>
          <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {{ currentMonth.netIncome >= 0 ? 'Surplus' : 'Deficit' }}
          </p>
        </div>
      </div>

      <!-- Monthly Projection -->
      <div v-if="monthlyInsights" class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h4 class="text-sm font-medium text-purple-900 dark:text-purple-300">
              Month-End Projection
            </h4>
            <p class="text-xs text-purple-600 dark:text-purple-400">
              Based on {{ monthlyInsights.daysPassed }} days of data
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="text-center">
            <p class="text-xs text-purple-600 dark:text-purple-400 mb-1">
              Projected Income
            </p>
            <p class="text-lg font-semibold text-purple-900 dark:text-purple-100">
              {{ formatCurrency(monthlyInsights.projectedIncome) }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-xs text-purple-600 dark:text-purple-400 mb-1">
              Projected Expenses
            </p>
            <p class="text-lg font-semibold text-purple-900 dark:text-purple-100">
              {{ formatCurrency(monthlyInsights.projectedExpenses) }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-xs text-purple-600 dark:text-purple-400 mb-1">
              Projected Savings
            </p>
            <p class="text-lg font-semibold" :class="monthlyInsights.projectedSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ formatCurrency(monthlyInsights.projectedSavings) }}
            </p>
          </div>
        </div>

        <!-- Savings Rate -->
        <div class="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
          <div class="flex items-center justify-between">
            <span class="text-sm text-purple-700 dark:text-purple-300">Projected Savings Rate</span>
            <span class="text-sm font-semibold" :class="monthlyInsights.savingsRate >= 20 ? 'text-green-600' : monthlyInsights.savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'">
              {{ Math.round(monthlyInsights.savingsRate) }}%
            </span>
          </div>
          <div class="w-full bg-purple-200 dark:bg-purple-700 rounded-full h-2 mt-2">
            <div
              class="h-2 rounded-full transition-all duration-300"
              :class="monthlyInsights.savingsRate >= 20 ? 'bg-green-500' : monthlyInsights.savingsRate >= 10 ? 'bg-yellow-500' : 'bg-red-500'"
              :style="{ width: `${Math.min(Math.max(monthlyInsights.savingsRate, 0), 100)}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Financial Status -->
      <div
        class="rounded-lg p-4" :class="{
          'bg-green-50 dark:bg-green-900/20': financialStatus.color === 'green',
          'bg-blue-50 dark:bg-blue-900/20': financialStatus.color === 'blue',
          'bg-yellow-50 dark:bg-yellow-900/20': financialStatus.color === 'yellow',
          'bg-red-50 dark:bg-red-900/20': financialStatus.color === 'red',
        }"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            :class="{
              'bg-green-100 dark:bg-green-800': financialStatus.color === 'green',
              'bg-blue-100 dark:bg-blue-800': financialStatus.color === 'blue',
              'bg-yellow-100 dark:bg-yellow-800': financialStatus.color === 'yellow',
              'bg-red-100 dark:bg-red-800': financialStatus.color === 'red',
            }"
          >
            <UIcon
              :name="financialStatus.color === 'green' ? 'i-heroicons-check-circle'
                : financialStatus.color === 'blue' ? 'i-heroicons-information-circle'
                  : financialStatus.color === 'yellow' ? 'i-heroicons-exclamation-triangle'
                    : 'i-heroicons-x-circle'"
              class="w-4 h-4"
              :class="{
                'text-green-600 dark:text-green-400': financialStatus.color === 'green',
                'text-blue-600 dark:text-blue-400': financialStatus.color === 'blue',
                'text-yellow-600 dark:text-yellow-400': financialStatus.color === 'yellow',
                'text-red-600 dark:text-red-400': financialStatus.color === 'red',
              }"
            />
          </div>
          <div>
            <h5
              class="text-sm font-medium mb-1"
              :class="{
                'text-green-900 dark:text-green-300': financialStatus.color === 'green',
                'text-blue-900 dark:text-blue-300': financialStatus.color === 'blue',
                'text-yellow-900 dark:text-yellow-300': financialStatus.color === 'yellow',
                'text-red-900 dark:text-red-300': financialStatus.color === 'red',
              }"
            >
              Financial Health
            </h5>
            <p
              class="text-sm"
              :class="{
                'text-green-700 dark:text-green-400': financialStatus.color === 'green',
                'text-blue-700 dark:text-blue-400': financialStatus.color === 'blue',
                'text-yellow-700 dark:text-yellow-400': financialStatus.color === 'yellow',
                'text-red-700 dark:text-red-400': financialStatus.color === 'red',
              }"
            >
              {{ financialStatus.message }}
            </p>
          </div>
        </div>
      </div>

      <!-- Cash Flow -->
      <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Available Cash Flow
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              After all expenses & planned commitments
            </p>
          </div>
          <div class="text-right">
            <p class="text-xl font-bold" :class="currentMonth.cashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ formatCurrency(currentMonth.cashFlow) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ currentMonth.cashFlow >= 0 ? 'Available' : 'Shortfall' }}
            </p>
          </div>
        </div>

        <!-- Cash Flow Breakdown -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2 text-xs">
          <div class="flex justify-between text-gray-600 dark:text-gray-300">
            <span>Income</span>
            <span class="text-green-600 dark:text-green-400 font-medium">+{{ formatCurrency(currentMonth.income) }}</span>
          </div>
          <div class="flex justify-between text-gray-600 dark:text-gray-300">
            <span>Expenses</span>
            <span class="text-red-600 dark:text-red-400 font-medium">-{{ formatCurrency(currentMonth.expenses) }}</span>
          </div>
          <div v-if="currentMonth.monthlyPayments && currentMonth.monthlyPayments > 0" class="flex justify-between text-gray-600 dark:text-gray-300">
            <span>Loan Payments</span>
            <span class="text-red-600 dark:text-red-400 font-medium">-{{ formatCurrency(currentMonth.monthlyPayments) }}</span>
          </div>
          <div v-if="currentMonth.monthlySavingsContributions && currentMonth.monthlySavingsContributions > 0" class="flex justify-between text-gray-600 dark:text-gray-300">
            <span>Savings Goals</span>
            <span class="text-red-600 dark:text-red-400 font-medium">-{{ formatCurrency(currentMonth.monthlySavingsContributions) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-banknotes" class="w-8 h-8 text-gray-400" />
      </div>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        No financial data available for this month
      </p>
    </div>
  </div>
</template>
