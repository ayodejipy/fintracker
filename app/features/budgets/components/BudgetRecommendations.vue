<script setup lang="ts">
import type { BudgetAnalysisResponse } from '~/types'

// Props
interface Props {
  recommendations: BudgetAnalysisResponse['data']['recommendations']
}

defineProps<Props>()

// Helper function to get recommendation title
function getRecommendationTitle(type: string): string {
  switch (type) {
    case 'savings':
      return 'Savings Opportunity'
    case 'reallocation':
      return 'Reallocation Suggestion'
    case 'adjustment':
      return 'Budget Adjustment'
    default:
      return 'Recommendation'
  }
}
</script>

<template>
  <UCard v-if="recommendations && recommendations.length > 0">
    <template #header>
      <h3 class="text-lg font-semibold">
        Recommendations
      </h3>
    </template>

    <div class="space-y-3">
      <div
        v-for="(recommendation, index) in recommendations" :key="index"
        class="p-4 bg-blue-50 rounded-lg border border-blue-200"
      >
        <div class="flex items-start space-x-3">
          <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-blue-900">
              {{ getRecommendationTitle(recommendation.type) }}
            </p>
            <p class="text-sm text-blue-700 mt-1">
              {{ recommendation.message }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
