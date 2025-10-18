<script setup lang="ts">
import { useCustomCategories } from '~/composables/useCustomCategories'

interface Options {
  label: string
  value: string
  color: string
  icon: undefined
  isSystem: boolean
}

interface FilterValues {
  search: string
  category: Options
  type: Options
  month: string
}

interface Props {
  modelValue: FilterValues
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterValues]
}>()

// Composables
const { fetchCategories, getCategoryOptions } = useCustomCategories()

// Computed for two-way binding
const filters = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

// Category items for select - using null for "All" option
const categoryItems = computed(() => {
  const expenseOptions = getCategoryOptions('expense')
  const incomeOptions = getCategoryOptions('income')
  return [
    { label: 'All Categories', value: null },
    ...expenseOptions.map(option => ({ ...option, icon: undefined })),
    ...incomeOptions.map(option => ({ ...option, icon: undefined })),
  ]
})

// Type items for select - using null for "All" option
const typeItems = computed(() => [
  { label: 'All Types', value: null },
  { label: '💰 Income', value: 'income' },
  { label: '💸 Expense', value: 'expense' },
])

// Fetch categories on mount
onMounted(async () => {
  await fetchCategories()
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
    <div class="flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-funnel" class="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Filter Transactions
        </h3>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Search -->
        <div>
          <UInput
            v-model="filters.search"
            placeholder="Search transactions..."
            icon="i-heroicons-magnifying-glass"
            size="md"
            class="w-full"
          />
        </div>

        <!-- Category -->
        <div>
          <USelectMenu
            v-model="filters.category"
            :items="categoryItems"
            placeholder="All categories"
            size="md"
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-heroicons-tag" class="w-4 h-4 text-gray-400" />
            </template>
          </USelectMenu>
        </div>

        <!-- Type -->
        <div>
          <USelectMenu
            v-model="filters.type"
            :items="typeItems"
            placeholder="All types"
            size="md"
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-heroicons-arrows-right-left" class="w-4 h-4 text-gray-400" />
            </template>
          </USelectMenu>
        </div>

        <!-- Month -->
        <div>
          <UInput
            v-model="filters.month"
            type="month"
            placeholder="Select month"
            icon="i-heroicons-calendar-days"
            size="md"
            class="w-full"
          />
        </div>
      </div>
    </div>
  </div>
</template>
