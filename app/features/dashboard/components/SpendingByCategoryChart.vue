<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '~/utils/currency'

interface CategoryExpense {
  category: string
  amount: number
  percentage: number
}

interface Props {
  expenses?: {
    total: number
    byCategory: CategoryExpense[]
  }
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

// Fetch custom categories for proper display
const { categories, fetchCategories } = useCustomCategories()

onMounted(async () => {
  // Fetch both expense and fee categories since fees show in expense breakdown
  await Promise.all([
    fetchCategories('expense'),
    fetchCategories('fee'),
  ])
})

// Get category metadata from custom categories
const getCategoryMetadata = (categoryValue: string) => {
  const category = categories.value.find(c => c.value === categoryValue)
  return {
    name: category?.name || categoryValue,
    icon: category?.icon || '📦',
    color: category?.color || '#6B7280',
    description: category?.description || 'Expense category',
  }
}

// Get top 3 categories and others
const categoryData = computed(() => {
  if (!props.expenses?.byCategory) {
    return { topCategories: [], others: 0, totalOthers: 0 }
  }

  const sorted = [...props.expenses.byCategory]
    .sort((a, b) => b.amount - a.amount)

  const topCategories = sorted.slice(0, 3)
  const others = sorted.slice(3)
  const totalOthers = others.reduce((sum, cat) => sum + cat.amount, 0)

  return {
    topCategories,
    others: others.length,
    totalOthers,
  }
})

// Calculate trend comparison (mock for now - could be enhanced with historical data)
const trendComparison = computed(() => {
  if (!props.expenses?.byCategory.length) {
    return null
  }

  // Mock trend data - in real implementation, this would come from API
  const topCategory = categoryData.value.topCategories[0]
  if (!topCategory) {
    return null
  }

  const mockTrendPercentage = Math.floor(Math.random() * 40) - 20 // -20% to +20%
  const metadata = getCategoryMetadata(topCategory.category)

  return {
    category: metadata.name,
    change: mockTrendPercentage,
    isIncrease: mockTrendPercentage > 0,
  }
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-sm">
          <UIcon name="i-heroicons-chart-pie" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Spending by Category
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Where your money goes
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
    </div>

    <!-- Content -->
    <div v-else-if="expenses?.byCategory?.length" class="space-y-6">
      <!-- Top Categories -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Top Categories This Month
        </h4>
        
        <div v-for="(categoryItem, index) in categoryData.topCategories" :key="categoryItem.category" class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold text-gray-400 dark:text-gray-500 w-4">
                  {{ index + 1 }}
                </span>
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center"
                  :style="{ backgroundColor: `${getCategoryMetadata(categoryItem.category).color}20` }"
                >
                  <span class="text-base">{{ getCategoryMetadata(categoryItem.category).icon }}</span>
                </div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ getCategoryMetadata(categoryItem.category).name }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ Math.round(categoryItem.percentage) }}% of total spending
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(categoryItem.amount) }}
              </p>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-300"
              :style="{
                width: `${categoryItem.percentage}%`,
                backgroundColor: getCategoryMetadata(categoryItem.category).color,
              }"
            />
          </div>
        </div>

        <!-- Others category if exists -->
        <div v-if="categoryData.others > 0" class="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold text-gray-400 dark:text-gray-500 w-4">
                  +
                </span>
                <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <UIcon name="i-heroicons-ellipsis-horizontal" class="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ categoryData.others }} Other Categories
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ Math.round((categoryData.totalOthers / expenses.total) * 100) }}% of total spending
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(categoryData.totalOthers) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Trend Insight -->
      <div v-if="trendComparison" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h5 class="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
              Spending Insight
            </h5>
            <p class="text-sm text-blue-700 dark:text-blue-400">
              You spent 
              <span :class="trendComparison.isIncrease ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">
                {{ Math.abs(trendComparison.change) }}% {{ trendComparison.isIncrease ? 'more' : 'less' }}
              </span>
              on {{ trendComparison.category }} compared to last month.
            </p>
          </div>
        </div>
      </div>

      <!-- Total Summary -->
      <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total Spending This Month
            </p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(expenses.total) }}
            </p>
          </div>
          <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-chart-pie" class="w-8 h-8 text-gray-400" />
      </div>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        No spending data available for this month
      </p>
    </div>
  </div>
</template>