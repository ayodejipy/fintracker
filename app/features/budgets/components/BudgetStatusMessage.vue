<script setup lang="ts">
import { formatCurrency } from '../../../utils/currency'

// Props
interface Props {
  status: 'under_budget' | 'near_limit' | 'over_budget'
  remaining: number
}

defineProps<Props>()
</script>

<template>
  <!-- Over Budget Warning -->
  <div v-if="status === 'over_budget'" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
    <div class="flex items-center space-x-2">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-600" />
      <p class="text-sm text-red-700">
        You've exceeded this budget by {{ formatCurrency(Math.abs(remaining)) }}
      </p>
    </div>
  </div>

  <!-- Near Limit Warning -->
  <div v-else-if="status === 'near_limit'" class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
    <div class="flex items-center space-x-2">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-yellow-600" />
      <p class="text-sm text-yellow-700">
        You're approaching your budget limit. {{ formatCurrency(remaining) }} remaining.
      </p>
    </div>
  </div>
</template>
