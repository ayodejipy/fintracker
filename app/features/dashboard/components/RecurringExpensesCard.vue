<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRecurringExpenses } from '~/features/recurring-expenses/composables/useRecurringExpenses'
import type { RecurringExpense } from '~/types'
import { formatCurrency } from '~/utils/currency'
import { getCategoryColor, getCategoryDisplayName } from '~/utils/categories'

interface Props {
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Composables
const { 
  fetchRecurringExpenses, 
  upcomingExpenses, 
  totalMonthlyCommitments,
  overdueExpenses 
} = useRecurringExpenses()

// Local state
const localLoading = ref(false)

// Load data on mount
onMounted(async () => {
  try {
    localLoading.value = true
    await fetchRecurringExpenses()
  }
  catch (error) {
    console.error('Error loading recurring expenses:', error)
  }
  finally {
    localLoading.value = false
  }
})

// Computed
const isLoading = computed(() => props.loading || localLoading.value)

const nextThreeExpenses = computed(() => {
  const all = [...overdueExpenses.value, ...upcomingExpenses.value]
  return all.slice(0, 3).map(expense => {
    const dueDate = new Date(expense.nextDueDate)
    const today = new Date()
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    return {
      ...expense,
      daysUntilDue,
      isOverdue: daysUntilDue < 0,
      isDueSoon: daysUntilDue >= 0 && daysUntilDue <= 3
    }
  })
})

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    loan_repayment: 'i-heroicons-credit-card',
    home_allowance: 'i-heroicons-home',
    rent: 'i-heroicons-building-office',
    transport: 'i-heroicons-truck',
    food: 'i-heroicons-shopping-bag',
    data_airtime: 'i-heroicons-device-phone-mobile',
    miscellaneous: 'i-heroicons-ellipsis-horizontal-circle',
    savings: 'i-heroicons-banknotes',
  }
  return icons[category] || 'i-heroicons-currency-dollar'
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Recurring Expenses
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Monthly commitments
          </p>
        </div>
      </div>
      
      <NuxtLink to="/recurring-expenses">
        <UButton variant="ghost" size="sm" icon="i-heroicons-arrow-right">
          View All
        </UButton>
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Monthly Commitments Summary -->
      <div class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-indigo-600 dark:text-indigo-400 mb-1">
              Total Monthly Commitments
            </p>
            <p class="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
              {{ formatCurrency(totalMonthlyCommitments) }}
            </p>
          </div>
          <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-800 rounded-xl flex items-center justify-center">
            <UIcon name="i-heroicons-banknotes" class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </div>

      <!-- Upcoming Expenses -->
      <div v-if="nextThreeExpenses.length > 0">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Next Due
        </h4>
        <div class="space-y-3">
          <div
            v-for="expense in nextThreeExpenses"
            :key="expense.id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <!-- Category Icon -->
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center"
                :style="{ backgroundColor: `${getCategoryColor(expense.category as any)}20` }"
              >
                <UIcon
                  :name="getCategoryIcon(expense.category)"
                  class="w-4 h-4"
                  :style="{ color: getCategoryColor(expense.category as any) }"
                />
              </div>

              <!-- Expense Info -->
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ expense.name }}
                </p>
                <p class="text-xs" :class="{
                  'text-red-600 dark:text-red-400': expense.isOverdue,
                  'text-yellow-600 dark:text-yellow-400': expense.isDueSoon,
                  'text-gray-500 dark:text-gray-400': !expense.isOverdue && !expense.isDueSoon
                }">
                  {{ expense.isOverdue 
                    ? `Overdue by ${Math.abs(expense.daysUntilDue)} days`
                    : expense.daysUntilDue === 0 
                      ? 'Due today'
                      : expense.daysUntilDue === 1
                        ? 'Due tomorrow'
                        : `Due in ${expense.daysUntilDue} days`
                  }}
                </p>
              </div>
            </div>

            <!-- Amount -->
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(expense.amount) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-6">
        <div class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <UIcon name="i-heroicons-calendar-days" class="w-6 h-6 text-gray-400" />
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
          No recurring expenses set up
        </p>
        <NuxtLink to="/recurring-expenses">
          <UButton size="sm" variant="soft">
            Add Your First Expense
          </UButton>
        </NuxtLink>
      </div>

      <!-- Quick Stats -->
      <div v-if="nextThreeExpenses.length > 0" class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="text-center">
          <p class="text-lg font-bold text-red-600 dark:text-red-400">
            {{ overdueExpenses.length }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
        </div>
        <div class="text-center">
          <p class="text-lg font-bold text-yellow-600 dark:text-yellow-400">
            {{ upcomingExpenses.filter(e => {
              const daysUntilDue = Math.ceil((new Date(e.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              return daysUntilDue <= 7
            }).length }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">This Week</p>
        </div>
      </div>
    </div>
  </div>
</template>