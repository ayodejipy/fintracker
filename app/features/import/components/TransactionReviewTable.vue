<script setup lang="ts">
import type { ParsedTransaction } from '~/types'
import { formatAmount, formatDate } from '../utils/formatHelpers'
import { getConfidenceColorClass, getConfidenceLabel, getFlagLabel, getTransactionRowClass } from '../utils/reviewHelpers'

// Props
interface Props {
  transactions: ParsedTransaction[]
  categoryOptions: Array<{ label: string, value: string }>
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  remove: [index: number]
  updateCategory: [index: number, category: string]
  updateDescription: [index: number, description: string]
}>()

// Handle remove
function handleRemove(index: number) {
  emit('remove', index)
}

// Handle category update
function handleCategoryUpdate(index: number, category: string) {
  emit('updateCategory', index, category)
}

// Handle description update
function handleDescriptionUpdate(index: number, description: string) {
  emit('updateDescription', index, description)
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Review Transactions
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Please review and edit transactions before importing
      </p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Description
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Amount
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Total (incl. fees)
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Category
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Confidence
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="(transaction, index) in props.transactions"
            :key="index"
            :class="getTransactionRowClass(!!transaction.needsReview, !!(transaction.flags && transaction.flags.length > 0))"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ formatDate(transaction.date) }}
            </td>

            <td class="px-6 py-4 text-sm">
              <UTextarea
                :model-value="transaction.description"
                type="text"
                class="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter description"
                autoresize
                :rows="8"
                @update:model-value="handleDescriptionUpdate(index, $event)"
              />
              <div v-if="transaction.flags && transaction.flags.length > 0" class="mt-1 flex flex-wrap gap-1">
                <span
                  v-for="flag in transaction.flags"
                  :key="flag"
                  class="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                >
                  {{ getFlagLabel(flag) }}
                </span>
              </div>
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span :class="transaction.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ transaction.type === 'credit' ? '+' : '-' }}₦{{ formatAmount(transaction.amount) }}
              </span>
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span
                v-if="transaction.total"
                :class="transaction.type === 'credit' ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'"
              >
                {{ transaction.type === 'credit' ? '+' : '-' }}₦{{ formatAmount(transaction.total) }}
              </span>
              <span v-else class="text-gray-400 dark:text-gray-500 text-xs">
                No fees
              </span>
            </td>

            <td class="px-6 py-4">
              <USelect
                :model-value="transaction.category"
                :items="categoryOptions"
                placeholder="Select category"
                size="sm"
                :ui="{ base: 'w-full' }"
                @update:model-value="handleCategoryUpdate(index, $event)"
              />
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span
                v-if="transaction.confidence"
                class="px-2 py-1 rounded text-xs font-medium"
                :class="getConfidenceColorClass(transaction.confidence)"
              >
                {{ getConfidenceLabel(transaction.confidence) }}
              </span>
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <UButton
                color="error"
                variant="ghost"
                size="xs"
                icon="i-heroicons-trash"
                @click="handleRemove(index)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
