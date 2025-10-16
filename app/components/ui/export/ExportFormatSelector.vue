<script setup lang="ts">
import type { ExportFormat } from '~/schemas/export'
import { FORMAT_OPTIONS } from '~/schemas/export'

interface Props {
  modelValue: ExportFormat
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: ExportFormat]
}>()

const selectedFormat = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
      Export Format
    </label>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        v-for="option in FORMAT_OPTIONS"
        :key="option.value"
        class="relative"
      >
        <label class="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
          <URadio
            v-model="selectedFormat"
            :value="option.value"
            class="mt-1"
          />
          <div class="flex-1">
            <div class="font-medium text-gray-900 dark:text-white">
              {{ option.label }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ option.description }}
            </div>
          </div>
        </label>
      </div>
    </div>
  </div>
</template>
