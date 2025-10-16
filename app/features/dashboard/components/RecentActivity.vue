<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard } from '~/composables/useDashboard'
import { formatCurrency } from '~/utils/currency'
import { formatDate } from '~/utils/date'

// Composables
const { recentActivity } = useDashboard()

// Computed properties
const hasActivity = computed(() => {
  return recentActivity.value && recentActivity.value.length > 0
})

function getTransactionIcon(type: string) {
  return type === 'INCOME' ? 'arrow-up' : 'arrow-down'
}

function getTransactionColor(type: string) {
  return type === 'INCOME' ? 'green' : 'red'
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">
        Recent Activity
      </h2>
      <NuxtLink
        to="/transactions"
        class="text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        View All
      </NuxtLink>
    </div>

    <div v-if="!hasActivity" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No recent activity
      </h3>
      <p class="text-gray-500 mb-4">
        Your recent transactions will appear here.
      </p>
      <NuxtLink
        to="/transactions"
        class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Add Transaction
      </NuxtLink>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="transaction in recentActivity" :key="transaction.id"
        class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div class="flex items-center gap-3">
          <!-- Transaction Icon -->
          <div
            class="p-2 rounded-full" :class="{
              'bg-green-100': getTransactionColor(transaction.type) === 'green',
              'bg-red-100': getTransactionColor(transaction.type) === 'red',
            }"
          >
            <svg
              class="w-4 h-4" :class="{
                'text-green-600': getTransactionColor(transaction.type) === 'green',
                'text-red-600': getTransactionColor(transaction.type) === 'red',
              }" fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path
                v-if="getTransactionIcon(transaction.type) === 'arrow-up'"
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 11l5-5m0 0l5 5m-5-5v12"
              />
              <path
                v-else
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 13l-5 5m0 0l-5-5m5 5V6"
              />
            </svg>
          </div>

          <!-- Transaction Details -->
          <div>
            <p class="font-medium text-gray-900">
              {{ transaction.category }}
            </p>
            <p class="text-sm text-gray-500">
              {{ formatDate(transaction.date) }}
            </p>
          </div>
        </div>

        <!-- Transaction Amount -->
        <div class="text-right">
          <p
            class="font-semibold" :class="{
              'text-green-600': getTransactionColor(transaction.type) === 'green',
              'text-red-600': getTransactionColor(transaction.type) === 'red',
            }"
          >
            {{ transaction.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
          </p>
          <p class="text-xs text-gray-500 capitalize">
            {{ transaction.type.toLowerCase() }}
          </p>
        </div>
      </div>

      <!-- View All Link -->
      <div class="pt-4 border-t border-gray-200">
        <NuxtLink
          to="/transactions"
          class="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          <span>View All Transactions</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
