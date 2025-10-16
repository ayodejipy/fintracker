<script setup lang="ts">
import type { Loan } from '~/types'
import { useLoans } from '~/features/loans/composables/useLoans'

// Composables
const {
  loans,
  loading,
  error,
  fetchLoans,
  deleteLoan,
  totalDebt,
  totalMonthlyPayments,
  activeLoans,
} = useLoans()

// Local state
const showAddForm = ref(false)
const editingLoan = ref<Loan | null>(null)
const paymentLoan = ref<Loan | null>(null)
const projectionLoan = ref<Loan | null>(null)

// Filter state
const filters = ref({
  search: '',
  status: { label: 'All Loans', value: 'all' as 'all' | 'active' | 'paid' },
})

// Filtered loans
const filteredLoans = computed(() => {
  let filtered = loans.value

  // Apply search filter
  if (filters.value.search.trim()) {
    const query = filters.value.search.toLowerCase()
    filtered = filtered.filter(loan =>
      loan.name.toLowerCase().includes(query),
    )
  }

  // Apply status filter
  if (filters.value.status.value === 'active') {
    filtered = filtered.filter(loan => loan.currentBalance > 0)
  }
  else if (filters.value.status.value === 'paid') {
    filtered = filtered.filter(loan => loan.currentBalance <= 0)
  }

  return filtered
})

// Load loans on mount
onMounted(() => {
  fetchLoans()
})

// Event handlers
function handleRecordPayment(loan: Loan) {
  paymentLoan.value = loan
}

function handleEditLoan(loan: Loan) {
  editingLoan.value = loan
}

async function handleDeleteLoan(loan: Loan) {
  if (confirm(`Are you sure you want to delete "${loan.name}"?`)) {
    try {
      await deleteLoan(loan.id)
    }
    catch (error) {
      console.error('Error deleting loan:', error)
    }
  }
}

function handleViewProjection(loan: Loan) {
  projectionLoan.value = loan
}

function handleAddLoan() {
  editingLoan.value = null
  showAddForm.value = true
}

function handleClearFilters() {
  filters.value.search = ''
  filters.value.status = { label: 'All Loans', value: 'all' }
}

function closeForm() {
  showAddForm.value = false
  editingLoan.value = null
}

function handleFormSuccess() {
  closeForm()
  fetchLoans() // Refresh the list
}

function handlePaymentSuccess() {
  paymentLoan.value = null
  fetchLoans() // Refresh the list
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <UIcon name="i-heroicons-credit-card" class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Loans & Debt
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              Track your loans and debt payoff progress
            </p>
          </div>
        </div>
        <UButton
          icon="i-heroicons-plus"
          size="lg"
          class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          @click="handleAddLoan"
        >
          Add Loan
        </UButton>
      </div>

      <!-- Summary Cards -->
      <LoanSummary
        :total-debt="totalDebt"
        :total-monthly-payments="totalMonthlyPayments"
        :active-loans-count="activeLoans.length"
        :loading="loading"
      />
    </div>

    <!-- Filters -->
    <LoanFilters v-model="filters" />

    <!-- Loan List -->
    <LoanList
      :loans="filteredLoans"
      :loading="loading"
      :error="error"
      @record-payment="handleRecordPayment"
      @edit="handleEditLoan"
      @delete="handleDeleteLoan"
      @view-projection="handleViewProjection"
      @add-loan="handleAddLoan"
      @clear-filters="handleClearFilters"
    />

    <!-- Add/Edit Loan Modal -->
    <LoanForm
      v-if="showAddForm || editingLoan"
      :loan="editingLoan"
      @close="closeForm"
      @success="handleFormSuccess"
    />

    <!-- Payment Modal -->
    <PaymentModal
      v-if="paymentLoan"
      :loan="paymentLoan"
      @close="paymentLoan = null"
      @success="handlePaymentSuccess"
    />

    <!-- Projection Modal -->
    <LoanProjectionModal
      v-if="projectionLoan"
      :loan="projectionLoan"
      @close="projectionLoan = null"
    />
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
