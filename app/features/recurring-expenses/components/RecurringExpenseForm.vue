<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRecurringExpenses } from '../composables/useRecurringExpenses'
import type { RecurringExpense, RecurringFrequency, ExpenseCategory } from '~/types'
import { getCategoryDisplayName } from '~/utils/categories'
import { formatCurrency } from '~/utils/currency'

interface Props {
  expense?: RecurringExpense | null
}

interface Emits {
  confirm: [expense: RecurringExpense]
  close: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const { createRecurringExpense, updateRecurringExpense } = useRecurringExpenses()

// Form state
const form = ref({
  name: '',
  amount: 0,
  category: 'rent' as ExpenseCategory,
  frequency: 'monthly' as RecurringFrequency,
  nextDueDate: '',
  description: '',
  reminderDays: 3,
  autoCreateTransaction: false,
})

const loading = ref(false)
const errors = ref<Record<string, string>>({})

// Options
const categoryOptions = [
  { value: 'rent', label: getCategoryDisplayName('rent') },
  { value: 'loan_repayment', label: getCategoryDisplayName('loan_repayment') },
  { value: 'home_allowance', label: getCategoryDisplayName('home_allowance') },
  { value: 'transport', label: getCategoryDisplayName('transport') },
  { value: 'food', label: getCategoryDisplayName('food') },
  { value: 'data_airtime', label: getCategoryDisplayName('data_airtime') },
  { value: 'miscellaneous', label: getCategoryDisplayName('miscellaneous') },
]

const frequencyOptions = [
  { 
    value: 'weekly', 
    label: 'Weekly',
    description: 'Every 7 days',
    icon: 'i-heroicons-calendar-days'
  },
  { 
    value: 'monthly', 
    label: 'Monthly',
    description: 'Every month',
    icon: 'i-heroicons-calendar'
  },
  { 
    value: 'yearly', 
    label: 'Yearly',
    description: 'Every 12 months',
    icon: 'i-heroicons-calendar-date-range'
  },
]

// Computed
const isEditing = computed(() => !!props.expense)
const submitButtonText = computed(() => isEditing.value ? 'Update Expense' : 'Add Expense')

// Initialize form when expense prop changes
watch(() => props.expense, (expense) => {
  if (expense) {
    form.value = {
      name: expense.name,
      amount: expense.amount,
      category: expense.category,
      frequency: expense.frequency,
      nextDueDate: new Date(expense.nextDueDate).toISOString().slice(0, 16),
      description: expense.description || '',
      reminderDays: expense.reminderDays,
      autoCreateTransaction: expense.autoCreateTransaction,
    }
  } else {
    // Reset form for new expense
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    form.value = {
      name: '',
      amount: 0,
      category: 'rent',
      frequency: 'monthly',
      nextDueDate: tomorrow.toISOString().slice(0, 16),
      description: '',
      reminderDays: 3,
      autoCreateTransaction: false,
    }
  }
  errors.value = {}
}, { immediate: true })

// Validation
function validateForm() {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
  }

  if (form.value.amount <= 0) {
    errors.value.amount = 'Amount must be greater than 0'
  }

  if (!form.value.nextDueDate) {
    errors.value.nextDueDate = 'Next due date is required'
  } else {
    const dueDate = new Date(form.value.nextDueDate)
    const today = new Date()
    if (dueDate < today) {
      errors.value.nextDueDate = 'Due date cannot be in the past'
    }
  }

  if (form.value.reminderDays < 0 || form.value.reminderDays > 30) {
    errors.value.reminderDays = 'Reminder days must be between 0 and 30'
  }

  return Object.keys(errors.value).length === 0
}

// Submit handler
async function handleSubmit() {
  if (!validateForm()) return

  try {
    loading.value = true

    const data = {
      name: form.value.name.trim(),
      amount: form.value.amount,
      category: form.value.category,
      frequency: form.value.frequency,
      nextDueDate: new Date(form.value.nextDueDate),
      description: form.value.description.trim() || undefined,
      reminderDays: form.value.reminderDays,
      autoCreateTransaction: form.value.autoCreateTransaction,
    }

    let result
    if (isEditing.value && props.expense) {
      result = await updateRecurringExpense(props.expense.id, data)
    } else {
      result = await createRecurringExpense(data)
    }

    if (result) {
      emit('confirm', result)
    }
  }
  catch (error: any) {
    console.error('Error saving recurring expense:', error)
    // Handle validation errors from server
    if (error.data?.errors) {
      error.data.errors.forEach((err: any) => {
        errors.value[err.path[0]] = err.message
      })
    }
  }
  finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('close')
}
</script>

