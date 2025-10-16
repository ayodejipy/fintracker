<script setup lang="ts">
import type { Loan } from '~/types'
import { computed } from 'vue'
import { formatCurrency } from '~/utils/currency'
import { formatDate } from '~/utils/date'

interface Props {
  loan: Loan
  isPaidOff?: boolean
}

interface Emits {
  recordPayment: [loan: Loan]
  edit: [loan: Loan]
  delete: [loan: Loan]
  viewProjection: [loan: Loan]
}

const props = withDefaults(defineProps<Props>(), {
  isPaidOff: false,
})

const emit = defineEmits<Emits>()

// Computed properties
const progressPercentage = computed(() => {
  if (props.loan.initialAmount === 0) { return 0 }
  const paidAmount = props.loan.initialAmount - props.loan.currentBalance
  return Math.min((paidAmount / props.loan.initialAmount) * 100, 100)
})

const monthsRemaining = computed(() => {
  if (props.loan.currentBalance <= 0 || props.loan.monthlyPayment <= 0) { return 0 }

  // Simple calculation - in reality this would consider interest
  return Math.ceil(props.loan.currentBalance / props.loan.monthlyPayment)
})

const actionItems = computed(() => {
  const items = []

  if (!props.isPaidOff) {
    items.push([
      {
        label: 'Record Payment',
        icon: 'i-heroicons-banknotes',
        click: () => emit('recordPayment', props.loan),
      },
      {
        label: 'View Projection',
        icon: 'i-heroicons-chart-bar',
        click: () => emit('viewProjection', props.loan),
      },
    ])
  }

  items.push([
    {
      label: 'Edit',
      icon: 'i-heroicons-pencil-square',
      click: () => emit('edit', props.loan),
    },
    {
      label: 'Delete',
      icon: 'i-heroicons-trash',
      click: () => emit('delete', props.loan),
    },
  ])

  return items
})
</script>

<template>
  <div
    class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50 transition-colors border-l-4"
    :class="isPaidOff ? 'border-l-green-500' : 'border-l-red-500'"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
            :class="isPaidOff ? 'bg-green-100' : 'bg-red-100'"
          >
            <UIcon
              name="i-heroicons-credit-card"
              class="w-5 h-5"
              :class="isPaidOff ? 'text-green-600' : 'text-red-600'"
            />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ loan.name }}
            </h3>
            <UBadge
              :color="isPaidOff ? 'success' : 'primary'"
              variant="soft"
              size="xs"
            >
              {{ isPaidOff ? 'Paid Off' : 'Active' }}
            </UBadge>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p class="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Current Balance
            </p>
            <p class="text-lg font-bold" :class="isPaidOff ? 'text-green-600' : 'text-red-600'">
              {{ formatCurrency(loan.currentBalance) }}
            </p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Initial Amount
            </p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(loan.initialAmount) }}
            </p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Monthly Payment
            </p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(loan.monthlyPayment) }}
            </p>
          </div>
          <div>
            <p class="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Interest Rate
            </p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ loan.interestRate }}%
            </p>
          </div>
        </div>

        <!-- Progress bar for active loans -->
        <div v-if="!isPaidOff" class="mb-4">
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span class="font-medium">Progress</span>
            <span class="font-semibold">{{ Math.round(progressPercentage) }}% paid</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div
              class="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
              :style="{ width: `${progressPercentage}%` }"
            />
          </div>
        </div>

        <!-- Loan details -->
        <div class="text-sm text-gray-500 dark:text-gray-400 space-y-1">
          <p class="flex items-center gap-1">
            <UIcon name="i-heroicons-calendar-days" class="w-3 h-3" />
            Started: {{ formatDate(loan.startDate) }}
          </p>
          <p v-if="loan.projectedPayoffDate && !isPaidOff" class="flex items-center gap-1">
            <UIcon name="i-heroicons-flag" class="w-3 h-3" />
            Projected payoff: {{ formatDate(loan.projectedPayoffDate) }}
          </p>
          <p v-if="!isPaidOff && monthsRemaining > 0" class="flex items-center gap-1">
            <UIcon name="i-heroicons-clock" class="w-3 h-3" />
            Approximately {{ monthsRemaining }} months remaining
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 ml-4">
        <UDropdownMenu :items="actionItems" :popper="{ placement: 'bottom-end' }">
          <UButton
            variant="ghost"
            size="sm"
            icon="i-heroicons-ellipsis-vertical"
            class="text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-700/50"
          />
        </UDropdownMenu>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
