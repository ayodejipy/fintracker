<script setup lang="ts">
import { getCurrentMonth, getMonthOptions } from '~/utils/date'

// Props
interface Props {
  modelValue: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => getCurrentMonth(),
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// const model = defineModel<string>({ default: () => getCurrentMonth()})

// Generate month options (last 12 months + current)
const monthOptions = getMonthOptions(12)

// Selected month object (for USelectMenu binding)
const selectedMonthOption = computed({
  get: () => monthOptions.find(option => option.value === props.modelValue) || monthOptions[0],
  set: (option: { label: string, value: string }) => {
    emit('update:modelValue', option.value)
  },
})

// Check if showing current month
const isCurrentMonth = computed(() => {
  return props.modelValue === getCurrentMonth()
})

// Go to current month
function goToCurrentMonth() {
  emit('update:modelValue', getCurrentMonth())
}
</script>

<template>
  <div class="flex items-center justify-between gap-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm px-4 py-3 border border-gray-200 dark:border-gray-700">
    <!-- Month Label -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-calendar" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Viewing:
        </span>
      </div>
      <UBadge v-if="isCurrentMonth" color="primary" variant="subtle" size="xs">
        Current Month
      </UBadge>
    </div>

    <!-- Month Dropdown and Controls -->
    <div class="flex items-center gap-2">
      <!-- Current Month Button (only show when not viewing current month) -->
      <UButton
        v-if="!isCurrentMonth"
        color="primary"
        variant="soft"
        size="sm"
        icon="i-heroicons-arrow-path"
        @click="goToCurrentMonth"
      >
        Current Month
      </UButton>

      <USelectMenu
        v-model="selectedMonthOption"
        :items="monthOptions"
        placeholder="Select month"
        size="md"
        class="min-w-[200px]"
      >
        <template #leading>
          <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-gray-400" />
        </template>
      </USelectMenu>
    </div>
  </div>
</template>
