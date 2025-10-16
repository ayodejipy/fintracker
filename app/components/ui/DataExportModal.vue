<script setup lang="ts">
import type { ExportOptions } from '~/schemas/export'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// Export options
const exportOptions = reactive<ExportOptions>({
  dataType: 'all',
  format: 'csv',
  dateRange: 'all',
  startDate: '',
  endDate: '',
  includePreferences: true,
  includeNotifications: false,
})

// Use export composable
const { isExporting, exportProgress, isFormValid, startExport } = useExport()

// Handle export
async function handleExport() {
  const result = await startExport(exportOptions)

  if (result.success) {
    // Close modal after successful export
    setTimeout(() => {
      isOpen.value = false
    }, 1000)
  }
}

const canExport = computed(() => isFormValid(exportOptions))
</script>

<template>
  <UModal v-model="isOpen" :close="true" :dismissible="true" :ui="{ width: 'sm:max-w-2xl' }">
    <template #header>
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-arrow-down-tray" class="w-6 h-6 text-blue-500" />
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Export Financial Data
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Download your financial data for backup or analysis
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Data Type Selection -->
        <ExportDataTypeSelector v-model="exportOptions.dataType" />

        <!-- Format Selection -->
        <ExportFormatSelector v-model="exportOptions.format" />

        <!-- Date Range Selection -->
        <ExportDateRangeSelector
          v-model="exportOptions.dateRange"
          v-model:start-date="exportOptions.startDate"
          v-model:end-date="exportOptions.endDate"
        />

        <!-- Additional Options -->
        <ExportAdditionalOptions
          v-model:include-preferences="exportOptions.includePreferences"
          v-model:include-notifications="exportOptions.includeNotifications"
          :data-type="exportOptions.dataType"
        />

        <!-- Export Preview -->
        <ExportPreview :options="exportOptions" />

        <!-- Export Progress -->
        <ExportProgress
          :is-exporting="isExporting"
          :progress="exportProgress"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-between">
        <div class="text-xs text-gray-500">
          <UIcon name="i-heroicons-shield-check" class="w-4 h-4 inline mr-1" />
          Your data is exported securely and never shared
        </div>

        <div class="flex gap-2">
          <UButton
            variant="ghost"
            :disabled="isExporting"
            @click="isOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="isExporting"
            :disabled="!canExport"
            icon="i-heroicons-arrow-down-tray"
            @click="handleExport"
          >
            Export Data
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
