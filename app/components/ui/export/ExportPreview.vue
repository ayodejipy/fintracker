<script setup lang="ts">
import type { ExportOptions } from '~/schemas/export'
import { DATA_TYPE_OPTIONS, DATE_RANGE_OPTIONS, FORMAT_OPTIONS } from '~/schemas/export'

interface Props {
  options: ExportOptions
}

const props = defineProps<Props>()

const estimatedFileSize = computed(() => {
  // Rough estimation based on data type and format
  const baseSizes = {
    transactions: { csv: 50, pdf: 200 }, // KB per 100 records
    budgets: { csv: 10, pdf: 50 },
    loans: { csv: 5, pdf: 30 },
    savings: { csv: 5, pdf: 30 },
    all: { csv: 100, pdf: 400 },
  }

  const size = baseSizes[props.options.dataType][props.options.format]
  return `~${size}KB`
})

const dataTypeLabel = computed(() =>
  DATA_TYPE_OPTIONS.find(o => o.value === props.options.dataType)?.label,
)

const formatLabel = computed(() =>
  FORMAT_OPTIONS.find(o => o.value === props.options.format)?.label,
)

const dateRangeLabel = computed(() =>
  DATE_RANGE_OPTIONS.find(o => o.value === props.options.dateRange)?.label,
)
</script>

<template>
  <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
    <h4 class="font-medium text-gray-900 dark:text-white mb-2">
      Export Preview
    </h4>
    <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
      <div><strong>Data Type:</strong> {{ dataTypeLabel }}</div>
      <div><strong>Format:</strong> {{ formatLabel }}</div>
      <div><strong>Date Range:</strong> {{ dateRangeLabel }}</div>
      <div><strong>Estimated Size:</strong> {{ estimatedFileSize }}</div>
    </div>
  </div>
</template>
