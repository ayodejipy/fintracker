<script setup lang="ts">
import type { Transaction } from '~/types'

interface Props {
  transactions: Transaction[]
  loading?: boolean
  error?: string | null
  pagination?: {
    currentPage: number
    pageCount: number
    total: number
    totalPages: number
  }
}

const _props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
  pagination: () => ({
    currentPage: 1,
    pageCount: 10,
    total: 0,
    totalPages: 1,
  }),
})

const emit = defineEmits<{
  edit: [transaction: Transaction]
  delete: [transaction: Transaction]
  refresh: []
  pageChange: [page: number]
  addTransaction: []
}>()

function handleEdit(transaction: Transaction) {
  emit('edit', transaction)
}

function handleDelete(transaction: Transaction) {
  emit('delete', transaction)
}

function handleRefresh() {
  emit('refresh')
}

function handlePageChange(page: number) {
  emit('pageChange', page)
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-xl">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <div class="flex items-center space-x-2">
          <UButton
            variant="ghost"
            size="sm"
            :loading="loading"
            class="text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 dark:bg-gray-700/50"
            @click="handleRefresh"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
          </UButton>
        </div>
      </div>
    </div>

    <!-- Content -->
    <ClientOnly>
      <div v-if="loading">
        <LoadingState message="Loading transactions..." />
      </div>

      <div v-else-if="error">
        <ErrorState
          :message="error"
          @retry="handleRefresh"
        />
      </div>

      <div v-else-if="transactions.length === 0">
        <EmptyState
          title="No transactions found"
          description="Start tracking your finances by adding your first transaction"
          icon="i-heroicons-document-text"
          action-label="Add your first transaction"
          show-action
          @action="$emit('addTransaction')"
        />
      </div>

      <div v-else class="divide-y divide-gray-100 dark:divide-gray-700/60">
        <TransactionItem
          v-for="transaction in transactions"
          :key="transaction.id"
          :transaction="transaction"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </div>
    </ClientOnly>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
      <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Showing {{ ((pagination.currentPage - 1) * pagination.pageCount) + 1 }} to {{ Math.min(pagination.currentPage * pagination.pageCount, pagination.total) }} of {{ pagination.total }} transactions
        </p>
        <UPagination
          v-model:page="pagination.currentPage"
          :items-per-page="pagination.totalPages"
          :total="pagination.total"
          class="text-gray-600 dark:text-gray-400"
          @update:page="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>
