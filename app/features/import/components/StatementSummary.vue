<script setup lang="ts">
import type { BankStatementParseResult } from '~/types'

// Props
interface Props {
  parseResult: Readonly<BankStatementParseResult>
}

defineProps<Props>()
</script>

<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Total Transactions
        </p>
        <p class="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
          {{ parseResult.summary.total }}
        </p>
      </div>

      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg shadow p-6">
        <p class="text-sm text-green-700 dark:text-green-400">
          Auto-Categorized
        </p>
        <p class="text-3xl font-bold text-green-600 dark:text-green-500 mt-2">
          {{ parseResult.summary.autoCategorized }}
        </p>
      </div>

      <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-6">
        <p class="text-sm text-yellow-700 dark:text-yellow-400">
          Needs Review
        </p>
        <p class="text-3xl font-bold text-yellow-600 dark:text-yellow-500 mt-2">
          {{ parseResult.summary.needsReview }}
        </p>
      </div>

      <div class="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-6">
        <p class="text-sm text-red-700 dark:text-red-400">
          Flagged
        </p>
        <p class="text-3xl font-bold text-red-600 dark:text-red-500 mt-2">
          {{ parseResult.summary.flagged }}
        </p>
      </div>
    </div>

    <!-- Statement Info -->
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-building-library" class="w-5 h-5 text-blue-600" />
          <span class="font-medium text-blue-900 dark:text-blue-100">{{ parseResult.bankName }}</span>
        </div>

        <div v-if="parseResult.accountNumber" class="flex items-center gap-2">
          <UIcon name="i-heroicons-credit-card" class="w-5 h-5 text-blue-600" />
          <span class="text-blue-900 dark:text-blue-100">{{ parseResult.accountNumber }}</span>
        </div>

        <div v-if="parseResult.period" class="flex items-center gap-2">
          <UIcon name="i-heroicons-calendar" class="w-5 h-5 text-blue-600" />
          <span class="text-blue-900 dark:text-blue-100">
            {{ parseResult.period.from }} to {{ parseResult.period.to }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
