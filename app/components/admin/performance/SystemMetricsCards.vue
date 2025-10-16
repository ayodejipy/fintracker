<script setup lang="ts">
import type { SystemMetrics } from '~/schemas/performance'

interface Props {
  systemMetrics: SystemMetrics | null
  loading?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  loading: false,
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- CPU Usage -->
    <div class="metric-card bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-blue-900">
            CPU Usage
          </h3>
          <p class="text-2xl font-bold text-blue-700">
            {{ systemMetrics?.cpu?.usage?.toFixed(1) || '0' }}%
          </p>
        </div>
        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <UIcon name="i-heroicons-chart-bar" class="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <div class="mt-2">
        <div class="w-full bg-blue-200 rounded-full h-2">
          <div
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${Math.min(systemMetrics?.cpu?.usage || 0, 100)}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Memory Usage -->
    <div class="metric-card bg-green-50 p-4 rounded-lg border border-green-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-green-900">
            Memory Usage
          </h3>
          <p class="text-2xl font-bold text-green-700">
            {{ systemMetrics?.memory?.current?.heapUsed || '0 MB' }}
          </p>
        </div>
        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <UIcon name="i-heroicons-server" class="w-6 h-6 text-green-600" />
        </div>
      </div>
      <div class="mt-2 text-xs text-green-600">
        Total: {{ systemMetrics?.memory?.current?.heapTotal || '0 MB' }}
      </div>
    </div>

    <!-- Event Loop Lag -->
    <div class="metric-card bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-medium text-yellow-900">
            Event Loop Lag
          </h3>
          <p class="text-2xl font-bold text-yellow-700">
            {{ systemMetrics?.eventLoop?.lag?.toFixed(1) || '0' }}ms
          </p>
        </div>
        <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
          <UIcon name="i-heroicons-clock" class="w-6 h-6 text-yellow-600" />
        </div>
      </div>
      <div class="mt-2">
        <span
          class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
          :class="systemMetrics?.eventLoop?.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
        >
          {{ systemMetrics?.eventLoop?.status === 'ok' ? 'Healthy' : 'Warning' }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  transition: transform 0.2s ease-in-out;
}

.metric-card:hover {
  transform: translateY(-2px);
}
</style>
