<script setup lang="ts">
import type { Budget, CreateBudgetInput, ExpenseCategory } from '~/types'
import { z } from 'zod'
import { formatCurrency } from '~/utils/currency'
import { useBudgetForm } from '../composables/useBudgetForm'

// Props
interface Props {
  budget?: Budget | null
  month?: string
  availableCategories?: Array<{ value: ExpenseCategory, label: string }>
}

const props = withDefaults(defineProps<Props>(), {
  budget: null,
  month: () => new Date().toISOString().slice(0, 7),
  availableCategories: () => [],
})

const emit = defineEmits<Emits>()

// Emits
interface Emits {
  saved: [budget: Budget]
  confirm: [budget: Budget]
  close: []
}

// Composables
const { submitBudget, isValidBudgetData } = useBudgetForm()

// Validation schema
const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  monthlyLimit: z.number().positive('Monthly limit must be positive'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
})

// Reactive state
const loading = ref(false)
const formData = reactive({
  category: '' as ExpenseCategory,
  monthlyLimit: 0,
  month: props.month,
})

// Computed
const isEditing = computed(() => !!props.budget)

const isFormValid = computed(() => {
  return isValidBudgetData({
    category: formData.category,
    monthlyLimit: formData.monthlyLimit,
    month: formData.month,
  })
})

const categoryOptions = computed(() => {
  if (isEditing.value && props.budget) {
    // When editing, include the current category
    return [
      { value: props.budget.category, label: getCategoryDisplayName(props.budget.category) },
      ...props.availableCategories,
    ]
  }
  return props.availableCategories
})

// Methods
function resetForm() {
  formData.category = '' as ExpenseCategory
  formData.monthlyLimit = 0
  formData.month = props.month
}

function populateForm(budget: Budget) {
  formData.category = budget.category
  formData.monthlyLimit = budget.monthlyLimit
  formData.month = budget.month
}

async function onSubmit() {
  if (!isFormValid.value) { return }

  loading.value = true

  const budgetData: CreateBudgetInput = {
    category: formData.category,
    monthlyLimit: formData.monthlyLimit,
    month: formData.month,
  }

  const result = await submitBudget(
    budgetData,
    isEditing.value ? props.budget?.id : undefined,
  )

  loading.value = false

  if (result.success && result.budget) {
    emit('saved', result.budget)
    emit('confirm', result.budget)
    closeForm()
  }
  // Error handling is done in the composable
}

function closeForm() {
  emit('close')
}

// Helper function
function getCategoryDisplayName(category: ExpenseCategory): string {
  const categoryNames: Record<ExpenseCategory, string> = {
    loan_repayment: 'Loan Repayment',
    home_allowance: 'Home Allowance',
    rent: 'Rent',
    transport: 'Transport',
    food: 'Food & Groceries',
    data_airtime: 'Data & Airtime',
    miscellaneous: 'Miscellaneous',
    savings: 'Savings',
  }

  return categoryNames[category] || category
}

// Watchers
watch(() => props.budget, (newBudget) => {
  if (newBudget) {
    populateForm(newBudget)
  }
  else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.month, (newMonth) => {
  formData.month = newMonth
})
</script>

<template>
  <UModal :open="true" :close="true" :dismissible="true" :ui="{ footer: 'justify-end' }" @close="closeForm">
    <template #header>
      <div class="flex items-center justify-between flex-1 py-3">
        <div class="flex items-center gap-3">
          <div
            class="size-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm"
          >
            <UIcon :name="isEditing ? 'i-heroicons-pencil-square' : 'i-heroicons-plus'" class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ isEditing ? 'Edit Budget' : 'Create Budget' }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ isEditing ? 'Update budget details' : 'Set spending limit for a category' }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #body>
      <UForm
        :schema="budgetSchema"
        :state="formData"
        class="space-y-6"
        @submit="onSubmit"
      >
        <!-- Category Selection -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category <span class="text-red-500">*</span>
          </label>
          <USelect
            v-model="formData.category"
            :items="categoryOptions"
            placeholder="Select a budget category"
            value-attribute="value"
            option-attribute="label"
            :disabled="isEditing"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-heroicons-tag" class="w-5 h-5 text-gray-400" />
            </template>
          </USelect>
          <p v-if="isEditing" class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <UIcon name="i-heroicons-information-circle" class="w-4 h-4" />
            Category cannot be changed when editing
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400">
            Choose the expense category you want to set a budget for
          </p>
        </div>

        <!-- Monthly Limit -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Monthly Limit <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <UInput
              v-model.number="formData.monthlyLimit"
              type="number"
              step="1000"
              min="0"
              placeholder="Enter amount"
              size="lg"
              class="w-full pl-12"
            />
            <div class="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <span class="text-lg font-semibold text-gray-500 dark:text-gray-400">₦</span>
            </div>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Maximum amount you plan to spend in this category
          </p>
        </div>

        <!-- Month Selection -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Budget Month <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="formData.month"
            type="month"
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-gray-400" />
            </template>
          </UInput>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Select which month this budget applies to
          </p>
        </div>

        <!-- Preview Card -->
        <div
          v-if="formData.category && formData.monthlyLimit > 0"
          class="mt-6 p-5 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700/50 rounded-xl"
        >
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-eye" class="w-4 h-4 text-white" />
            </div>
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
              Budget Preview
            </h4>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Category</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ getCategoryDisplayName(formData.category) }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Period</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ new Date(`${formData.month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }}
              </span>
            </div>
            <div class="pt-2 mt-2 border-t border-purple-200 dark:border-purple-700/50">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Limit</span>
                <span class="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {{ formatCurrency(formData.monthlyLimit) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          variant="ghost"
          :disabled="loading"
          @click="closeForm"
        >
          Cancel
        </UButton>
        <UButton
          type="submit"
          :loading="loading"
          :disabled="!isFormValid"
          @click="onSubmit"
        >
          {{ isEditing ? 'Update' : 'Create' }} Budget
        </UButton>
      </div>
    </template>
  </UModal>
</template>
