<script setup lang="ts">
import type { CreateTransactionInput, ExpenseCategory, RecurringFrequency, Transaction } from '~/types'
import { computed, onMounted, ref, watch } from 'vue'
import AddCategoryModal from '~/components/AddCategoryModal.vue'
import { useCustomCategories } from '~/composables/useCustomCategories'
import { getCategoryOptions } from '~/utils/categories'
import { useTransactionForm } from '../composables/useTransactionForm'

// Props
interface Props {
  transaction?: Transaction | null
}

interface Emits {
  'saved': [transaction: Transaction]
  'confirm': [transaction: Transaction]
  'close': []
}

const props = withDefaults(defineProps<Props>(), {
  transaction: null,
})

const emit = defineEmits<Emits>()

// Composables
const { submitTransaction } = useTransactionForm()
const { categories, fetchCategories, getCategoryOptions: getCustomCategoryOptions } = useCustomCategories()

// Form state
const state = ref({
  type: 'expense' as 'income' | 'expense',
  amount: 0,
  vat: 0,
  category: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  isRecurring: false,
  recurringFrequency: 'monthly' as RecurringFrequency,
  reminderDays: 3,
})

// Local state
const error = ref<string>('')
const isSubmitting = ref(false)
const showAddCategoryModal = ref(false)

// Computed
const isEditing = computed(() => !!props.transaction)

// Default category options
const defaultExpenseCategories = getCategoryOptions()

const defaultIncomeCategories = [
  { label: '💼 Salary', value: 'salary' },
  { label: '💻 Freelance', value: 'freelance' },
  { label: '🏢 Business Income', value: 'business' },
  { label: '📈 Investment Returns', value: 'investment' },
  { label: '🏠 Rental Income', value: 'rental' },
  { label: '🎁 Gift/Bonus', value: 'gift' },
  { label: '💰 Other Income', value: 'other' },
]

// Merge default and custom categories
const availableCategories = computed(() => {
  const defaultCategories = state.value.type === 'income' ? defaultIncomeCategories : defaultExpenseCategories
  const customCategories = getCustomCategoryOptions(state.value.type)

  return [
    ...defaultCategories,
    ...customCategories,
  ]
})

// Handler for when a new category is created
function handleCategorySaved(categoryName: string) {
  state.value.category = categoryName
  showAddCategoryModal.value = false
}

// Methods
function resetForm() {
  state.value = {
    type: 'expense',
    amount: 0,
    vat: 0,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringFrequency: 'monthly',
    reminderDays: 3,
  }
  error.value = ''
}

function populateForm(transaction: Transaction) {
  state.value = {
    type: transaction.type,
    amount: transaction.amount,
    vat: transaction.vat || 0,
    category: transaction.category as string,
    description: transaction.description,
    date: new Date(transaction.date).toISOString().split('T')[0],
    isRecurring: transaction.isRecurring || false,
    recurringFrequency: 'monthly',
    reminderDays: 3,
  }
}

