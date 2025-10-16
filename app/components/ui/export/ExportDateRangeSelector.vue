<script setup lang="ts">
import type { ExportDateRange } from '~/schemas/export'
import { DATE_RANGE_OPTIONS } from '~/schemas/export'

interface Props {
  modelValue: ExportDateRange
  startDate: string
  endDate: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: ExportDateRange]
  'update:startDate': [value: string]
  'update:endDate': [value: string]
}>()

const selectedDateRange = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    setDateRange(value)
  },
})

const startDate = computed({
  get: () => props.startDate,
  set: value => emit('update:startDate', value),
})

const endDate = computed({
  get: () => props.endDate,
  set: value => emit('update:endDate', value),
})

const showCustomDateRange = computed(() => selectedDateRange.value === 'custom')

function setDateRange(dateRange: ExportDateRange) {
  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentYear = new Date(now.getFullYear(), 0, 1)
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

  switch (dateRange) {
    case 'current_month':
      startDate.value = currentMonth.toISOString().split('T')[0]
      endDate.value = now.toISOString().split('T')[0]
      break
    case 'last_3_months':
      startDate.value = threeMonthsAgo.toISOString().split('T')[0]
      endDate.value = now.toISOString().split('T')[0]
      break
    case 'current_year':
      startDate.value = currentYear.toISOString().split('T')[0]
      endDate.value = now.toISOString().split('T')[0]
      break
    case 'all':
      startDate.value = ''
      endDate.value = ''
      break
  }
}

// Initialize date range on mount
onMounted(() => {
  setDateRange(selectedDateRange.value)
})
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
      Date Range
    </label>
    <USelectMenu
      v-model="selectedDateRange"
      :options="DATE_RANGE_OPTIONS"
      value-attribute="value"
      option-attribute="label"
      class="mb-3"
    />

    <!-- Custom date range inputs -->
    <div v-if="showCustomDateRange" class="grid grid-cols-2 gap-3">
      <UFormGroup label="Start Date">
        <UInput
          v-model="startDate"
          type="date"
          icon="i-heroicons-calendar-days"
        />
      </UFormGroup>
      <UFormGroup label="End Date">
        <UInput
          v-model="endDate"
          type="date"
          icon="i-heroicons-calendar-days"
        />
      </UFormGroup>
    </div>
  </div>
</template>
