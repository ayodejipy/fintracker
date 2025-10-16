<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard } from '~/composables/useDashboard'
import { formatCurrency } from '~/utils/currency'

// Composables
const { savingsSummary } = useDashboard()

// Computed properties
const hasGoals = computed(() => {
  return savingsSummary.value?.goals && savingsSummary.value.goals.length > 0
})

const sortedGoals = computed(() => {
  if (!savingsSummary.value?.goals) { return [] }
  return [...savingsSummary.value.goals].sort((a, b) => b.progress - a.progress)
})

const overallProgress = computed(() => {
  return savingsSummary.value?.progress || 0
})

const progressColor = computed(() => {
  const progress = overallProgress.value
  if (progress >= 80) { return 'green' }
  if (progress >= 60) { return 'blue' }
  if (progress >= 40) { return 'yellow' }
  return 'red'
})
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">
        Savings Progress
      </h2>
      <div v-if="savingsSummary" class="text-sm text-gray-500">
        {{ savingsSummary.activeGoals }} active goals
      </div>
    </div>

    <div v-if="!hasGoals" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No savings goals
      </h3>
      <p class="text-gray-500 mb-4">
        Create savings goals to track your progress.
      </p>
      <NuxtLink to="/savings" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Create Goal
      </NuxtLink>
    </div>

    <div v-else class="space-y-6">
      <!-- Overall Progress -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-medium text-gray-900">
            Overall Progress
          </h3>
          <span
            class="text-sm font-medium" :class="{
              'text-green-600': progressColor === 'green',
              'text-blue-600': progressColor === 'blue',
              'text-yellow-600': progressColor === 'yellow',
              'text-red-600': progressColor === 'red',
            }"
          >
            {{ Math.round(overallProgress) }}%
          </span>
        </div>

        <div class="w-full bg-gray-200 rounded-full h-4 mb-3">
          <div
            class="h-4 rounded-full transition-all duration-500" :class="{
              'bg-green-500': progressColor === 'green',
              'bg-blue-500': progressColor === 'blue',
              'bg-yellow-500': progressColor === 'yellow',
              'bg-red-500': progressColor === 'red',
            }" :style="{ width: `${overallProgress}%` }"
          />
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-gray-500">
              Total Saved
            </p>
            <p class="font-semibold text-green-600">
              {{ formatCurrency(savingsSummary?.totalCurrent || 0) }}
            </p>
          </div>
          <div>
            <p class="text-gray-500">
              Total Target
            </p>
            <p class="font-semibold text-gray-900">
              {{ formatCurrency(savingsSummary?.totalTarget || 0) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Individual Goals -->
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          Individual Goals
        </h3>
        <div class="space-y-3">
          <div
            v-for="goal in sortedGoals" :key="goal.id"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex-1">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-gray-900">
                  {{ goal.name }}
                </h4>
                <span
                  class="text-sm font-medium" :class="{
                    'text-green-600': goal.progress >= 100,
                    'text-blue-600': goal.progress >= 75,
                    'text-yellow-600': goal.progress >= 50,
                    'text-red-600': goal.progress < 50,
                  }"
                >
                  {{ Math.round(goal.progress) }}%
                </span>
              </div>

              <div class="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  class="h-2 rounded-full transition-all duration-300" :class="{
                    'bg-green-500': goal.progress >= 100,
                    'bg-blue-500': goal.progress >= 75,
                    'bg-yellow-500': goal.progress >= 50,
                    'bg-red-500': goal.progress < 50,
                  }" :style="{ width: `${Math.min(goal.progress, 100)}%` }"
                />
              </div>

              <div class="flex justify-between text-xs text-gray-500">
                <span>{{ formatCurrency(goal.current) }}</span>
                <span>{{ formatCurrency(goal.target) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Contributions Summary -->
      <div class="pt-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">
              Monthly Contributions
            </p>
            <p class="text-lg font-semibold text-blue-600">
              {{ formatCurrency(savingsSummary?.monthlyContributions || 0) }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-500">
              Remaining to Save
            </p>
            <p class="text-lg font-semibold text-gray-900">
              {{ formatCurrency((savingsSummary?.totalTarget || 0) - (savingsSummary?.totalCurrent || 0)) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
