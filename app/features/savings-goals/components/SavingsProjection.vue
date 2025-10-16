<script setup lang="ts">
import type { SavingsGoal } from '~/types'
import { onMounted, ref } from 'vue'
import { useSavingsGoalDelete } from '~/features/savings-goals/composables/useSavingsGoalDelete'
import { useSavingsGoals } from '~/features/savings-goals/composables/useSavingsGoals'
import { formatCurrency } from '~/utils/currency'

// Composables
const {
  savingsGoals,
  loading,
  error,
  fetchSavingsGoals,
  totalTargetAmount,
  totalCurrentAmount,
  totalMonthlyContributions,
  activeGoals,
  completedGoals,
  overallProgress,
} = useSavingsGoals()

const { deleteSavingsGoal } = useSavingsGoalDelete()

// Local state
const showAddForm = ref(false)
const editingGoal = ref<SavingsGoal | null>(null)
const contributionGoal = ref<SavingsGoal | null>(null)
const projectionGoal = ref<SavingsGoal | null>(null)
const showAnalytics = ref(false)

// Load savings goals on mount
onMounted(() => {
  fetchSavingsGoals()
})

// Event handlers
function handleAddContribution(goal: SavingsGoal) {
  contributionGoal.value = goal
}

function handleEditGoal(goal: SavingsGoal) {
  editingGoal.value = goal
}

async function handleDeleteGoal(goal: SavingsGoal) {
  await deleteSavingsGoal(goal, fetchSavingsGoals)
}

function handleViewProjection(goal: SavingsGoal) {
  projectionGoal.value = goal
}

function closeForm() {
  showAddForm.value = false
  editingGoal.value = null
}

function handleFormSuccess() {
  closeForm()
  fetchSavingsGoals() // Refresh the list
}

function handleContributionSuccess() {
  contributionGoal.value = null
  fetchSavingsGoals() // Refresh the list
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header with summary -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
          Savings Goals
        </h2>
        <div class="flex gap-3">
          <button
            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            @click="showAnalytics = true"
          >
            View Analytics
          </button>
          <button
            class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            @click="showAddForm = true"
          >
            Add Goal
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 p-4 rounded-lg">
          <p class="text-sm text-blue-600 font-medium">
            Total Target
          </p>
          <p class="text-2xl font-bold text-blue-700">
            {{ formatCurrency(totalTargetAmount) }}
          </p>
        </div>
        <div class="bg-green-50 p-4 rounded-lg">
          <p class="text-sm text-green-600 font-medium">
            Current Savings
          </p>
          <p class="text-2xl font-bold text-green-700">
            {{ formatCurrency(totalCurrentAmount) }}
          </p>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg">
          <p class="text-sm text-purple-600 font-medium">
            Monthly Contributions
          </p>
          <p class="text-2xl font-bold text-purple-700">
            {{ formatCurrency(totalMonthlyContributions) }}
          </p>
        </div>
        <div class="bg-yellow-50 p-4 rounded-lg">
          <p class="text-sm text-yellow-600 font-medium">
            Overall Progress
          </p>
          <p class="text-2xl font-bold text-yellow-700">
            {{ Math.round(overallProgress) }}%
          </p>
        </div>
      </div>

      <!-- Overall progress bar -->
      <div v-if="totalTargetAmount > 0" class="mt-4">
        <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
          <span>Overall Progress</span>
          <span>{{ formatCurrency(totalCurrentAmount) }} of {{ formatCurrency(totalTargetAmount) }}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            class="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-300"
            :style="{ width: `${overallProgress}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-700">
        {{ error }}
      </p>
      <button class="mt-2 text-red-600 hover:text-red-800 underline" @click="fetchSavingsGoals">
        Try again
      </button>
    </div>

    <!-- Savings goals list -->
    <div v-else class="space-y-4">
      <!-- Active goals -->
      <div v-if="activeGoals.length > 0">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Active Goals
        </h3>
        <div class="space-y-3">
          <SavingsGoalItem
            v-for="goal in activeGoals" :key="goal.id" :goal="goal"
            @add-contribution="handleAddContribution" @edit="handleEditGoal" @delete="handleDeleteGoal"
            @view-projection="handleViewProjection"
          />
        </div>
      </div>

      <!-- Completed goals -->
      <div v-if="completedGoals.length > 0" class="mt-8">
        <h3 class="text-lg font-medium text-gray-500 dark:text-gray-400 mb-3">
          Completed Goals
        </h3>
        <div class="space-y-3">
          <SavingsGoalItem
            v-for="goal in completedGoals" :key="goal.id" :goal="goal" :is-completed="true"
            @delete="handleDeleteGoal" @view-projection="handleViewProjection"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="savingsGoals.length === 0" class="text-center py-12">
        <div class="text-gray-400 dark:text-gray-500 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No savings goals yet
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          Start setting savings goals to track your financial progress.
        </p>
        <button
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          @click="showAddForm = true"
        >
          Create Your First Goal
        </button>
      </div>
    </div>

    <!-- Add/Edit Goal Modal -->
    <SavingsGoalForm
      v-if="showAddForm || editingGoal" :goal="editingGoal" @close="closeForm"
      @success="handleFormSuccess"
    />

    <!-- Contribution Modal -->
    <ContributionModal
      v-if="contributionGoal" :goal="contributionGoal" @close="contributionGoal = null"
      @success="handleContributionSuccess"
    />

    <!-- Projection Modal -->
    <SavingsProjectionModal v-if="projectionGoal" :goal="projectionGoal" @close="projectionGoal = null" />

    <!-- Analytics Modal -->
    <SavingsAnalyticsModal v-if="showAnalytics" @close="showAnalytics = false" />
  </div>
</template>
