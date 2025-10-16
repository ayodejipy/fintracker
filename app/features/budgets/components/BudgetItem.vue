<script setup lang="ts">
import type { Budget } from '~/types'
import { getCategoryColor, getCategoryDisplayName } from '../../../utils/categories'
import { formatCurrency } from '../../../utils/currency'

// Props
interface Props {
  budget: Budget
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

// Emits
interface Emits {
  edit: [budget: Budget]
  delete: [budget: Budget]
}

// Computed
const budgetMetrics = computed(() => {
  const utilizationRate = props.budget.monthlyLimit > 0
    ? (props.budget.currentSpent / props.budget.monthlyLimit) * 100
    : 0

  const remaining = props.budget.monthlyLimit - props.budget.currentSpent

  let status: 'under_budget' | 'near_limit' | 'over_budget'
  if (props.budget.currentSpent > props.budget.monthlyLimit) {
    status = 'over_budget'
  }
  else if (utilizationRate >= 80) {
    status = 'near_limit'
  }
  else {
    status = 'under_budget'
  }

  return {
    utilizationRate,
    remaining,
    status,
  }
})

const statusStyles = computed(() => {
  const { status } = budgetMetrics.value

  const styles = {
    under_budget: {
      textColor: 'text-green-600',
      progressColor: 'bg-green-500',
      badgeColor: 'success' as const,
      label: 'Under Budget',
    },
    near_limit: {
      textColor: 'text-yellow-600',
      progressColor: 'bg-yellow-500',
      badgeColor: 'warning' as const,
      label: 'Near Limit',
    },
    over_budget: {
      textColor: 'text-red-600',
      progressColor: 'bg-red-500',
      badgeColor: 'error' as const,
      label: 'Over Budget',
    },
  }

  return styles[status]
})

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
    onClick: () => emit('edit', props.budget),
  }],
  [{
    label: 'Delete',
    icon: 'i-heroicons-trash',
    onClick: () => emit('delete', props.budget),
  }],
])
</script>

<template>
  <div class="p-4 bg-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50 transition-colors">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-3">
        <!-- Category Icon -->
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center"
          :style="{ backgroundColor: `${getCategoryColor(budget.category)}20` }"
        >
          <UIcon
            :name="getCategoryIcon(budget.category)"
            class="w-5 h-5"
            :style="{ color: getCategoryColor(budget.category) }"
          />
        </div>

        <!-- Category Info -->
        <div>
          <h4 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ getCategoryDisplayName(budget.category) }}
          </h4>
          <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            {{ formatCurrency(budget.currentSpent) }} of {{ formatCurrency(budget.monthlyLimit) }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <UDropdownMenu :items="actionItems" :popper="{ placement: 'bottom-end' }">
        <UButton
          variant="ghost" size="md" icon="i-heroicons-ellipsis-vertical"
          class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        />
      </UDropdownMenu>
    </div>

    <!-- Progress Bar -->
    <div class="mb-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
        <span class="text-sm font-medium" :class="statusStyles.textColor">
          {{ budgetMetrics.utilizationRate.toFixed(1) }}%
        </span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          class="h-2 rounded-full transition-all duration-300"
          :class="statusStyles.progressColor"
          :style="{ width: `${Math.min(budgetMetrics.utilizationRate, 100)}%` }"
        />
      </div>
    </div>

    <!-- Status and Remaining -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <UBadge
          :color="statusStyles.badgeColor"
          variant="soft"
          size="xs"
        >
          {{ statusStyles.label }}
        </UBadge>
      </div>

      <div class="text-right">
        <p class="text-sm font-medium" :class="budgetMetrics.remaining >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ budgetMetrics.remaining >= 0 ? '+' : '' }}{{ formatCurrency(budgetMetrics.remaining) }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
          {{ budgetMetrics.remaining >= 0 ? 'remaining' : 'over budget' }}
        </p>
      </div>
    </div>

    <!-- Status Messages -->
    <BudgetStatusMessage
      :status="budgetMetrics.status"
      :remaining="budgetMetrics.remaining"
    />
  </div>
</template>
