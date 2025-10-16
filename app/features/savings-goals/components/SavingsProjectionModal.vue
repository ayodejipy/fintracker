<script setup lang="ts">
import type { SavingsGoal } from '~/types'
import { computed, onMounted, ref } from 'vue'
import { useSavingsGoals } from '~/features/savings-goals/composables/useSavingsGoals'
import { formatCurrency } from '~/utils/currency'
import { formatDate } from '~/utils/date'

interface Props {
  goal: SavingsGoal
}

interface Emits {
  close: []
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Composables
const { getSavingsProjection } = useSavingsGoals()

interface MonthlyProjection {
  month: number
  date: string
  projectedAmount: number
  contribution: number
  isComplete: boolean
}

interface ProjectionData {
  goalId: string
  goalName: string
  currentAmount: number
  targetAmount: number
  remainingAmount: number
  monthlyContribution: number
  targetDate: string
  monthsUntilTarget: number
  monthsNeeded: number | null
  projectedCompletionDate: string | null
  completionDate?: string | null
  isAchievable: boolean
  isOnTrack?: boolean
  requiredMonthlyContribution: number
  progressPercentage: number
  totalContributions?: number
  monthlyProjection: MonthlyProjection[]
  insights: {
    onTrack: boolean
    daysRemaining: number
    averageDailySavingsNeeded: number
  }
}

// Local state
const projection = ref<ProjectionData | null>(null)
const loading = ref(false)
const error = ref<string>('')
const showFullProjection = ref(false)

// Computed
const displayedProjection = computed(() => {
  if (!projection.value?.monthlyProjection) { return [] }

  const projections = projection.value?.monthlyProjection?.map((month: MonthlyProjection, index: number) => ({
    month: month.month || index + 1,
    date: month.date,
    startingBalance: index === 0 ? props.goal.currentAmount : projection.value?.monthlyProjection[index - 1]?.projectedAmount || 0,
    contribution: month.contribution,
    endingBalance: month.projectedAmount,
    progressPercentage: (month.projectedAmount / props.goal.targetAmount) * 100,
    isComplete: month.isComplete
  })) || []

  if (showFullProjection.value) {
    return projections
  }

  return projections.slice(0, 12)
})

// Methods
async function loadProjection() {
  try {
    loading.value = true
    error.value = ''

    const response = await getSavingsProjection(props.goal.id)
    projection.value = response.data || response
  }
  catch (err: unknown) {
    console.error('Error loading projection:', err)
    error.value = (err as Error).message || 'Failed to load projection'
  }
  finally {
    loading.value = false
  }
}

function calculateScenario(extraMonthly: number) {
  if (!projection.value || props.goal.monthlyContribution <= 0) { return { months: 0, savings: 0 } }

  const currentMonths = projection.value.monthsNeeded || 0
  const newContribution = props.goal.monthlyContribution + extraMonthly
  const remainingAmount = props.goal.targetAmount - props.goal.currentAmount
  const newMonths = Math.ceil(remainingAmount / newContribution)

  return {
    months: Math.max(0, currentMonths - newMonths),
    newMonths,
  }
}

// Load projection on mount
onMounted(() => {
  loadProjection()
})
</script>

<template>
  <UModal :open="true" :close="true" :dismissible="true" :ui="{ wrapper: 'max-w-6xl', footer: 'justify-end' }" @close="$emit('close')">
    <template #header>
      <div class="flex items-center justify-between flex-1 py-3">
        <div class="flex items-center gap-3">
          <div
            class="size-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm"
          >
            <UIcon name="i-heroicons-chart-bar-square" class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Savings Projection
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ goal.name }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #body>
      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-700 dark:text-red-400">
          {{ error }}
        </p>
        <button
          class="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
          @click="loadProjection"
        >
          Try again
        </button>
      </div>

      <!-- Projection content -->
      <div v-else-if="projection" class="space-y-6">
        <!-- Goal summary -->
        <div class="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Current Amount
              </p>
              <p class="text-lg font-semibold text-green-600 dark:text-green-400">
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
              <p class="text-lg font-semibold text-blue-600 dark:text-blue-400">
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
        </div>

        <!-- Key insights -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 class="font-medium text-blue-900 dark:text-blue-300 mb-2">
              Timeline
            </h3>
            <div class="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <p v-if="projection.monthsNeeded">
                <strong>{{ projection.monthsNeeded }} months</strong> to reach goal
              </p>
              <p v-if="projection.projectedCompletionDate">
                Expected completion: <strong>{{ formatDate(projection.projectedCompletionDate) }}</strong>
              </p>
              <p v-if="projection.isAchievable !== undefined">
                Status: <span :class="projection.isAchievable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                  {{ projection.isAchievable ? 'On Track' : 'Behind Schedule' }}
                </span>
              </p>
            </div>
          </div>

          <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h3 class="font-medium text-green-900 dark:text-green-300 mb-2">
              Progress
            </h3>
            <div class="text-sm text-green-700 dark:text-green-400 space-y-1">
              <p v-if="projection.progressPercentage !== undefined">
                <strong>{{ Math.round(projection.progressPercentage) }}%</strong> complete
              </p>
              <p v-if="projection.remainingAmount">
                <strong>{{ formatCurrency(projection.remainingAmount) }}</strong> remaining
              </p>
              <p v-if="projection.monthlyContribution && projection.monthsNeeded">
                Total contributions needed: <strong>{{ formatCurrency(projection.monthlyContribution * projection.monthsNeeded) }}</strong>
              </p>
            </div>
          </div>
        </div>

        <!-- What-if scenarios -->
        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h3 class="font-medium text-yellow-900 dark:text-yellow-300 mb-3">
            What-If Scenarios
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="bg-white dark:bg-gray-800 p-3 rounded">
              <p class="text-gray-600 dark:text-gray-400 mb-1">
                Extra ₦5,000/month
              </p>
              <p class="font-medium text-yellow-700 dark:text-yellow-400">
                Save {{ calculateScenario(5000).months }} months
              </p>
            </div>
            <div class="bg-white dark:bg-gray-800 p-3 rounded">
              <p class="text-gray-600 dark:text-gray-400 mb-1">
                Extra ₦10,000/month
              </p>
              <p class="font-medium text-yellow-700 dark:text-yellow-400">
                Save {{ calculateScenario(10000).months }} months
              </p>
            </div>
            <div class="bg-white dark:bg-gray-800 p-3 rounded">
              <p class="text-gray-600 dark:text-gray-400 mb-1">
                Double contribution
              </p>
              <p class="font-medium text-yellow-700 dark:text-yellow-400">
                Complete in {{ calculateScenario(goal.monthlyContribution).newMonths }} months
              </p>
            </div>
          </div>
        </div>

        <!-- Monthly projection table -->
        <div v-if="projection.monthlyProjection?.length > 0">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-gray-900 dark:text-white">
              Monthly Projection
            </h3>
            <button
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
              @click="showFullProjection = !showFullProjection"
            >
              {{ showFullProjection ? 'Show Less' : 'Show All' }}
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Month
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Monthly Contribution
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Projected Balance
                  </th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(month, index) in displayedProjection" :key="index" :class="{ 'bg-green-50 dark:bg-green-900/20': month.isComplete }">
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">
                    {{ month.month }}
                  </td>
                  <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(month.date) }}
                  </td>
                  <td class="px-4 py-2 text-sm text-green-600 dark:text-green-400">
                    {{ formatCurrency(month.contribution) }}
                  </td>
                  <td class="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                    {{ formatCurrency(month.endingBalance) }}
                  </td>
                  <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    <div class="flex items-center gap-2">
                      <span>{{ Math.round(month.progressPercentage) }}%</span>
                      <div v-if="month.isComplete" class="text-green-600 dark:text-green-400">
                        <UIcon name="i-heroicons-check-circle" class="w-4 h-4" />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <UButton
          variant="outline"
          size="lg"
          @click="$emit('close')"
        >
          Close
        </UButton>
      </div>
    </template>
  </UModal>
</template>

