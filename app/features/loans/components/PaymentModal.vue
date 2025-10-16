<script setup lang="ts">
import type { Loan } from '~/types'
import { onMounted, ref } from 'vue'
import { useLoans } from '~/features/loans/composables/useLoans'
import { formatCurrency } from '~/utils/currency'

interface Props {
  loan: Loan
}

interface Emits {
  close: []
  success: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const { recordPayment } = useLoans()

// Form state
const state = ref({
  paymentAmount: 0,
})

// Local state
const error = ref<string>('')
const isSubmitting = ref(false)

// Set default payment amount to monthly payment
onMounted(() => {
  state.value.paymentAmount = props.loan.monthlyPayment
})

// Methods
function setPaymentAmount(amount: number) {
  state.value.paymentAmount = amount
  error.value = ''
}

function validatePayment(): boolean {
  error.value = ''

  if (state.value.paymentAmount <= 0) {
    error.value = 'Payment amount must be greater than 0'
    return false
  }

  if (state.value.paymentAmount > props.loan.currentBalance * 2) {
    error.value = 'Payment amount seems unusually high'
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validatePayment()) {
    return
  }

  try {
    isSubmitting.value = true
    error.value = ''

    await recordPayment(props.loan.id, state.value.paymentAmount)
    emit('success')
  }
  catch (err: any) {
    console.error('Error recording payment:', err)
    error.value = err.message || 'Failed to record payment'
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal :open="true" :close="true" :dismissible="true" @close="$emit('close')">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
          <UIcon name="i-heroicons-banknotes" class="w-4 h-4 text-white" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">
          Record Payment - {{ loan.name }}
        </h3>
      </div>
    </template>

    <template #body>
      <UForm :state="state" class="space-y-5" @submit="handleSubmit">
        <!-- Loan Summary -->
        <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Current Balance
              </p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                {{ formatCurrency(loan.currentBalance) }}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                Monthly Payment
              </p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                {{ formatCurrency(loan.monthlyPayment) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-red-700 text-sm">
            {{ error }}
          </p>
        </div>

        <!-- Payment Amount -->
        <UFormField label="Payment Amount (₦)" name="paymentAmount" required>
          <UInput
            v-model="state.paymentAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            icon="i-heroicons-banknotes"
          >
            <template #trailing>
              <span class="text-gray-400 text-sm font-medium">₦</span>
            </template>
          </UInput>
        </UFormField>

        <!-- Quick Amount Buttons -->
        <div class="space-y-3">
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Quick amounts:
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton
              type="button"
              variant="outline"
              size="sm"
              class="border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50"
              @click="setPaymentAmount(loan.monthlyPayment)"
            >
              Regular ({{ formatCurrency(loan.monthlyPayment) }})
            </UButton>
            <UButton
              type="button"
              variant="outline"
              size="sm"
              class="border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50"
              @click="setPaymentAmount(loan.currentBalance)"
            >
              Pay Off ({{ formatCurrency(loan.currentBalance) }})
            </UButton>
          </div>
        </div>

        <!-- Payment Preview -->
        <div v-if="state.paymentAmount > 0" class="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 class="text-sm font-medium text-blue-900 mb-2">
            Payment Preview
          </h4>
          <div class="text-sm text-blue-700 space-y-1">
            <p>Payment Amount: {{ formatCurrency(state.paymentAmount) }}</p>
            <p>New Balance: {{ formatCurrency(Math.max(0, loan.currentBalance - state.paymentAmount)) }}</p>
            <p v-if="state.paymentAmount >= loan.currentBalance" class="font-medium text-green-700">
              🎉 This payment will pay off your loan!
            </p>
          </div>
        </div>
      </UForm>
    </template>

    <template #footer>
      <div class="flex gap-3">
        <UButton
          type="button"
          variant="outline"
          :disabled="isSubmitting"
          class="flex-1"
          @click="$emit('close')"
        >
          Cancel
        </UButton>
        <UButton
          type="submit"
          color="primary"
          :loading="isSubmitting"
          :disabled="isSubmitting || state.paymentAmount <= 0"
          class="flex-1"
          @click="handleSubmit"
        >
          Record Payment
        </UButton>
      </div>
    </template>
  </UModal>
</template>
