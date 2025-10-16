<script setup lang="ts">
import type { SavingsGoal } from '~/types'
import { computed } from 'vue'
import { formatCurrency } from '~/utils/currency'
import { formatDate } from '~/utils/date'

interface Props {
  goal: SavingsGoal
  isCompleted?: boolean
}

interface Emits {
  addContribution: [goal: SavingsGoal]
  edit: [goal: SavingsGoal]
  delete: [goal: SavingsGoal]
  viewProjection: [goal: SavingsGoal]
}

const props = withDefaults(defineProps<Props>(), {
  isCompleted: false,
})

defineEmits<Emits>()

// Computed properties
const progressPercentage = computed(() => {
  if (props.goal.targetAmount === 0) { return 0 }
  return Math.min((props.goal.currentAmount / props.goal.targetAmount) * 100, 100)
})

const remainingAmount = computed(() => {
  return Math.max(0, props.goal.targetAmount - props.goal.currentAmount)
})

const monthsRemaining = computed(() => {
  const today = new Date()
  const targetDate = new Date(props.goal.targetDate)
  const diffTime = targetDate.getTime() - today.getTime()
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))
  return Math.max(0, diffMonths)
})

const monthsNeeded = computed(() => {
  if (props.goal.monthlyContribution <= 0) { return Infinity }
  return Math.ceil(remainingAmount.value / props.goal.monthlyContribution)
})

const isOnTrack = computed(() => {
  return monthsNeeded.value <= monthsRemaining.value
})

const statusColor = computed(() => {
  if (props.isCompleted) { return 'green' }
  if (isOnTrack.value) { return 'blue' }
  return 'red'
})

const statusText = computed(() => {
  if (props.isCompleted) { return 'Completed' }
  if (isOnTrack.value) { return 'On Track' }
  return 'Behind Schedule'
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-amber-100 p-6">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-3 mb-3">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ goal.name }}
          </h3>
          <span
            class="px-2 py-1 text-xs font-medium rounded-full" :class="{
              'bg-green-100 text-green-800': statusColor === 'green',
              'bg-blue-100 text-blue-800': statusColor === 'blue',
              'bg-red-100 text-red-800': statusColor === 'red',
            }"
          >
            {{ statusText }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Current Amount
            </p>
            <p class="text-lg font-semibold text-green-600">
              {{ formatCurrency(goal.currentAmount) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Target Amount
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(goal.targetAmount) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Monthly Contribution
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(goal.monthlyContribution) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Target Date
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatDate(goal.targetDate) }}
            </p>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="mb-4">
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{{ Math.round(progressPercentage) }}% complete</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              class="h-2 rounded-full transition-all duration-300" :class="{
                'bg-green-500': isCompleted,
                'bg-blue-500': !isCompleted && isOnTrack,
                'bg-red-500': !isCompleted && !isOnTrack,
              }" :style="{ width: `${progressPercentage}%` }"
            />
          </div>
        </div>

        <!-- Goal details -->
        <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p v-if="!isCompleted">
            Remaining: {{ formatCurrency(remainingAmount) }}
          </p>
          <p v-if="!isCompleted && monthsRemaining > 0">
            {{ monthsRemaining }} months until target date
          </p>
          <p v-if="!isCompleted && monthsNeeded !== Infinity">
            {{ monthsNeeded }} months needed at current rate
          </p>
          <p v-if="isCompleted" class="text-green-600 font-medium">
            🎉 Goal achieved on {{ formatDate(goal.updatedAt) }}
          </p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 ml-4">
        <button
          v-if="!isCompleted" class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Add Contribution" @click="$emit('addContribution', goal)"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>

        <button
          class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View Projection" @click="$emit('viewProjection', goal)"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </button>

        <button
          v-if="!isCompleted" class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50 rounded-lg transition-colors"
          title="Edit Goal" @click="$emit('edit', goal)"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>

        <button
          class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete Goal" @click="$emit('delete', goal)"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
