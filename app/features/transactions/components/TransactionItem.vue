<script setup lang="ts">
import type { Transaction } from '~/types'
import { getCategoryColor, getCategoryDisplayName } from '../../../utils/categories'
import { formatCurrency } from '../../../utils/currency'
import { formatDate, formatTime } from '../../../utils/date'

// Props
interface Props {
  transaction: Transaction
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

// Emits
interface Emits {
  edit: [transaction: Transaction]
  delete: [transaction: Transaction]
}

// Category icons mapping
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
    onClick: () => emit('edit', props.transaction),
  }],
  [{
    label: 'Delete',
    icon: 'i-heroicons-trash',
    onClick: () => emit('delete', props.transaction),
  }],
])
</script>

<template>
  <div
    class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50 transition-colors border-l-4"
    :class="transaction.type === 'income' ? 'border-l-green-500' : 'border-l-red-500'"
  >
    <!-- Transaction Info -->
    <div class="flex items-center gap-4 flex-1 min-w-0">
      <!-- Category Icon -->
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
        :style="{ backgroundColor: `${getCategoryColor(transaction.category)}15` }"
      >
        <UIcon
          :name="getCategoryIcon(transaction.category)" class="w-6 h-6"
          :style="{ color: getCategoryColor(transaction.category) }"
        />
      </div>

      <!-- Transaction Details -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 mb-1 min-w-0">
          <h4
            class="text-sm font-semibold text-gray-900 dark:text-white truncate"
            :title="transaction.description"
          >
            {{ transaction.description }}
          </h4>
          <div class="flex items-center gap-2 flex-shrink-0">
            <UBadge
              :color="transaction.type === 'income' ? 'success' : 'error'" variant="soft" size="xs"
            >
              {{ transaction.type }}
            </UBadge>
            <!-- Recurring indicator -->
            <UBadge
              v-if="transaction.isRecurring"
              color="primary"
              variant="soft"
              size="xs"
              class="flex items-center gap-1"
            >
              <UIcon name="i-heroicons-arrow-path" class="w-3 h-3" />
              Recurring
            </UBadge>
          </div>
        </div>
        <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <span class="flex items-center gap-1">
            <UIcon name="i-heroicons-tag" class="w-3 h-3" />
            {{ getCategoryDisplayName(transaction.category) }}
          </span>
          <span class="flex items-center gap-1">
            <UIcon name="i-heroicons-calendar-days" class="w-3 h-3" />
            {{ formatDate(transaction.date) }}
          </span>
          <span class="flex items-center gap-1">
            <UIcon name="i-heroicons-clock" class="w-3 h-3" />
            {{ formatTime(transaction.date) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Amount and Actions -->
    <div class="flex items-center space-x-4 flex-shrink-0">
      <!-- Amount -->
      <div class="text-right">
        <p class="text-lg font-bold" :class="transaction.type === 'income' ? 'text-green-600' : 'text-red-600'">
          {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
        </p>
      </div>

      <!-- Actions -->
      <UDropdownMenu :items="actionItems" :popper="{ placement: 'bottom-end' }">
        <UButton
          variant="ghost" size="sm" icon="i-heroicons-ellipsis-vertical"
          class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
        />
      </UDropdownMenu>
    </div>
  </div>
</template>
