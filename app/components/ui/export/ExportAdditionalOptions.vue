<script setup lang="ts">
import type { ExportDataType } from '~/schemas/export'

interface Props {
  dataType: ExportDataType
  includePreferences: boolean
  includeNotifications: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:includePreferences': [value: boolean]
  'update:includeNotifications': [value: boolean]
}>()

const includePreferences = computed({
  get: () => props.includePreferences,
  set: value => emit('update:includePreferences', value),
})

const includeNotifications = computed({
  get: () => props.includeNotifications,
  set: value => emit('update:includeNotifications', value),
})

const showAdditionalOptions = computed(() => props.dataType === 'all')
</script>

<template>
  <div v-if="showAdditionalOptions">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
      Additional Options
    </label>
    <div class="space-y-2">
      <UCheckbox
        v-model="includePreferences"
        label="Include notification preferences"
      />
      <UCheckbox
        v-model="includeNotifications"
        label="Include notification history"
      />
    </div>
  </div>
</template>
