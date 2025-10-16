<script setup lang="ts">
import { formatCurrency } from '../../../utils/currency'

// Props
interface Props {
  totalBudget: number
  totalSpent: number
  totalRemaining: number
  utilizationRate: number
}

defineProps<Props>()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    <UCard>
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-banknotes" class="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Total Budget
          </p>
          <p class="text-2xl font-bold text-blue-600">
            {{ formatCurrency(totalBudget) }}
          </p>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-trending-down" class="w-5 h-5 text-red-600" />
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Total Spent
          </p>
          <p class="text-2xl font-bold text-red-600">
            {{ formatCurrency(totalSpent) }}
          </p>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-trending-up" class="w-5 h-5 text-green-600" />
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Remaining
          </p>
          <p class="text-2xl font-bold" :class="totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatCurrency(totalRemaining) }}
          </p>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-chart-pie" class="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400 dark:text-gray-500">
            Utilization
          </p>
          <p class="text-2xl font-bold text-purple-600">
            {{ utilizationRate.toFixed(1) }}%
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
