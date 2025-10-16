<script setup lang="ts">
interface Props {
  loading?: boolean
  lastUpdated?: string | null
}

const _props = withDefaults(defineProps<Props>(), {
  loading: false,
  lastUpdated: null,
})

const emit = defineEmits<{
  refresh: []
  clearCache: []
  exportMetrics: []
}>()

function handleRefresh() {
  emit('refresh')
}

function handleClearCache() {
  emit('clearCache')
}

function handleExportMetrics() {
  emit('exportMetrics')
}
</script>

<template>
  <div class="space-y-4">
    <!-- Actions -->
    <div class="flex flex-wrap gap-4">
      <UButton
        color="primary"
        :loading="loading"
        :disabled="loading"
        icon="i-heroicons-arrow-path"
        @click="handleRefresh"
      >
        {{ loading ? 'Refreshing...' : 'Refresh Metrics' }}
      </UButton>

      <UButton
        color="red"
        variant="solid"
        icon="i-heroicons-trash"
        @click="handleClearCache"
      >
        Clear All Cache
      </UButton>

      <UButton
        color="green"
        variant="solid"
        icon="i-heroicons-arrow-down-tray"
        @click="handleExportMetrics"
      >
        Export Metrics
      </UButton>
    </div>

    <!-- Last Updated -->
    <div class="text-sm text-gray-500">
      Last updated: {{ lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Never' }}
    </div>
  </div>
</template>
