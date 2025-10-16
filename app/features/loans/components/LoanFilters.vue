<script setup lang="ts">
interface FilterValues {
  search: string
  status: { label: string, value: 'all' | 'active' | 'paid' }
}

interface Props {
  modelValue: FilterValues
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterValues]
}>()

// Computed for two-way binding
const filters = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// Filter options
const statusOptions = [
  { label: 'All Loans', value: 'all' },
  { label: 'Active Only', value: 'active' },
  { label: 'Paid Off', value: 'paid' },
]
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <UInput
          v-model="filters.search"
          placeholder="Search loans..."
          icon="i-heroicons-magnifying-glass"
          class="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div class="flex gap-3">
        <USelectMenu
          v-model="filters.status"
          :items="statusOptions"
          placeholder="Filter by status"
        />
      </div>
    </div>
  </div>
</template>
