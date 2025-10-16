<script setup lang="ts">
import { computed } from 'vue'
import { useDashboard } from '~/composables/useDashboard'

// Composables
const { insights } = useDashboard()

// Computed properties
const hasInsights = computed(() => {
  return insights.value && insights.value.length > 0
})

function getInsightIcon(type: string) {
  switch (type) {
    case 'success':
      return 'check-circle'
    case 'warning':
      return 'exclamation-triangle'
    case 'error':
      return 'x-circle'
    case 'info':
    default:
      return 'information-circle'
  }
}

function getInsightColors(type: string) {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-500',
        title: 'text-green-800',
        text: 'text-green-700',
      }
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-500',
        title: 'text-yellow-800',
        text: 'text-yellow-700',
      }
    case 'error':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-500',
        title: 'text-red-800',
        text: 'text-red-700',
      }
    case 'info':
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-500',
        title: 'text-blue-800',
        text: 'text-blue-700',
      }
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'high':
      return { text: 'High', class: 'bg-red-100 text-red-800' }
    case 'medium':
      return { text: 'Medium', class: 'bg-yellow-100 text-yellow-800' }
    case 'low':
    default:
      return { text: 'Low', class: 'bg-green-100 text-green-800' }
  }
}
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">
        Financial Insights
      </h2>
      <div v-if="hasInsights" class="text-sm text-gray-500">
        {{ insights.length }} insights
      </div>
    </div>

    <div v-if="!hasInsights" class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">
        No insights available
      </h3>
      <p class="text-gray-500">
        Add more financial data to get personalized insights.
      </p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="insight in insights" :key="insight.title"
        class="p-4 rounded-lg border" :class="[
          getInsightColors(insight.type).bg,
          getInsightColors(insight.type).border,
        ]"
      >
        <div class="flex items-start gap-3">
          <!-- Insight Icon -->
          <div class="flex-shrink-0 mt-0.5">
            <svg
              class="w-5 h-5" :class="getInsightColors(insight.type).icon"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <!-- Success Icon -->
              <path
                v-if="getInsightIcon(insight.type) === 'check-circle'"
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <!-- Warning Icon -->
              <path
                v-else-if="getInsightIcon(insight.type) === 'exclamation-triangle'"
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
              <!-- Error Icon -->
              <path
                v-else-if="getInsightIcon(insight.type) === 'x-circle'"
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <!-- Info Icon -->
              <path
                v-else
                stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <!-- Insight Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <h3 class="text-sm font-medium" :class="getInsightColors(insight.type).title">
                {{ insight.title }}
              </h3>
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="getPriorityBadge(insight.priority).class"
              >
                {{ getPriorityBadge(insight.priority).text }}
              </span>
            </div>
            <p class="text-sm" :class="getInsightColors(insight.type).text">
              {{ insight.message }}
            </p>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="pt-4 border-t border-gray-200">
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center gap-4">
            <span class="text-gray-500">
              High Priority:
              <span class="font-medium text-red-600">
                {{ insights.filter(i => i.priority === 'high').length }}
              </span>
            </span>
            <span class="text-gray-500">
              Medium Priority:
              <span class="font-medium text-yellow-600">
                {{ insights.filter(i => i.priority === 'medium').length }}
              </span>
            </span>
          </div>
          <button class="text-blue-600 hover:text-blue-800 font-medium">
            View All Insights
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
