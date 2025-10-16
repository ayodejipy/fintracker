<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRecurringExpenses } from '../composables/useRecurringExpenses'
import type { RecurringExpense } from '~/types'
import { formatCurrency } from '~/utils/currency'
import { formatDate } from '~/utils/date'
import { getCategoryColor, getCategoryDisplayName } from '~/utils/categories'

interface Props {
  loading?: boolean
}

interface Emits {
  markAsPaid: [expense: RecurringExpense]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

// Composables
const { upcomingExpenses, overdueExpenses } = useRecurringExpenses()

// Local state
const showAll = ref(false)

// Computed
const displayedExpenses = computed(() => {
  const all = [...overdueExpenses.value, ...upcomingExpenses.value]
  return showAll.value ? all : all.slice(0, 5)
})

const totalUpcoming = computed(() => {
  return displayedExpenses.value.reduce((sum, expense) => sum + expense.amount, 0)
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

function getStatusColor(daysUntilDue: number) {
  if (daysUntilDue < 0) return 'red'
  if (daysUntilDue <= 3) return 'yellow'
  return 'green'
}

function getStatusText(daysUntilDue: number) {
  if (daysUntilDue < 0) return `Overdue by ${Math.abs(daysUntilDue)} days`
  if (daysUntilDue === 0) return 'Due today'
  if (daysUntilDue === 1) return 'Due tomorrow'
  return `Due in ${daysUntilDue} days`
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm">
          <UIcon name="i-heroicons-clock" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Upcoming Expenses
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Next 30 days
          </p>
        </div>
      </div>
      
      <!-- Total Amount -->
      <div class="text-right">
        <p class="text-sm text-gray-500 dark:text-gray-400">Total Due</p>
        <p class="text-xl font-bold text-gray-900 dark:text-white">
          {{ formatCurrency(totalUpcoming) }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
    </div>

    <!-- Upcoming Expenses List -->
    <div v-else-if="displayedExpenses.length > 0" class="space-y-4">
      <div
        v-for="expense in displayedExpenses"
        :key="expense.id"
        class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
      >
        <div class="flex items-center space-x-3 flex-1">
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
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                {{ expense.name }}
              </p>
              <UBadge
                :color="getStatusColor(expense.daysUntilDue)"
                variant="soft"
                size="xs"
              >
                {{ getStatusText(expense.daysUntilDue) }}
              </UBadge>
            </div>
            <div class="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{{ getCategoryDisplayName(expense.category as any) }}</span>
              <span>{{ formatDate(expense.nextDueDate) }}</span>
            </div>
          </div>
        </div>

        <!-- Amount and Action -->
        <div class="flex items-center space-x-3">
          <div class="text-right">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(expense.amount) }}
            </p>
          </div>
          
          <!-- Mark as Paid Button -->
          <UButton
            icon="i-heroicons-check-circle"
            color="green"
            variant="soft"
            size="xs"
            @click="emit('markAsPaid', expense)"
          >
            Paid
          </UButton>
        </div>
      </div>

      <!-- Show More/Less Button -->
      <div v-if="upcomingExpenses.length + overdueExpenses.length > 5" class="text-center pt-2">
        <UButton
          variant="ghost"
          size="sm"
          @click="showAll = !showAll"
        >
          {{ showAll ? 'Show Less' : `Show All (${upcomingExpenses.length + overdueExpenses.length})` }}
        </UButton>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-check-circle" class="w-8 h-8 text-gray-400" />
      </div>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        No upcoming expenses in the next 30 days
      </p>
    </div>

    <!-- Quick Stats -->
    <div v-if="!loading && (overdueExpenses.length > 0 || upcomingExpenses.length > 0)" class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="grid grid-cols-2 gap-4 text-center">
        <div>
          <p class="text-2xl font-bold text-red-600 dark:text-red-400">
            {{ overdueExpenses.length }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
        </div>
        <div>
          <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {{ upcomingExpenses.filter(e => e.daysUntilDue <= 7).length }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Due This Week</p>
        </div>
      </div>
    </div>
  </div>
</template>