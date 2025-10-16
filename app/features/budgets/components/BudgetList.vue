<script setup lang="ts">
import type { Budget } from '~/types'

// Props
interface Props {
  budgets: Budget[]
  loading: boolean
}

defineProps<Props>()

const emit = defineEmits<Emits>()

// Emits
interface Emits {
  edit: [budget: Budget]
  delete: [budget: Budget]
  addNew: []
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          Budget Categories
        </h3>
        <div class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
          {{ budgets.length }} of 8 categories budgeted
        </div>
      </div>
    </template>

    <div v-if="loading" class="flex justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin" />
    </div>

    <div v-else-if="budgets.length === 0" class="text-center py-8">
      <UIcon name="i-heroicons-chart-bar" class="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
      <p class="text-gray-500 dark:text-gray-400 dark:text-gray-500">
        No budgets set for this month
      </p>
      <UButton
        variant="ghost"
        class="mt-2"
        @click="emit('addNew')"
      >
        Create your first budget
      </UButton>
    </div>

    <div v-else class="space-y-3">
      <BudgetItem
        v-for="budget in budgets"
        :key="budget.id"
        :budget="budget"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </UCard>
</template>
