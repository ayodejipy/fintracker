<script setup lang="ts">
import { computed } from 'vue'
import type { RecurringExpense } from '~/types'
import { formatCurrency } from '~/utils/currency'
import { formatDate } from '~/utils/date'
import { getCategoryColor, getCategoryDisplayName } from '~/utils/categories'

interface Props {
  expense: RecurringExpense
}

interface Emits {
  edit: [expense: RecurringExpense]
  delete: [expense: RecurringExpense]
  toggle: [expense: RecurringExpense]
  markAsPaid: [expense: RecurringExpense]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Computed properties
const daysUntilDue = computed(() => {
  const today = new Date()
  const dueDate = new Date(props.expense.nextDueDate)
  return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
})

const isOverdue = computed(() => daysUntilDue.value < 0)
const isDueSoon = computed(() => daysUntilDue.value >= 0 && daysUntilDue.value <= props.expense.reminderDays)

const statusColor = computed(() => {
  if (!props.expense.isActive) return 'gray'
  if (isOverdue.value) return 'red'
  if (isDueSoon.value) return 'yellow'
  return 'green'
})

const statusText = computed(() => {
  if (!props.expense.isActive) return 'Inactive'
  if (isOverdue.value) return `Overdue by ${Math.abs(daysUntilDue.value)} days`
  if (isDueSoon.value) return `Due in ${daysUntilDue.value} days`
  return `Due in ${daysUntilDue.value} days`
})

const frequencyText = computed(() => {
  const freq = props.expense.frequency
  return freq.charAt(0).toUpperCase() + freq.slice(1)
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

// Action items for dropdown
const actionItems = computed(() => [
  [{
    label: 'Edit',
    icon: 'i-heroicons-pencil-square',
    onClick: () => emit('edit', props.expense),
  }],
  [{
    label: props.expense.isActive ? 'Deactivate' : 'Activate',
    icon: props.expense.isActive ? 'i-heroicons-pause' : 'i-heroicons-play',
    onClick: () => emit('toggle', props.expense),
  }],
  [{
    label: 'Mark as Paid',
    icon: 'i-heroicons-check-circle',
    onClick: () => emit('markAsPaid', props.expense),
    disabled: !props.expense.isActive,
  }],
  [{
    label: 'Delete',
    icon: 'i-heroicons-trash',
    onClick: () => emit('delete', props.expense),
  }],
])
</script>

<template>
  <div class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
    <div class="flex items-center justify-between">
      <!-- Expense Info -->
      <div class="flex items-center space-x-4 flex-1">
        <!-- Category Icon -->
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
          :style="{ backgroundColor: `${getCategoryColor(expense.category as any)}15` }"
        >
          <UIcon
            :name="getCategoryIcon(expense.category)"
            class="w-6 h-6"
            :style="{ color: getCategoryColor(expense.category as any) }"
          />
        </div>

        <!-- Expense Details -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center space-x-3 mb-1">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {{ expense.name }}
            </h4>
            <UBadge
              :color="statusColor"
              variant="soft"
              size="xs"
            >
              {{ statusText }}
            </UBadge>
            <UBadge
              v-if="!expense.isActive"
              color="gray"
              variant="soft"
              size="xs"
            >
              Inactive
            </UBadge>
          </div>
          
          <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-tag" class="w-3 h-3" />
              {{ getCategoryDisplayName(expense.category as any) }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-arrow-path" class="w-3 h-3" />
              {{ frequencyText }}
            </span>
            <span class="flex items-center gap-1">
              <UIcon name="i-heroicons-calendar-days" class="w-3 h-3" />
              {{ formatDate(expense.nextDueDate) }}
            </span>
            <span v-if="expense.lastPaidDate" class="flex items-center gap-1">
              <UIcon name="i-heroicons-check-circle" class="w-3 h-3" />
              Last paid: {{ formatDate(expense.lastPaidDate) }}
            </span>
          </div>

          <!-- Description -->
          <p v-if="expense.description" class="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {{ expense.description }}
          </p>

          <!-- Features -->
          <div class="flex items-center space-x-4 mt-2">
            <span v-if="expense.autoCreateTransaction" class="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
              <UIcon name="i-heroicons-bolt" class="w-3 h-3" />
              Auto-create transaction
            </span>
            <span v-if="expense.reminderDays > 0" class="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
              <UIcon name="i-heroicons-bell" class="w-3 h-3" />
              {{ expense.reminderDays }} day reminder
            </span>
          </div>
        </div>
      </div>

      <!-- Amount and Actions -->
      <div class="flex items-center space-x-4 flex-shrink-0">
        <!-- Amount -->
        <div class="text-right">
          <p class="text-xl font-bold text-gray-900 dark:text-white">
            {{ formatCurrency(expense.amount) }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            per {{ expense.frequency.replace('ly', '') }}
          </p>
        </div>

        <!-- Quick Actions -->
        <div class="flex items-center space-x-2">
          <!-- Mark as Paid Button -->
          <UButton
            v-if="expense.isActive && (isDueSoon || isOverdue)"
            icon="i-heroicons-check-circle"
            color="green"
            variant="soft"
            size="sm"
            @click="emit('markAsPaid', expense)"
          >
            Mark Paid
          </UButton>

          <!-- Actions Dropdown -->
          <UDropdownMenu :items="actionItems" :popper="{ placement: 'bottom-end' }">
            <UButton
              variant="ghost"
              size="sm"
              icon="i-heroicons-ellipsis-vertical"
              class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            />
          </UDropdownMenu>
        </div>
      </div>
    </div>
  </div>
</template>