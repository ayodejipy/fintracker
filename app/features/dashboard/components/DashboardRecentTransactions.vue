<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '~/utils/currency'

// Props interface
interface Props {
  recentTransactions?: readonly {
    readonly id: string
    readonly amount: number
    readonly type: string
    readonly category: string
    readonly date: Date
  }[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  recentTransactions: () => [],
  loading: false,
})

// Transform transactions for display
const transactions = computed(() => {
  if (props.recentTransactions && props.recentTransactions.length > 0) {
    return props.recentTransactions.slice(0, 5).map(transaction => ({
      id: transaction.id,
      dealId: `DE${Math.random().toString().slice(2, 8)}`,
      customerName: getCustomerName(transaction.category),
      customerEmail: getCustomerEmail(transaction.category),
      date: new Date(transaction.date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      amount: transaction.amount,
      status: transaction.type.toLowerCase() === 'income' ? 'Success' : 'Pending',
      avatar: getAvatar(transaction.category),
    }))
  }

  // Fallback mock data when no real data is available
  return [
    {
      id: '1',
      dealId: 'DE254839',
      customerName: 'Esther Howard',
      customerEmail: 'howard@gmail.com',
      date: '28 Dec 2025',
      amount: 582479.00,
      status: 'Success',
      avatar: 'EH',
    },
    {
      id: '2',
      dealId: 'DE254840',
      customerName: 'Kristin Watson',
      customerEmail: 'watson@gmail.com',
      date: '16 Feb 2025',
      amount: 235261.00,
      status: 'Pending',
      avatar: 'KW',
    },
  ]
})

function getCustomerName(category: string) {
  const names = {
    Food: 'Esther Howard',
    Transport: 'Kristin Watson',
    Entertainment: 'Jenny Wilson',
    Shopping: 'Robert Fox',
    Salary: 'Company Inc',
  }
  return names[category as keyof typeof names] || 'Unknown Customer'
}

function getCustomerEmail(category: string) {
  const emails = {
    Food: 'howard@gmail.com',
    Transport: 'watson@gmail.com',
    Entertainment: 'jenny@gmail.com',
    Shopping: 'robert@gmail.com',
    Salary: 'company@gmail.com',
  }
  return emails[category as keyof typeof emails] || 'unknown@gmail.com'
}

function getAvatar(category: string) {
  const avatars = {
    Food: 'EH',
    Transport: 'KW',
    Entertainment: 'JW',
    Shopping: 'RF',
    Salary: 'CI',
  }
  return avatars[category as keyof typeof avatars] || 'UK'
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Recent Transaction
      </h3>
      <div class="flex items-center gap-3">
        <!-- Search -->
        <div class="relative">
          <input
            type="text"
            placeholder="Search..."
            class="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
          <svg class="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Filter -->
        <button class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          Filter
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="animate-pulse">
      <div class="space-y-4">
        <div v-for="i in 3" :key="i" class="flex items-center space-x-4">
          <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-700">
            <th class="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Deal ID
            </th>
            <th class="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Customer Name
            </th>
            <th class="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Customer Email
            </th>
            <th class="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Date
            </th>
            <th class="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Amount
            </th>
            <th class="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Deal Stage
            </th>
            <th class="text-left py-3 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transaction in transactions" :key="transaction.id" class="border-b border-gray-50 hover:bg-gray-25">
            <td class="py-4 px-2">
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ transaction.dealId }}</span>
            </td>
            <td class="py-4 px-2">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {{ transaction.avatar }}
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ transaction.customerName }}</span>
              </div>
            </td>
            <td class="py-4 px-2">
              <span class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{{ transaction.customerEmail }}</span>
            </td>
            <td class="py-4 px-2">
              <span class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">{{ transaction.date }}</span>
            </td>
            <td class="py-4 px-2">
              <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatCurrency(transaction.amount) }}</span>
            </td>
            <td class="py-4 px-2">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="{
                  'bg-green-100 dark:bg-green-900/30 text-green-800': transaction.status === 'Success',
                  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800': transaction.status === 'Pending',
                }"
              >
                {{ transaction.status }}
              </span>
            </td>
            <td class="py-4 px-2">
              <button class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 dark:bg-gray-700/50 rounded">
                <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-if="transactions.length === 0" class="text-center py-8">
      <div class="text-gray-400 dark:text-gray-500 mb-2">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p class="text-gray-500 dark:text-gray-400 dark:text-gray-500">
        No recent transactions
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
