<script setup lang="ts">
import type { Loan } from '~/types'
import { computed, onMounted, ref } from 'vue'
import { useLoans } from '~/features/loans/composables/useLoans'
import { formatCurrency } from '~/utils/currency'
import { formatDate } from '~/utils/date'

interface Props {
  loan: Loan
}

interface Emits {
  close: []
}

const props = defineProps<Props>()
defineEmits<Emits>()

// Composables
const { getLoanProjection } = useLoans()

// Local state
const projection = ref<any>(null)
const loading = ref(false)
const error = ref<string>('')
const showFullSchedule = ref(false)

// Computed
const displayedSchedule = computed(() => {
  if (!projection.value?.paymentSchedule) { return [] }

  if (showFullSchedule.value) {
    return projection.value.paymentSchedule
  }

  return projection.value.paymentSchedule.slice(0, 12)
})

// Methods
async function loadProjection() {
  try {
    loading.value = true
    error.value = ''

    projection.value = await getLoanProjection(props.loan.id)
  }
  catch (err: any) {
    console.error('Error loading projection:', err)
    error.value = err.message || 'Failed to load projection'
  }
  finally {
    loading.value = false
  }
}

function calculateExtraPaymentSavings(extraAmount: number): number {
  if (!projection.value || props.loan.monthlyPayment <= 0) { return 0 }

  const currentMonths = projection.value.monthsRemaining || 0
  const newPayment = props.loan.monthlyPayment + extraAmount
  const newMonths = Math.ceil(props.loan.currentBalance / newPayment)

  return Math.max(0, currentMonths - newMonths)
}

// Load projection on mount
onMounted(() => {
  loadProjection()
})
</script>

<template>
  <UModal :open="true" :close="true" :dismissible="true" @close="$emit('close')">
    <UCard class="max-w-4xl mx-auto dark:bg-gray-800">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-white" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">
            Loan Projection - {{ loan.name }}
          </h3>
        </div>
      </template>

      <!-- Content -->
      <!-- Loading state -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="flex items-center gap-3 text-gray-500 dark:text-gray-400 dark:text-gray-400">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-blue-500 dark:text-blue-400" />
          <span>Calculating projection...</span>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-700 dark:text-red-400">
          {{ error }}
        </p>
        <UButton
          variant="outline"
          size="sm"
          class="mt-2"
          @click="loadProjection"
        >
          Try again
        </UButton>
      </div>

      <!-- Projection data -->
      <div v-else-if="projection" class="space-y-6">
        <!-- Summary cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <p class="text-sm text-red-700 dark:text-red-400 font-semibold">
              Remaining Balance
            </p>
            <p class="text-2xl font-bold text-red-900 dark:text-red-300">
              {{ formatCurrency(projection.remainingBalance) }}
            </p>
          </div>
          <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <p class="text-sm text-blue-700 dark:text-blue-400 font-semibold">
              Months Remaining
            </p>
            <p class="text-2xl font-bold text-blue-900 dark:text-blue-300">
              {{ projection.monthsRemaining }}
            </p>
          </div>
          <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
            <p class="text-sm text-green-700 dark:text-green-400 font-semibold">
              Payoff Date
            </p>
            <p class="text-lg font-bold text-green-900 dark:text-green-300">
              {{ projection.payoffDate ? formatDate(projection.payoffDate) : 'N/A' }}
            </p>
          </div>
          <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
            <p class="text-sm text-yellow-700 dark:text-yellow-400 font-semibold">
              Total Interest
            </p>
            <p class="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
              {{ formatCurrency(projection.totalInterestPaid) }}
            </p>
          </div>
        </div>

        <!-- Payment schedule table -->
        <div v-if="projection.paymentSchedule && projection.paymentSchedule.length > 0">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white dark:text-white mb-4">
            Payment Schedule
          </h3>
          <div class="bg-white dark:bg-gray-800 dark:bg-gray-800 border dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-700/50 dark:bg-gray-900/50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                      Month
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                      Payment
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                      Principal
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                      Interest
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr
                    v-for="(payment, index) in displayedSchedule"
                    :key="index"
                    class="hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:bg-gray-700/50 dark:hover:bg-gray-700/50"
                  >
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white dark:text-white">
                      {{ payment.month }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white dark:text-white">
                      {{ formatCurrency(payment.payment) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white dark:text-white">
                      {{ formatCurrency(payment.principal) }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-900 dark:text-white dark:text-white">
                      {{ formatCurrency(payment.interest) }}
                    </td>
                    <td class="px-4 py-3 text-sm font-medium" :class="payment.balance <= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                      {{ formatCurrency(payment.balance) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Show more/less toggle -->
            <div v-if="projection.paymentSchedule.length > 12" class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 dark:bg-gray-900/50 border-t dark:border-gray-700">
              <button
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                @click="showFullSchedule = !showFullSchedule"
              >
                {{ showFullSchedule ? 'Show Less' : `Show All ${projection.paymentSchedule.length} Payments` }}
              </button>
            </div>
          </div>
        </div>

        <!-- Scenarios section -->
        <div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">
            What If Scenarios
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white dark:bg-gray-800 dark:bg-gray-800 p-4 rounded-lg">
              <h4 class="font-medium text-gray-900 dark:text-white dark:text-white mb-2">
                Extra ₦10,000/month
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                Save approximately {{ calculateExtraPaymentSavings(10000) }} months
              </p>
            </div>
            <div class="bg-white dark:bg-gray-800 dark:bg-gray-800 p-4 rounded-lg">
              <h4 class="font-medium text-gray-900 dark:text-white dark:text-white mb-2">
                Extra ₦20,000/month
              </h4>
              <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400">
                Save approximately {{ calculateExtraPaymentSavings(20000) }} months
              </p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            type="button"
            variant="outline"
            @click="$emit('close')"
          >
            Close
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
