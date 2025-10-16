<script setup lang="ts">
const {
  loading,
  lastUpdated,
  cacheStats,
  metrics,
  systemMetrics,
  refresh,
  clearCache,
  exportMetrics,
} = usePerformanceDashboard()
</script>

<template>
  <div class="performance-dashboard p-6 bg-white rounded-lg shadow-lg">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        Performance Dashboard
      </h2>
      <p class="text-gray-600">
        Monitor application performance and system metrics
      </p>
    </div>

    <!-- System Metrics -->
    <div class="mb-8">
      <SystemMetricsCards
        :system-metrics="systemMetrics"
        :loading="loading"
      />
    </div>

    <!-- Performance Metrics -->
    <div class="mb-8">
      <PerformanceMetricsPanels
        :metrics="metrics"
        :loading="loading"
      />
    </div>

    <!-- Cache Performance -->
    <div class="mb-8">
      <CachePerformancePanel
        :cache-stats="cacheStats"
        :loading="loading"
      />
    </div>

    <!-- Actions -->
    <PerformanceActions
      :loading="loading"
      :last-updated="lastUpdated"
      @refresh="refresh"
      @clear-cache="clearCache"
      @export-metrics="exportMetrics"
    />
  </div>
</template>

<style scoped>
.performance-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
