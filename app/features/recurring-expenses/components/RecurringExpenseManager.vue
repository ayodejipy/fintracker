<script setup lang="ts">
import type { RecurringExpense } from '~/types'
import { onMounted, ref } from 'vue'
import { useRecurringExpenses } from '../composables/useRecurringExpenses'
import RecurringExpenseForm from './RecurringExpenseForm.vue'
import RecurringExpenseItem from './RecurringExpenseItem.vue'
import RecurringExpensesSummary from './RecurringExpensesSummary.vue'
import UpcomingExpensesCard from './UpcomingExpensesCard.vue'

// Composables
const {
  recurringExpenses,
  loading,
  error,
  fetchRecurringExpenses,
  deleteRecurringExpense,
  toggleRecurringExpense,
  markAsPaid,
  activeExpenses,
  totalMonthlyCommitments,
} = useRecurringExpenses()

// Local state - removed since we're using modal manager

// Load data on mount
onMounted(() => {
  fetchRecurringExpenses()
})

// Event handlers
function handleAddExpense() {
  const { open } = useModal()

  open({
    component: RecurringExpenseForm,
    props: {
      expense: null,
    },
    onConfirm: async () => {
      await fetchRecurringExpenses()
      const toast = useToast()
      toast.add({
        title: 'Success',
        description: 'Recurring expense added successfully',
        color: 'success',
      })
    },
  })
}

function handleEditExpense(expense: RecurringExpense) {
  const { open } = useModal()

  open({
    component: RecurringExpenseForm,
    props: {
      expense,
    },
    onConfirm: async () => {
      await fetchRecurringExpenses()
      const toast = useToast()
      toast.add({
        title: 'Success',
        description: 'Recurring expense updated successfully',
        color: 'success',
      })
    },
  })
}

async function handleDeleteExpense(expense: RecurringExpense) {
  const confirmed = await openConfirmation({
    title: 'Delete Recurring Expense?',
    message: `Are you sure you want to delete "${expense.name}"? This action cannot be undone and will remove all associated data.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
    icon: 'i-heroicons-trash',
  })

  if (!confirmed) { return }

  try {
    await deleteRecurringExpense(expense.id)
    const toast = useToast()
    toast.add({
      title: 'Success',
      description: 'Recurring expense deleted successfully',
      color: 'success',
    })
  }
  catch (error) {
    console.error('Error deleting recurring expense:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to delete recurring expense',
      color: 'error',
    })
  }
}

async function handleToggleExpense(expense: RecurringExpense) {
  try {
    await toggleRecurringExpense(expense.id, !expense.isActive)
  }
  catch (error) {
    console.error('Error toggling recurring expense:', error)
  }
}

async function handleMarkAsPaid(expense: RecurringExpense) {
  try {
    await markAsPaid(expense.id)
  }
  catch (error) {
    console.error('Error marking expense as paid:', error)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Recurring Expenses
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Manage your predictable monthly expenses
        </p>
      </div>
      <UButton
        icon="i-heroicons-plus"
        size="lg"
        @click="handleAddExpense"
      >
        Add Recurring Expense
      </UButton>
    </div>

    <!-- Error display -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <p class="text-sm text-red-800 dark:text-red-200">
        {{ error }}
      </p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Summary Overview -->
      <RecurringExpensesSummary
        :total-monthly-commitments="totalMonthlyCommitments"
        :active-count="activeExpenses.length"
        :loading="loading"
      />

      <!-- Upcoming Expenses -->
      <div class="lg:col-span-2">
        <UpcomingExpensesCard
          :loading="loading"
          @mark-as-paid="handleMarkAsPaid"
        />
      </div>
    </div>

    <!-- Recurring Expenses List -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            All Recurring Expenses
          </h2>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ activeExpenses.length }} active expenses
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>

      <!-- Expenses list -->
      <div v-else-if="recurringExpenses.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
        <RecurringExpenseItem
          v-for="expense in recurringExpenses"
          :key="expense.id"
          :expense="expense"
          @edit="handleEditExpense"
          @delete="handleDeleteExpense"
          @toggle="handleToggleExpense"
          @mark-as-paid="handleMarkAsPaid"
        />
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-12">
        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <UIcon name="i-heroicons-calendar-days" class="w-8 h-8 text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No recurring expenses yet
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          Add your first recurring expense to start tracking your monthly commitments.
        </p>
        <UButton
          icon="i-heroicons-plus"
          @click="handleAddExpense"
        >
          Add Recurring Expense
        </UButton>
      </div>
    </div>
  </div>
</template>