<template>
  <UModal :open="true" :close="true" :dismissible="true" @close="$emit('close')" :ui="{ width: 'sm:max-w-2xl' }">
    <template #header>
      <div class="flex items-center gap-4 py-4">
        <div class="relative">
          <div class="size-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <UIcon :name="isEditing ? 'i-heroicons-pencil-square' : 'i-heroicons-plus'" class="w-6 h-6 text-white" />
          </div>
          <div class="absolute -bottom-1 -right-1 size-5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="w-3 h-3 text-white" />
          </div>
        </div>
        <div class="flex-1">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ isEditing ? 'Edit Recurring Expense' : 'Create Recurring Expense' }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ isEditing ? 'Update your recurring expense details' : 'Set up automatic expense tracking' }}
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-8 py-2">
        <!-- Basic Information Section -->
        <div class="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 space-y-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="size-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h4>
          </div>

          <!-- Expense Name -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <span class="flex items-center gap-2">
                <UIcon name="i-heroicons-tag" class="w-4 h-4" />
                Expense Name *
              </span>
            </label>
            <UInput
              v-model="form.name"
              placeholder="e.g., Monthly Rent, Internet Bill, Netflix Subscription"
              :error="errors.name"
              size="lg"
              :ui="{ base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl', ring: 'focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400' }"
              required
            />
          </div>

          <!-- Amount and Category Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-banknotes" class="w-4 h-4" />
                  Amount (₦) *
                </span>
              </label>
              <UInput
                v-model.number="form.amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                :error="errors.amount"
                size="lg"
                :ui="{ base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl', ring: 'focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400' }"
                required
              >
                <template #leading>
                  <span class="text-gray-500 dark:text-gray-400 font-medium">₦</span>
                </template>
              </UInput>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4" />
                  Category *
                </span>
              </label>
              <USelect
                v-model="form.category"
                :options="categoryOptions"
                :error="errors.category"
                size="lg"
                :ui="{ base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-select rounded-xl', ring: 'focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400' }"
              />
            </div>
          </div>
        </div>

        <!-- Scheduling Section -->
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 space-y-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="size-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Scheduling</h4>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Frequency -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
                  Frequency *
                </span>
              </label>
              <USelect
                v-model="form.frequency"
                :options="frequencyOptions"
                :error="errors.frequency"
                size="lg"
                :ui="{ base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-select rounded-xl', ring: 'focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400' }"
              />
              <p class="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                <UIcon name="i-heroicons-information-circle" class="w-3 h-3" />
                How often this expense occurs
              </p>
            </div>

            <!-- Next Due Date -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-clock" class="w-4 h-4" />
                  Next Due Date *
                </span>
              </label>
              <UInput
                v-model="form.nextDueDate"
                type="datetime-local"
                :error="errors.nextDueDate"
                size="lg"
                :ui="{ base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl', ring: 'focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400' }"
                required
              />
              <p class="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                <UIcon name="i-heroicons-information-circle" class="w-3 h-3" />
                When is this expense next due?
              </p>
            </div>
          </div>
        </div>

        <!-- Advanced Options Section -->
        <div class="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 space-y-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="size-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">Advanced Options</h4>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <span class="flex items-center gap-2">
                <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
                Description (Optional)
              </span>
            </label>
            <UTextarea
              v-model="form.description"
              placeholder="Add notes about this expense, payment method, or any special instructions..."
              rows="3"
              :ui="{ base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-textarea rounded-xl resize-none', ring: 'focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400' }"
            />
          </div>

          <!-- Reminder and Auto-Transaction Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Reminder Days -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-bell" class="w-4 h-4" />
                  Reminder Days
                </span>
              </label>
              <UInput
                v-model.number="form.reminderDays"
                type="number"
                min="0"
                max="30"
                :error="errors.reminderDays"
                size="lg"
                :ui="{ base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl', ring: 'focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400' }"
              >
                <template #trailing>
                  <span class="text-gray-500 dark:text-gray-400 text-sm">days</span>
                </template>
              </UInput>
              <p class="text-xs text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1">
                <UIcon name="i-heroicons-information-circle" class="w-3 h-3" />
                Get notified before the expense is due
              </p>
            </div>

            <!-- Auto Create Transaction Toggle -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-bolt" class="w-4 h-4" />
                  Automation
                </span>
              </label>
              <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">Auto-create Transaction</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatically create transaction when due</p>
                  </div>
                  <UToggle
                    v-model="form.autoCreateTransaction"
                    :ui="{ active: 'bg-purple-500 dark:bg-purple-400', inactive: 'bg-gray-200 dark:bg-gray-700' }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between py-4">
        <!-- Form Summary -->
        <div class="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <div class="flex items-center gap-1">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" />
            <span>{{ form.frequency || 'Select frequency' }}</span>
          </div>
          <div v-if="form.amount > 0" class="flex items-center gap-1">
            <UIcon name="i-heroicons-banknotes" class="w-4 h-4" />
            <span>{{ formatCurrency(form.amount) }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-3">
          <UButton
            type="button"
            variant="ghost"
            size="lg"
            @click="handleCancel"
            :disabled="loading"
            :ui="{ rounded: 'rounded-xl' }"
          >
            Cancel
          </UButton>
          <UButton
            type="button"
            size="lg"
            :loading="loading"
            :disabled="loading || !form.name || !form.amount || !form.category"
            @click="handleSubmit"
            :ui="{ 
              rounded: 'rounded-xl',
              color: {
                primary: {
                  solid: 'shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:ring-purple-500 text-white'
                }
              }
            }"
          >
            <template #leading>
              <UIcon :name="isEditing ? 'i-heroicons-check' : 'i-heroicons-plus'" class="w-5 h-5" />
            </template>
            {{ submitButtonText }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>