<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useDashboard } from '~/composables/useDashboard'

// Import dashboard components
import DashboardBalanceCard from '~/features/dashboard/components/DashboardBalanceCard.vue'
import DashboardBudgetCard from '~/features/dashboard/components/DashboardBudgetCard.vue'
import DashboardDebtCard from '~/features/dashboard/components/DashboardDebtCard.vue'
import DashboardIncomeCard from '~/features/dashboard/components/DashboardIncomeCard.vue'
import DashboardMonitoringChart from '~/features/dashboard/components/DashboardMonitoringChart.vue'
import DashboardRecentTransactions from '~/features/dashboard/components/DashboardRecentTransactions.vue'
import DashboardSavingsCard from '~/features/dashboard/components/DashboardSavingsCard.vue'
import DashboardSpendingCard from '~/features/dashboard/components/DashboardSpendingCard.vue'
import MonthlyOverviewCard from '~/features/dashboard/components/MonthlyOverviewCard.vue'
import RecurringExpensesCard from '~/features/dashboard/components/RecurringExpensesCard.vue'
import SpendingByCategoryChart from '~/features/dashboard/components/SpendingByCategoryChart.vue'

// Composables
const { user, isAuthenticated, refreshUser } = useAuth()
const { fetchDashboardData, loading: dashboardLoading, dashboardData, error } = useDashboard()

// Meta
definePageMeta({
  middleware: 'auth',
  layout: 'dashboard',
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

    <!-- Error display -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <p class="text-sm text-red-800 dark:text-red-200">
        Error loading dashboard: {{ error }}
      </p>
    </div>

    <!-- Statistics Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
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

    <!-- Second Row - Debt and Budget -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Total Debt Card -->
      <DashboardDebtCard
        :total-debt="dashboardData?.overview?.totalDebt"
        :monthly-payments="dashboardData?.debt?.monthlyPayments"
        :active-loans="dashboardData?.debt?.activeLoans"
        :loading="dashboardLoading"
      />

      <!-- Budget Status Card -->
      <DashboardBudgetCard
        :total-budget="dashboardData?.budget?.totalBudget"
        :total-spent="dashboardData?.budget?.totalSpent"
        :utilization="dashboardData?.budget?.utilization"
        :remaining="dashboardData?.budget?.remaining"
        :loading="dashboardLoading"
      />
    </div>

    <!-- Enhanced Insights Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Monthly Overview with Projections -->
      <MonthlyOverviewCard
        :current-month="dashboardData?.currentMonth"
        :monthly-trends="dashboardData?.trends"
        :loading="dashboardLoading"
      />

      <!-- Spending by Category -->
      <SpendingByCategoryChart
        :expenses="dashboardData?.expenses"
        :loading="dashboardLoading"
      />
    </div>

    <!-- Additional Insights Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Recurring Expenses -->
      <RecurringExpensesCard :loading="dashboardLoading" />

      <!-- Monitoring Overview Chart -->
      <div class="lg:col-span-2">
        <DashboardMonitoringChart
          :monthly-trends="dashboardData?.trends"
          :loading="dashboardLoading"
        />
      </div>
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
