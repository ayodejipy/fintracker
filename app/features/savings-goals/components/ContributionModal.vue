<script setup lang="ts">
import type { SavingsGoal } from '~/types'
import { computed, onMounted, ref } from 'vue'
import { useSavingsGoals } from '~/features/savings-goals/composables/useSavingsGoals'
import { formatCurrency } from '~/utils/currency'

interface Props {
  goal: SavingsGoal
}

interface Emits {
  close: []
  success: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const { addContribution } = useSavingsGoals()

// Form state
const state = ref({
  contributionAmount: 0,
  description: '',
})

// Local state
const error = ref<string>('')
const isSubmitting = ref(false)

// Set default contribution amount to monthly contribution
onMounted(() => {
  state.value.contributionAmount = props.goal.monthlyContribution
  state.value.description = `Monthly contribution to ${props.goal.name}`
})

// Methods
function setContributionAmount(amount: number) {
  state.value.contributionAmount = amount
  error.value = ''
}

function validateContribution(): boolean {
  error.value = ''

  if (state.value.contributionAmount <= 0) {
    error.value = 'Contribution amount must be greater than 0'
    return false
  }

  if (state.value.contributionAmount > props.goal.targetAmount * 2) {
    error.value = 'Contribution amount seems unusually high'
    return false
  }

  return true
}

async function handleSubmit() {
  if (!validateContribution()) {
    return
  }

  try {
    isSubmitting.value = true
    error.value = ''

    const response = await addContribution(
      props.goal.id,
      state.value.contributionAmount,
      state.value.description || undefined,
    )

    // Show success message if goal is completed
    if (response.data?.currentAmount >= response.data?.targetAmount) {
      console.log('🎉 Goal completed!', response.message)
    }

    emit('success')
  }
  catch (err) {
    console.error('Error adding contribution:', err)
    error.value = err.message || 'Failed to add contribution'
  }
  finally {
    isSubmitting.value = false
  }
}

// Computed values
const remainingAmount = computed(() => {
  return Math.max(0, props.goal.targetAmount - props.goal.currentAmount)
})

const newCurrentAmount = computed(() => {
  return Math.min(props.goal.currentAmount + state.value.contributionAmount, props.goal.targetAmount)
})

const actualContribution = computed(() => {
  return newCurrentAmount.value - props.goal.currentAmount
})

const newProgressPercentage = computed(() => {
  if (props.goal.targetAmount === 0) { return 0 }
  return Math.min((newCurrentAmount.value / props.goal.targetAmount) * 100, 100)
})

const willComplete = computed(() => {
  return state.value.contributionAmount >= remainingAmount.value
})
</script>

<template>
  <UModal :open="true" :close="true" :dismissible="true" @close="$emit('close')">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
          <UIcon name="i-heroicons-banknotes" class="w-4 h-4 text-white" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">
          Add Contribution - {{ goal.name }}
        </h3>
      </div>
    </template>

    <template #body>
      <UForm :state="state" class="space-y-5" @submit="handleSubmit">
        <!-- Goal info -->
        <div class="bg-gray-50 dark:bg-gray-700/50 dark:bg-gray-800 p-4 rounded-lg">
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Current
              </p>
              <p class="font-semibold text-green-600">
                {{ formatCurrency(goal.currentAmount) }}
              </p>
            </div>
            <div>
              <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Target
              </p>
              <p class="font-semibold text-gray-900 dark:text-white dark:text-white">
                {{ formatCurrency(goal.targetAmount) }}
              </p>
            </div>
            <div>
              <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                Remaining
              </p>
              <p class="font-semibold text-blue-600">
                {{ formatCurrency(remainingAmount) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p class="text-red-700 dark:text-red-400 text-sm">
            {{ error }}
          </p>
        </div>

        <!-- Contribution amount -->
        <UFormField label="Contribution Amount (₦)" name="contributionAmount" required>
          <UInput
            v-model="state.contributionAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            icon="i-heroicons-banknotes"
          >
            <template #trailing>
              <span class="text-gray-400 dark:text-gray-500 text-sm font-medium">₦</span>
            </template>
          </UInput>
        </UFormField>

        <!-- Quick Amount Buttons -->
        <div class="space-y-3">
          <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300">
            Quick amounts:
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton
              type="button"
              variant="outline"
              size="sm"
              @click="setContributionAmount(goal.monthlyContribution)"
            >
              Monthly ({{ formatCurrency(goal.monthlyContribution) }})
            </UButton>
            <UButton
              type="button"
              variant="outline"
              size="sm"
              @click="setContributionAmount(remainingAmount)"
            >
              Complete Goal ({{ formatCurrency(remainingAmount) }})
            </UButton>
            <UButton
              type="button"
              variant="outline"
              size="sm"
              @click="setContributionAmount(Math.round(remainingAmount / 2))"
            >
              Half Remaining ({{ formatCurrency(Math.round(remainingAmount / 2)) }})
            </UButton>
          </div>
        </div>

        <!-- Description -->
        <UFormField label="Description (Optional)" name="description">
          <UInput
            v-model="state.description"
            placeholder="e.g., Monthly savings, Bonus contribution"
          />
        </UFormField>

        <!-- Contribution preview -->
        <div v-if="state.contributionAmount > 0" class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 class="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            Contribution Preview
          </h4>
          <div class="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <p>Contribution: {{ formatCurrency(actualContribution) }}</p>
            <p>New Balance: {{ formatCurrency(newCurrentAmount) }}</p>
            <p>New Progress: {{ Math.round(newProgressPercentage) }}%</p>
            <p v-if="willComplete" class="font-medium text-green-700 dark:text-green-400">
              🎉 This contribution will complete your goal!
            </p>
            <p v-else-if="actualContribution < state.contributionAmount" class="text-yellow-700 dark:text-yellow-400">
              Note: Contribution will be capped at remaining amount
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
          :disabled="isSubmitting || state.contributionAmount <= 0"
          class="flex-1"
          @click="handleSubmit"
        >
          Add Contribution
        </UButton>
      </div>
    </template>
  </UModal>
</template>
