<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { useDashboard } from '~/composables/useDashboard'
// Import dashboard components
import DashboardBalanceCard from '~/features/dashboard/components/DashboardBalanceCard.vue'
import DashboardIncomeCard from '~/features/dashboard/components/DashboardIncomeCard.vue'
import DashboardRecentTransactions from '~/features/dashboard/components/DashboardRecentTransactions.vue'
import DashboardSavingsCard from '~/features/dashboard/components/DashboardSavingsCard.vue'
import DashboardSpendingCard from '~/features/dashboard/components/DashboardSpendingCard.vue'
import MonthlyOverviewCard from '~/features/dashboard/components/MonthlyOverviewCard.vue'
import MonthSelector from '~/features/dashboard/components/MonthSelector.vue'
import { getCurrentMonth } from '~/utils/date'

// Composables
const { user, isAuthenticated, refreshUser } = useAuth()

// Month state - start with current month
const selectedMonth = ref(getCurrentMonth())

// Dashboard composable with reactive month
const { fetchDashboardData, loading: dashboardLoading, dashboardData, error, changeMonth } = useDashboard(selectedMonth)

// Meta
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
})

// Set page title
useHead({
  title: 'Dashboard - Personal Finance Tracker',
})

// Load dashboard data on mount and when authentication changes
onMounted(async () => {
  console.log('Dashboard page - onMounted')

  // First ensure we refresh user authentication
  await refreshUser()
  console.log('Dashboard page - after refreshUser, isAuthenticated:', isAuthenticated.value)
  console.log('Dashboard page - user:', user.value)

  // Then fetch dashboard data
  if (isAuthenticated.value) {
    console.log('Dashboard page - calling fetchDashboardData')
    await fetchDashboardData()
    console.log('Dashboard page - fetchDashboardData completed')
  }
  else {
    console.log('Dashboard page - user not authenticated after refreshUser')
    navigateTo('/auth/login')
  }
})

// Also watch for authentication changes and fetch data when user becomes authenticated
watch(isAuthenticated, async (authenticated) => {
  console.log('Dashboard page - auth state changed:', authenticated)
  if (authenticated && !dashboardData.value) {
    console.log('Dashboard page - user authenticated, fetching data')
    await fetchDashboardData()
  }
}, { immediate: false })
</script>

<template>
  <div v-if="dashboardLoading" class="flex justify-center items-center h-64">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  </div>

  <div v-else class="space-y-6">
    <!-- Welcome Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        Overview
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Hey welcome back, {{ (user as any)?.user?.name || 'Ayodeji' }} 👋
      </p>
    </div>

    <!-- Month Selector -->
    <MonthSelector v-model="selectedMonth" />

    <!-- Error display -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <p class="text-sm text-red-800 dark:text-red-200">
        Error loading dashboard: {{ error }}
      </p>
    </div>

    <!-- Key Financial Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <!-- Net Worth Card -->
      <DashboardBalanceCard
        :net-worth="dashboardData?.overview?.netWorth"
        :monthly-trends="dashboardData?.trends"
        :loading="dashboardLoading"
      />

      <!-- Monthly Income Card -->
      <DashboardIncomeCard
        :monthly-income="dashboardData?.currentMonth?.income"
        :net-income="dashboardData?.currentMonth?.netIncome"
        :monthly-trends="dashboardData?.trends"
        :loading="dashboardLoading"
      />

      <!-- Total Spending Card -->
      <DashboardSpendingCard
        :expenses="dashboardData?.currentMonth?.expenses"
        :monthly-trends="dashboardData?.trends"
        :loading="dashboardLoading"
      />

      <!-- Total Savings Card -->
      <DashboardSavingsCard
        :total-savings="dashboardData?.overview?.totalSavings"
        :savings-progress="dashboardData?.savings?.progress"
        :active-goals="dashboardData?.savings?.activeGoals"
        :monthly-contributions="dashboardData?.savings?.monthlyContributions"
        :loading="dashboardLoading"
      />
    </div>

    <!-- Monthly Trends Overview -->
    <div class="mb-6">
      <MonthlyOverviewCard
        :current-month="dashboardData?.currentMonth"
        :monthly-trends="dashboardData?.trends"
        :loading="dashboardLoading"
      />
    </div>

    <!-- Quick Insights & Actions -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <!-- Income Analysis Link -->
      <NuxtLink
        to="/income"
        class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 hover:shadow-md transition-all duration-200 group"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
            <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-white" />
          </div>
          <UIcon name="i-heroicons-arrow-right" class="w-5 h-5 text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform duration-200" />
        </div>
        <h3 class="text-lg font-semibold text-green-900 dark:text-green-300 mb-1">
          Income Analysis
        </h3>
        <p class="text-sm text-green-700 dark:text-green-400">
          View detailed income breakdown by source
        </p>
      </NuxtLink>

      <!-- Expense Analysis Link -->
      <NuxtLink
        to="/expenses"
        class="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 hover:shadow-md transition-all duration-200 group"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
            <UIcon name="i-heroicons-chart-pie" class="w-6 h-6 text-white" />
          </div>
          <UIcon name="i-heroicons-arrow-right" class="w-5 h-5 text-red-600 dark:text-red-400 group-hover:translate-x-1 transition-transform duration-200" />
        </div>
        <h3 class="text-lg font-semibold text-red-900 dark:text-red-300 mb-1">
          Expense Analysis
        </h3>
        <p class="text-sm text-red-700 dark:text-red-400">
          Deep dive into your spending patterns
        </p>
      </NuxtLink>

      <!-- Budget Management Link -->
      <NuxtLink
        to="/budgets"
        class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 hover:shadow-md transition-all duration-200 group"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
            <UIcon name="i-heroicons-calculator" class="w-6 h-6 text-white" />
          </div>
          <UIcon name="i-heroicons-arrow-right" class="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform duration-200" />
        </div>
        <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-1">
          Budget Management
        </h3>
        <p class="text-sm text-blue-700 dark:text-blue-400">
          Track and manage your budgets
        </p>
      </NuxtLink>

      <!-- Savings & Goals Link -->
      <NuxtLink
        to="/savings"
        class="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 hover:shadow-md transition-all duration-200 group"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
            <UIcon name="i-heroicons-trophy" class="w-6 h-6 text-white" />
          </div>
          <UIcon name="i-heroicons-arrow-right" class="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform duration-200" />
        </div>
        <h3 class="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-1">
          Savings & Goals
        </h3>
        <p class="text-sm text-purple-700 dark:text-purple-400">
          Monitor your savings progress
        </p>
      </NuxtLink>
    </div>

    <!-- Charts and Data Row -->
    <div class="grid grid-cols-1 lg:grid-cols-1 gap-6">
      <!-- Recent Transactions -->
      <DashboardRecentTransactions
        :recent-transactions="dashboardData?.recentTransactions"
        :loading="dashboardLoading"
      />
    </div>
  </div>
</template>
