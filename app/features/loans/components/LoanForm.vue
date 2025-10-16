<script setup lang="ts">
import type { Loan } from '~/types'
import { computed, onMounted } from 'vue'
import { useLoanForm } from '~/features/loans/composables/useLoanForm'
import { formatDate } from '~/utils/date'

interface Props {
  loan?: Loan | null
}

interface Emits {
  close: []
  success: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const { form, errors, isSubmitting, submitForm, updateLoanForm, populateForm, clearError } = useLoanForm()

// Computed
const isEditing = computed(() => !!props.loan)

const estimatedMonths = computed(() => {
  if (form.value.initialAmount <= 0 || form.value.monthlyPayment <= 0) { return 0 }
  return Math.ceil(form.value.initialAmount / form.value.monthlyPayment)
})

const estimatedPayoffDate = computed(() => {
  if (estimatedMonths.value <= 0) { return null }
  const startDate = new Date(form.value.startDate)
  const payoffDate = new Date(startDate)
  payoffDate.setMonth(payoffDate.getMonth() + estimatedMonths.value)
  return payoffDate
})

// Initialize form if editing
onMounted(() => {
  if (props.loan) {
    populateForm(props.loan)
  }
})

// Handle form submission
async function handleSubmit() {
  try {
    let success = false

    if (isEditing.value && props.loan) {
      success = await updateLoanForm(props.loan.id)
    }
    else {
      success = await submitForm()
    }

    if (success) {
      emit('success')
    }
  }
  catch (error) {
    console.error('Error submitting form:', error)
  }
}
</script>

<template>
  <UModal :open="true" :close="true" :dismissible="true" @close="$emit('close')">
    <template #header>
      <div class="flex items-center justify-between flex-1">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm">
            <UIcon :name="isEditing ? 'i-heroicons-pencil-square' : 'i-heroicons-plus'" class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">
              {{ isEditing ? 'Edit Loan' : 'Add New Loan' }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
              {{ isEditing ? 'Update loan details' : 'Track a new loan or debt' }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #body>
      <UForm :state="form" class="space-y-6" @submit="handleSubmit">
        <!-- General error -->
        <div v-if="errors.general" class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-r-lg p-4">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p class="text-red-700 dark:text-red-300 text-sm font-medium">
              {{ errors.general }}
            </p>
          </div>
        </div>

        <!-- Loan Name -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
            Loan Name <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="form.name"
            placeholder="e.g., Car Loan, Personal Loan, Mortgage"
            icon="i-heroicons-document-text"
            size="lg"
            class="w-full"
            @input="clearError('name')"
          />
          <p v-if="errors.name" class="text-xs text-red-600 dark:text-red-400">
            {{ errors.name }}
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
            Give your loan a descriptive name
          </p>
        </div>

        <!-- Initial Amount -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
            Loan Amount <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 dark:text-gray-400 text-lg font-semibold pointer-events-none z-10">₦</span>
            <UInput
              v-model="form.initialAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              size="xl"
              class="pl-8 w-full"
              :disabled="isEditing"
              :ui="{ base: 'text-lg font-semibold' }"
              @input="clearError('initialAmount')"
            />
          </div>
          <p v-if="errors.initialAmount" class="text-xs text-red-600 dark:text-red-400">
            {{ errors.initialAmount }}
          </p>
          <p v-else-if="isEditing" class="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ Initial amount cannot be changed after creation
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
            Total amount borrowed
          </p>
        </div>

        <!-- Monthly Payment -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
            Monthly Payment <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 dark:text-gray-400 text-base font-semibold pointer-events-none z-10">₦</span>
            <UInput
              v-model="form.monthlyPayment"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              size="lg"
              class="pl-8 w-full"
              @input="clearError('monthlyPayment')"
            />
          </div>
          <p v-if="errors.monthlyPayment" class="text-xs text-red-600 dark:text-red-400">
            {{ errors.monthlyPayment }}
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
            Amount you pay each month
          </p>
        </div>

        <!-- Interest Rate -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
            Interest Rate (Optional)
          </label>
          <UInput
            v-model="form.interestRate"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="0.0"
            icon="i-heroicons-chart-bar"
            size="lg"
            class="w-full"
            @input="clearError('interestRate')"
          >
            <template #trailing>
              <span class="text-gray-400 dark:text-gray-500 dark:text-gray-400 text-sm font-medium">%</span>
            </template>
          </UInput>
          <p v-if="errors.interestRate" class="text-xs text-red-600 dark:text-red-400">
            {{ errors.interestRate }}
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
            Annual interest rate (leave blank if none)
          </p>
        </div>

        <!-- Start Date -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
            Start Date <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="form.startDate"
            type="date"
            icon="i-heroicons-calendar-days"
            size="lg"
            class="w-full"
            :disabled="isEditing"
            @input="clearError('startDate')"
          />
          <p v-if="errors.startDate" class="text-xs text-red-600 dark:text-red-400">
            {{ errors.startDate }}
          </p>
          <p v-else-if="isEditing" class="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ Start date cannot be changed after creation
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">
            When did you take out this loan?
          </p>
        </div>

        <!-- Estimated payoff info -->
        <div v-if="form.initialAmount > 0 && form.monthlyPayment > 0" class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 rounded-r-lg p-4">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-light-bulb" class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                Estimated Payoff
              </h4>
              <p class="text-sm text-blue-700 dark:text-blue-400">
                Approximately {{ estimatedMonths }} months
                <span v-if="estimatedPayoffDate">
                  ({{ formatDate(estimatedPayoffDate) }})
                </span>
              </p>
              <p class="text-xs text-blue-600 dark:text-blue-500 mt-1">
                *Simple estimate without considering interest
              </p>
            </div>
          </div>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <UButton
          type="button"
          variant="ghost"
          size="lg"
          :disabled="isSubmitting"
          @click="$emit('close')"
        >
          Cancel
        </UButton>
        <UButton
          type="submit"
          color="primary"
          size="lg"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          <template #leading>
            <UIcon :name="isEditing ? 'i-heroicons-check' : 'i-heroicons-plus'" class="w-5 h-5" />
          </template>
          {{ isEditing ? 'Update Loan' : 'Add Loan' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
