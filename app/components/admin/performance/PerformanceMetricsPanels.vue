<script setup lang="ts">
import type { PerformanceMetrics } from '~/schemas/performance'

interface Props {
  metrics: PerformanceMetrics | null
  loading?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  loading: false,
})
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- API Performance -->
    <div class="bg-gray-50 p-6 rounded-lg">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        API Performance
      </h3>
      <div v-if="metrics?.api" class="space-y-3">
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Average Response Time</span>
          <span class="text-sm font-medium">{{ metrics.api.avg }}ms</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">95th Percentile</span>
          <span class="text-sm font-medium">{{ metrics.api.p95 }}ms</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Total Requests</span>
          <span class="text-sm font-medium">{{ metrics.api.count }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Threshold Violations</span>
          <span class="text-sm font-medium text-red-600">{{ metrics.api.thresholdViolations }}</span>
        </div>
      </div>
      <div v-else class="text-sm text-gray-500">
        No API metrics available
      </div>
    </div>

    <!-- Database Performance -->
    <div class="bg-gray-50 p-6 rounded-lg">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        Database Performance
      </h3>
      <div v-if="metrics?.database" class="space-y-3">
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Average Query Time</span>
          <span class="text-sm font-medium">{{ metrics.database.avg }}ms</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">95th Percentile</span>
          <span class="text-sm font-medium">{{ metrics.database.p95 }}ms</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Total Queries</span>
          <span class="text-sm font-medium">{{ metrics.database.count }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-sm text-gray-600">Slow Queries</span>
          <span class="text-sm font-medium text-red-600">{{ metrics.database.thresholdViolations }}</span>
        </div>
      </div>
      <div v-else class="text-sm text-gray-500">
        No database metrics available
      </div>
    </div>
  </div>
</template>
