<script setup lang="ts">
import type { CacheStats } from '~/schemas/performance'

interface Props {
  cacheStats: CacheStats | null
  loading?: boolean
}

const _props = withDefaults(defineProps<Props>(), {
  loading: false,
})
</script>

<template>
  <div class="bg-gray-50 p-6 rounded-lg">
    <h3 class="text-lg font-semibold text-gray-900 mb-4">
      Cache Performance
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600">
          {{ cacheStats?.dashboard?.hitRate?.toFixed(1) || '0' }}%
        </div>
        <div class="text-sm text-gray-600">
          Dashboard Hit Rate
        </div>
        <div class="text-xs text-gray-500 mt-1">
          {{ cacheStats?.dashboard?.hits || 0 }} hits / {{ cacheStats?.dashboard?.misses || 0 }} misses
        </div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">
          {{ cacheStats?.transactions?.hitRate?.toFixed(1) || '0' }}%
        </div>
        <div class="text-sm text-gray-600">
          Transactions Hit Rate
        </div>
        <div class="text-xs text-gray-500 mt-1">
          {{ cacheStats?.transactions?.hits || 0 }} hits / {{ cacheStats?.transactions?.misses || 0 }} misses
        </div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-purple-600">
          {{ cacheStats?.budgets?.hitRate?.toFixed(1) || '0' }}%
        </div>
        <div class="text-sm text-gray-600">
          Budgets Hit Rate
        </div>
        <div class="text-xs text-gray-500 mt-1">
          {{ cacheStats?.budgets?.hits || 0 }} hits / {{ cacheStats?.budgets?.misses || 0 }} misses
        </div>
      </div>
      <div class="text-center">
        <div class="text-2xl font-bold text-orange-600">
          {{ cacheStats?.calculations?.hitRate?.toFixed(1) || '0' }}%
        </div>
        <div class="text-sm text-gray-600">
          Calculations Hit Rate
        </div>
        <div class="text-xs text-gray-500 mt-1">
          {{ cacheStats?.calculations?.hits || 0 }} hits / {{ cacheStats?.calculations?.misses || 0 }} misses
        </div>
      </div>
    </div>
  </div>
</template>
