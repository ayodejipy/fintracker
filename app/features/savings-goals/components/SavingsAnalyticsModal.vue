<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSavingsGoals } from '~/features/savings-goals/composables/useSavingsGoals'
import { formatCurrency } from '~/utils/currency'

interface Emits {
  close: []
}

defineEmits<Emits>()

// Composables
const { getSavingsAnalytics } = useSavingsGoals()

// Local state
const analytics = ref<any>(null)
const loading = ref(false)
const error = ref<string>('')

// Methods
async function loadAnalytics() {
  try {
    loading.value = true
    error.value = ''

    analytics.value = await getSavingsAnalytics()
  }
  catch (err: any) {
    console.error('Error loading analytics:', err)
    error.value = err.message || 'Failed to load analytics'
  }
  finally {
    loading.value = false
  }
}

// Load analytics on mount
onMounted(() => {
  loadAnalytics()
})
</script>

<template>
  <UModal :open="true" :close="true" :dismissible="true" @close="$emit('close')" :ui="{ wrapper: 'max-w-6xl', footer: 'justify-end' }">
    <template #header>
      <div class="flex items-center justify-between flex-1 py-3">
        <div class="flex items-center gap-3">
          <div
            class="size-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm"
          >
            <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Savings Analytics
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Track your savings performance and achievements
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
          @click="loadAnalytics"
        >
          Try again
        </button>
      </div>

      <!-- Analytics content -->
      <div v-else-if="analytics" class="space-y-6">
          <!-- Overview metrics -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p class="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Total Goals
              </p>
              <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {{ analytics.overview?.totalGoals || 0 }}
              </p>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p class="text-sm text-green-600 dark:text-green-400 font-medium">
                Completed Goals
              </p>
              <p class="text-2xl font-bold text-green-700 dark:text-green-300">
                {{ analytics.overview?.completedGoals || 0 }}
              </p>
            </div>
            <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p class="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                Overall Progress
              </p>
              <p class="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {{ Math.round(analytics.overview?.overallProgressPercentage || 0) }}%
              </p>
            </div>
            <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p class="text-sm text-purple-600 dark:text-purple-400 font-medium">
                On Track
              </p>
              <p class="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {{ analytics.analytics?.goalsOnTrack || 0 }}
              </p>
            </div>
          </div>

          <!-- Savings performance -->
          <div class="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Savings Performance
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Total Saved
                </p>
                <p class="text-xl font-semibold text-green-600 dark:text-green-400">
                  {{ formatCurrency(analytics.overview?.totalCurrentAmount || 0) }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Monthly Average
                </p>
                <p class="text-xl font-semibold text-blue-600 dark:text-blue-400">
                  {{ formatCurrency(analytics.analytics?.averageMonthlySavings || 0) }}
                </p>
              </div>
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Total Target
                </p>
                <p class="text-xl font-semibold text-purple-600 dark:text-purple-400">
                  {{ formatCurrency(analytics.overview?.totalTargetAmount || 0) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Goal Progress -->
          <div v-if="analytics.goalProgress?.length > 0">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Individual Goal Progress
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="goal in analytics.goalProgress.slice(0, 6)"
                :key="goal.id"
                class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium text-gray-900 dark:text-white">
                    {{ goal.name }}
                  </h4>
                  <span
                    class="text-xs font-semibold px-2 py-1 rounded"
                    :class="{
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': goal.status === 'completed',
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': goal.status === 'on_track',
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': goal.status === 'behind'
                    }"
                  >
                    {{ goal.status === 'completed' ? 'Completed' : goal.status === 'on_track' ? 'On Track' : 'Behind' }}
                  </span>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600 dark:text-gray-400">Progress</span>
                    <span class="font-medium">{{ Math.round(goal.progressPercentage) }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all"
                      :class="{
                        'bg-green-500': goal.isComplete,
                        'bg-blue-500': goal.isOnTrack && !goal.isComplete,
                        'bg-red-500': !goal.isOnTrack && !goal.isComplete
                      }"
                      :style="{ width: `${Math.min(goal.progressPercentage, 100)}%` }"
                    />
                  </div>
                  <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{{ formatCurrency(goal.currentAmount) }}</span>
                    <span>{{ formatCurrency(goal.targetAmount) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Monthly Savings Trends -->
          <div v-if="analytics.monthlyTrend?.length > 0">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Monthly Savings Trends
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div
                v-for="trend in analytics.monthlyTrend"
                :key="trend.month"
                class="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-3 text-center"
              >
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {{ trend.monthName }}
                </p>
                <p class="text-sm font-semibold text-green-600 dark:text-green-400">
                  {{ formatCurrency(trend.amount) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Insights and recommendations -->
          <div v-if="analytics.insights?.length > 0" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-lg">
            <h3 class="text-lg font-medium text-blue-900 dark:text-blue-300 mb-4">
              Insights & Recommendations
            </h3>
            <div class="space-y-3">
              <div
                v-for="(insight, index) in analytics.insights"
                :key="index"
                class="flex items-start gap-3"
              >
                <div class="flex-shrink-0 mt-0.5">
                  <UIcon
                    :name="insight.type === 'success' ? 'i-heroicons-check-circle' : insight.type === 'warning' ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-information-circle'"
                    class="w-5 h-5"
                    :class="{
                      'text-green-500 dark:text-green-400': insight.type === 'success',
                      'text-yellow-500 dark:text-yellow-400': insight.type === 'warning',
                      'text-blue-500 dark:text-blue-400': insight.type === 'info'
                    }"
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ insight.title }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {{ insight.message }}
                  </p>
                </div>
              </div>
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

<style scoped>
/* Component-specific styles can be added here */
</style>
