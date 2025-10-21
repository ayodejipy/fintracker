<script setup lang="ts">
import { formatCurrency } from '~/utils/currency'
import { formatDate } from '~/utils/date'

// Props interface
interface Props {
  recentTransactions?: readonly {
    readonly id: string
    readonly amount: number
    readonly type: string
    readonly category: string
    readonly date: Date
    readonly description?: string
  }[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  recentTransactions: () => [],
  loading: false,
})

// Transform transactions for display (limit to 10 most recent)
const transactions = computed(() => {
  if (!props.recentTransactions || props.recentTransactions.length === 0) {
    return []
  }

  return props.recentTransactions.slice(0, 10).map(transaction => ({
    id: transaction.id,
    description: transaction.description || formatCategoryLabel(transaction.category),
    category: formatCategoryLabel(transaction.category),
    date: formatDate(transaction.date),
    amount: transaction.amount,
    type: transaction.type.toLowerCase() as 'income' | 'expense',
  }))
})

// Format category labels
function formatCategoryLabel(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Get category icon
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Loan Repayment': 'i-heroicons-banknotes',
    'Home Allowance': 'i-heroicons-home',
    'Rent': 'i-heroicons-building-office',
    'Transport': 'i-heroicons-truck',
    'Food': 'i-heroicons-shopping-bag',
    'Data Airtime': 'i-heroicons-device-phone-mobile',
    'Miscellaneous': 'i-heroicons-ellipsis-horizontal-circle',
    'Savings': 'i-heroicons-banknotes',
    'Salary': 'i-heroicons-currency-dollar',
    'Income': 'i-heroicons-arrow-trending-up',
  }
  return icons[category] || 'i-heroicons-currency-dollar'
}

// Navigate to transactions page
function viewAllTransactions() {
  navigateTo('/transactions')
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Recent Transactions
      </h3>
      <UButton
        v-if="transactions.length > 0"
        color="neutral"
        variant="ghost"
        size="sm"
        trailing-icon="i-heroicons-arrow-right"
        @click="viewAllTransactions"
      >
        View All
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-6">
      <div class="space-y-4" role="status" aria-label="Loading transactions">
        <div v-for="i in 5" :key="i" class="flex items-center gap-4">
          <div class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          </div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
        </div>
      </div>
    </div>

    <!-- Transactions List -->
    <div v-else-if="transactions.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
      <div
        v-for="transaction in transactions"
        :key="transaction.id"
        class="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
        role="button"
        tabindex="0"
        :aria-label="`Transaction: ${transaction.description}, ${formatCurrency(transaction.amount)}`"
        @click="navigateTo(`/transactions`)"
        @keydown.enter="navigateTo(`/transactions`)"
        @keydown.space.prevent="navigateTo(`/transactions`)"
      >
        <div class="flex items-center gap-4">
          <!-- Icon -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            :class="transaction.type === 'income'
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-blue-100 dark:bg-blue-900/30'"
          >
            <UIcon
              :name="getCategoryIcon(transaction.category)"
              class="w-5 h-5"
              :class="transaction.type === 'income'
                ? 'text-green-600 dark:text-green-400'
                : 'text-blue-600 dark:text-blue-400'"
            />
          </div>

          <!-- Details -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ transaction.description }}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ transaction.category }}
              </p>
              <span class="text-gray-300 dark:text-gray-600">•</span>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ transaction.date }}
              </p>
            </div>
          </div>

          <!-- Amount -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <span
              class="text-sm font-semibold"
              :class="transaction.type === 'income'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-900 dark:text-white'"
            >
              {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="px-6 py-12 text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
        <UIcon name="i-heroicons-receipt-percent" class="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-1">
        No transactions yet
      </h4>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Get started by adding your first transaction
      </p>
      <UButton
        color="primary"
        size="sm"
        @click="navigateTo('/transactions')"
      >
        Add Transaction
      </UButton>
    </div>
  </div>
</template>
