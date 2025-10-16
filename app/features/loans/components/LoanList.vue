<script setup lang="ts">
import type { Loan } from '~/types'

interface Props {
  loans: Loan[]
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})

const emit = defineEmits<{
  recordPayment: [loan: Loan]
  edit: [loan: Loan]
  delete: [loan: Loan]
  viewProjection: [loan: Loan]
  addLoan: []
  clearFilters: []
  refresh: []
}>()

// Separate active and paid off loans
const activeLoans = computed(() =>
  props.loans.filter(loan => loan.currentBalance > 0),
)

const paidOffLoans = computed(() =>
  props.loans.filter(loan => loan.currentBalance <= 0),
)

function handleRecordPayment(loan: Loan) {
  emit('recordPayment', loan)
}

function handleEdit(loan: Loan) {
  emit('edit', loan)
}

function handleDelete(loan: Loan) {
  emit('delete', loan)
}

function handleViewProjection(loan: Loan) {
  emit('viewProjection', loan)
}

function handleAddLoan() {
  emit('addLoan')
}

function handleClearFilters() {
  emit('clearFilters')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading state -->
    <LoadingState v-if="loading" message="Loading loans..." />

    <!-- Error state -->
    <ErrorState
      v-else-if="error"
      :message="error"
      @retry="$emit('refresh')"
    />

    <!-- Empty state -->
    <EmptyState
      v-else-if="loans.length === 0"
      title="No loans yet"
      description="Start tracking your loans to monitor your debt payoff progress and stay on top of payments."
      icon="i-heroicons-credit-card"
      action-label="Add Your First Loan"
      show-action
      @action="handleAddLoan"
    />

    <!-- No results state -->
    <EmptyState
      v-else-if="activeLoans.length === 0 && paidOffLoans.length === 0"
      title="No loans found"
      description="Try adjusting your search or filter criteria."
      icon="i-heroicons-magnifying-glass"
      action-label="Clear Filters"
      show-action
      @action="handleClearFilters"
    />

    <!-- Loans content -->
    <div v-else class="space-y-6">
      <!-- Active loans -->
      <div v-if="activeLoans.length > 0">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-xl">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Active Loans
            </h3>
          </div>
          <div class="divide-y divide-gray-100">
            <LoanItem
              v-for="loan in activeLoans"
              :key="loan.id"
              :loan="loan"
              @record-payment="handleRecordPayment"
              @edit="handleEdit"
              @delete="handleDelete"
              @view-projection="handleViewProjection"
            />
          </div>
        </div>
      </div>

      <!-- Paid off loans -->
      <div v-if="paidOffLoans.length > 0">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-xl">
            <h3 class="text-lg font-semibold text-gray-500 dark:text-gray-400">
              Paid Off Loans
            </h3>
          </div>
          <div class="divide-y divide-gray-100">
            <LoanItem
              v-for="loan in paidOffLoans"
              :key="loan.id"
              :loan="loan"
              :is-paid-off="true"
              @delete="handleDelete"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
