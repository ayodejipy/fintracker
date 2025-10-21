<script setup lang="ts">
import type { Transaction, TransactionSummaryResponse } from '~/types'
import { useTransactionDelete } from '../composables/useTransactionDelete'
import { useTransactions } from '../composables/useTransactions'
import TransactionForm from './TransactionForm.vue'

// Composables
const { deleteTransaction: handleDeleteTransaction } = useTransactionDelete()

// Filters
const filters = ref({
  search: '',
  category: null as string | null,
  type: null as string | null,
  month: '',
})

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Summary
const summary = ref({
  totalIncome: 0,
  totalExpenses: 0,
  netAmount: 0,
})

const summaryLoading = ref(false)

// Use transactions composable with computed filters
const transactionFilters = computed(() => ({
  search: filters.value.search || undefined,
  category: filters.value.category || undefined,
  type: filters.value.type || undefined,
  month: filters.value.month || undefined,
  page: currentPage.value,
  limit: pageSize.value,
}))

const {
  transactions,
  loading,
  error,
  pagination: paginationData,
  refresh: refreshTransactions,
} = useTransactions(transactionFilters)

// Watchers for filters - reset to page 1 when filters change
watch(filters, () => {
  currentPage.value = 1
}, { deep: true })

// Computed pagination for child components
const pagination = computed(() => ({
  currentPage: currentPage.value,
  pageCount: pageSize.value,
  total: paginationData.value.total,
  totalPages: paginationData.value.totalPages,
}))

async function loadSummary() {
  summaryLoading.value = true
  try {
    const query: Record<string, string> = {}
    if (filters.value.month) {
      const [year, month] = filters.value.month.split('-')
      if (year) { query.year = year }
      if (month) { query.month = month }
    }

    const response = await $fetch('/api/transactions/summary', { query }) as TransactionSummaryResponse

    summary.value.totalIncome = response.data.totalIncome
    summary.value.totalExpenses = response.data.totalExpenses
    summary.value.netAmount = response.data.netAmount
  }
  catch (error) {
    console.error('Error loading summary:', error)
  }
  finally {
    summaryLoading.value = false
  }
}

async function refreshAllData() {
  await Promise.all([
    refreshTransactions(),
    loadSummary(),
  ])
}

async function editTransaction(transaction: Transaction) {
  const { open } = useModal()

  open({
    component: TransactionForm,
    props: {
      transaction,
    },
    onConfirm: async () => {
      await refreshAllData()
      const toast = useToast()
      toast.add({
        title: 'Success',
        description: 'Transaction updated successfully',
        color: 'success',
      })
    },
  })
}

async function deleteTransaction(transaction: Transaction) {
  await handleDeleteTransaction(transaction, refreshAllData)
}

function handlePageChange(page: number) {
  console.log('Changing to page', page)
  currentPage.value = page
  // useFetch will auto-refresh when page changes
}

function handleAddTransaction() {
  const { open } = useModal()

  open({
    component: TransactionForm,
    props: {
      transaction: null,
    },
    onConfirm: async () => {
      await refreshAllData()
      const toast = useToast()
      toast.add({
        title: 'Success',
        description: 'Transaction added successfully',
        color: 'success',
      })
    },
  })
}

// Initialize data
onMounted(() => {
  refreshAllData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <UIcon name="i-heroicons-credit-card" class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Transactions
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Track your income and expenses
            </p>
          </div>
        </div>
        <div class="flex gap-3">
          <UButton
            icon="i-heroicons-document-arrow-up"
            size="md"
            color="neutral"
            variant="outline"
            to="/import-statement"
          >
            Import Statement
          </UButton>
          <UButton
            icon="i-heroicons-plus"
            size="md"
            color="primary"
            @click="handleAddTransaction"
          >
            Add Transaction
          </UButton>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <TransactionSummary
      :total-income="summary.totalIncome" :total-expenses="summary.totalExpenses"
      :net-amount="summary.netAmount" :loading="summaryLoading"
    />

    <!-- Filters -->
    <TransactionFilters v-model="filters" />

    <!-- Transaction List -->
    <TransactionList
      :transactions="transactions" :loading="loading" :error="error" :pagination="pagination"
      @edit="editTransaction" @delete="deleteTransaction" @refresh="refreshAllData" @page-change="handlePageChange"
      @add-transaction="handleAddTransaction"
    />
  </div>
</template>