function validateForm(): boolean {
  error.value = ''

  if (state.value.amount <= 0) {
    error.value = 'Amount must be greater than 0'
    return false
  }

  if (!state.value.category) {
    error.value = 'Please select a category'
    return false
  }

  if (!state.value.description.trim()) {
    error.value = 'Please enter a description'
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  try {
    isSubmitting.value = true
    error.value = ''

    const transactionData: CreateTransactionInput = {
      type: state.value.type,
      amount: state.value.amount,
      vat: state.value.vat || undefined,
      category: state.value.category as ExpenseCategory,
      description: state.value.description.trim(),
      date: state.value.date!, // Send as string, backend will coerce to Date
    }

    const result = await submitTransaction(
      transactionData,
      isEditing.value ? props.transaction?.id : undefined,
    )

    if (result.success && result.transaction) {
      emit('saved', result.transaction)
      emit('confirm', result.transaction)
      emit('close')
    }
  }
  catch (err: unknown) {
    console.error('Error submitting transaction:', err)
    error.value = (err as Error).message || 'Failed to save transaction'
  }
  finally {
    isSubmitting.value = false
  }
}

// Initialize form
onMounted(async () => {
  // Load custom categories
  await fetchCategories()

  if (props.transaction) {
    populateForm(props.transaction)
  }
  else {
    resetForm()
  }
})

// Watch for transaction changes
watch(() => props.transaction, (newTransaction) => {
  if (newTransaction) {
    populateForm(newTransaction)
  }
  else {
    resetForm()
  }
}, { immediate: true })

// Reset category when type changes
watch(() => state.value.type, () => {
  state.value.category = ''
})
</script>

<template>
  <UModal :open="true" :close="true" :dismissible="true" @close="$emit('close')" :ui="{ footer: 'justify-end' }">
    <template #header>
      <div class="flex items-center justify-between flex-1 py-3">
        <div class="flex items-center gap-3">
          <div
            class="size-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm"
          >
            <UIcon :name="isEditing ? 'i-heroicons-pencil-square' : 'i-heroicons-plus'" class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ isEditing ? 'Edit Transaction' : 'Add New Transaction' }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ isEditing ? 'Update transaction details' : 'Record a new income or expense' }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #body>
      <UForm :state="state" class="space-y-4" @submit="handleSubmit">
        <!-- Error message -->
        <div
          v-if="error"
          class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-r-lg p-4"
        >
          <div class="flex items-start gap-3">
            <UIcon
              name="i-heroicons-exclamation-circle"
              class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
            />
            <p class="text-red-700 dark:text-red-300 text-sm font-medium">
              {{ error }}
            </p>
          </div>
        </div>

        <!-- Transaction Type Selector -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Transaction Type <span class="text-red-500">*</span>
          </label>
          <div class="w-2/3 grid grid-cols-2 gap-2.5">
            <UButton
              variant="soft"
              class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium transition-all"
              :class="state.type === 'income'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'border-gray-200 dark:border-gray-700  bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-700'"
              @click="state.type = 'income'"
            >
              <UIcon name="i-heroicons-arrow-trending-up" class="w-5 h-5" />
              Income
            </UButton>
            <UButton
              variant="soft"
              class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium transition-all"
              :class="state.type === 'expense'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-50 text-red-700 dark:text-red-300'
                : 'border-gray-200 dark:border-gray-700 bg-white text-gray-700 dark:text-gray-300  hover:bg-red-50 dark:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700'"
              @click="state.type = 'expense'"
            >
              <UIcon name="i-heroicons-arrow-trending-down" class="w-5 h-5" />
              Expense
            </UButton>
          </div>
        </div>

        <!-- Amount -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-semibold pointer-events-none z-10"
            >₦</span>
            <UInput
              v-model="state.amount" type="number" step="0.01" min="0" placeholder="0.00" size="xl"
              class="pl-8 w-full" :ui="{ base: 'text-lg font-semibold' }"
            />
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Enter the transaction amount
          </p>
        </div>

        <!-- VAT (Optional) -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            VAT (Optional)
          </label>
          <div class="relative">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-lg font-semibold pointer-events-none z-10"
            >₦</span>
            <UInput
              v-model="state.vat" type="number" step="0.01" min="0" placeholder="0.00" size="xl"
              class="pl-8 w-full" :ui="{ base: 'text-lg font-semibold' }"
            />
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            VAT amount included in this transaction (if applicable)
          </p>
        </div>

        <!-- Category -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-2">
            <USelect
              v-model="state.category"
              :items="availableCategories"
              placeholder="Choose a category"
              size="xl"
              class="flex-1"
            >
              <template #leading>
                <UIcon name="i-heroicons-tag" class="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </template>
            </USelect>
            <UButton
              color="primary"
              variant="soft"
              size="xl"
              icon="i-heroicons-plus"
              @click="showAddCategoryModal = true"
            >
              Add
            </UButton>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Select a category or create a new one
          </p>
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description <span class="text-red-500">*</span>
          </label>
          <UTextarea
            v-model="state.description" placeholder="e.g., Grocery shopping, Salary payment" :rows="2"
            size="lg" class="w-full"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 ">
            Brief description of the transaction
          </p>
        </div>

        <!-- Date -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date <span class="text-red-500">*</span>
          </label>
          <UInput v-model="state.date" type="date" size="lg" icon="i-heroicons-calendar-days" class="w-full" />
          <p class="text-xs text-gray-500 dark:text-gray-400">
            When did this transaction occur?
          </p>
        </div>

        <!-- Recurring expense option -->
        <div v-if="state.type === 'expense'" class="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 space-y-3">
          <div class="flex items-center space-x-3">
            <UCheckbox
              v-model="state.isRecurring"
              id="isRecurring"
            />
            <label for="isRecurring" class="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Make this a recurring expense
            </label>
          </div>
          <p class="text-xs text-purple-600 dark:text-purple-400 ml-6">
            This will create a recurring expense that automatically tracks future payments
          </p>
          
          <!-- Recurring frequency (shown when recurring is enabled) -->
          <div v-if="state.isRecurring" class="ml-6 space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frequency
                </label>
                <USelect
                  v-model="state.recurringFrequency"
                  :options="[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'yearly', label: 'Yearly' }
                  ]"
                  size="sm"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reminder (days before)
                </label>
                <UInput
                  v-model.number="state.reminderDays"
                  type="number"
                  min="0"
                  max="30"
                  size="sm"
                  placeholder="3"
                />
              </div>
            </div>
          </div>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <UButton type="button" variant="ghost" size="lg" :disabled="isSubmitting" @click="$emit('close')">
          Cancel
        </UButton>
        <UButton
          type="submit" color="primary" size="lg" :loading="isSubmitting"
          :disabled="isSubmitting || state.amount <= 0" @click="handleSubmit"
        >
          <template #leading>
            <UIcon :name="isEditing ? 'i-heroicons-check' : 'i-heroicons-plus'" class="w-5 h-5" />
          </template>
          {{ isEditing ? 'Update Transaction' : 'Add Transaction' }}
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- Add Category Modal -->
  <AddCategoryModal
    v-if="showAddCategoryModal"
    :type="state.type"
    @close="showAddCategoryModal = false"
    @saved="handleCategorySaved"
  />
</template>
