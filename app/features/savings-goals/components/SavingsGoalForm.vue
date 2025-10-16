<script setup lang="ts">
import type { SavingsGoal } from '~/types'
import { computed, onMounted } from 'vue'
import { useSavingsGoalForm } from '~/features/savings-goals/composables/useSavingsGoalForm'
import { formatDate } from '~/utils/date'

interface Props {
  goal?: SavingsGoal | null
}

interface Emits {
  close: []
  success: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const { form, errors, isSubmitting, submitForm, updateGoalForm, populateForm, clearError } = useSavingsGoalForm()

// Computed
const isEditing = computed(() => !!props.goal)

const estimatedMonths = computed(() => {
  if (form.value.targetAmount <= 0 || form.value.monthlyContribution <= 0) { return 0 }
  return Math.ceil(form.value.targetAmount / form.value.monthlyContribution)
})

const estimatedCompletionDate = computed(() => {
  if (estimatedMonths.value <= 0) { return null }
  const today = new Date()
  const completionDate = new Date(today)
  completionDate.setMonth(completionDate.getMonth() + estimatedMonths.value)
  return completionDate
})

const targetDateMonths = computed(() => {
  if (!form.value.targetDate) { return 0 }
  const today = new Date()
  const targetDate = new Date(form.value.targetDate)
  const diffTime = targetDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44))
})

const requiredMonthlyContribution = computed(() => {
  if (targetDateMonths.value <= 0 || form.value.targetAmount <= 0) { return 0 }
  return Math.ceil(form.value.targetAmount / targetDateMonths.value)
})

const isAchievable = computed(() => {
  if (estimatedMonths.value <= 0 || targetDateMonths.value <= 0) { return true }
  return estimatedMonths.value <= targetDateMonths.value
})

// Initialize form if editing
onMounted(() => {
  if (props.goal) {
    populateForm(props.goal)
  }
})

// Handle form submission
async function handleSubmit() {
  try {
    let success = false

    if (isEditing.value && props.goal) {
      success = await updateGoalForm(props.goal.id)
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
          <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
            <UIcon :name="isEditing ? 'i-heroicons-pencil-square' : 'i-heroicons-plus'" class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white dark:text-white">
              {{ isEditing ? 'Edit Savings Goal' : 'Add New Savings Goal' }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
              {{ isEditing ? 'Update goal details' : 'Set a new savings target' }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <template #body>
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- General error -->
        <div v-if="errors.general" class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 rounded-r-lg p-4">
          <div class="flex items-start gap-3">
            <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p class="text-red-700 dark:text-red-300 text-sm font-medium">
              {{ errors.general }}
            </p>
          </div>
        </div>

        <!-- Goal Name -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
            Goal Name <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="form.name"
            placeholder="e.g., Emergency Fund, Vacation, New Car"
            icon="i-heroicons-flag"
            size="lg"
            class="w-full"
            @input="clearError('name')"
          />
          <p v-if="errors.name" class="text-xs text-red-600 dark:text-red-400">
            {{ errors.name }}
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
            What are you saving for?
          </p>
        </div>

        <!-- Target Amount -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
            Target Amount <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 text-lg font-semibold pointer-events-none z-10">₦</span>
            <UInput
              v-model="form.targetAmount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              size="xl"
              class="pl-8 w-full"
              :ui="{ base: 'text-lg font-semibold' }"
              @input="clearError('targetAmount')"
            />
          </div>
          <p v-if="errors.targetAmount" class="text-xs text-red-600 dark:text-red-400">
            {{ errors.targetAmount }}
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
            How much do you need to save?
          </p>
        </div>

        <!-- Target Date -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
            Target Date <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="form.targetDate"
            type="date"
            icon="i-heroicons-calendar-days"
            size="lg"
            class="w-full"
            @input="clearError('targetDate')"
          />
          <p v-if="errors.targetDate" class="text-xs text-red-600 dark:text-red-400">
            {{ errors.targetDate }}
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
            When do you want to reach this goal?
          </p>
        </div>

        <!-- Monthly Contribution -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">
            Monthly Contribution <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 text-base font-semibold pointer-events-none z-10">₦</span>
            <UInput
              v-model="form.monthlyContribution"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              size="lg"
              class="pl-8 w-full"
              @input="clearError('monthlyContribution')"
            />
          </div>
          <p v-if="errors.monthlyContribution" class="text-xs text-red-600 dark:text-red-400">
            {{ errors.monthlyContribution }}
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
            How much can you save each month?
          </p>
        </div>

        <!-- Goal Analysis -->
        <div v-if="form.targetAmount > 0 && form.monthlyContribution > 0" class="space-y-3">
          <!-- Timeline Analysis -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-600 rounded-r-lg p-4">
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-clock" class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                  Timeline Analysis
                </h4>
                <div class="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <p>At ₦{{ form.monthlyContribution.toLocaleString() }}/month:</p>
                  <p>• Goal will be reached in {{ estimatedMonths }} months</p>
                  <p v-if="estimatedCompletionDate">
                    • Estimated completion: {{ formatDate(estimatedCompletionDate) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Target Date Analysis -->
          <div
            v-if="form.targetDate"
            class="border-l-4 rounded-r-lg p-4"
            :class="isAchievable
              ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 dark:border-amber-600'"
          >
            <div class="flex items-start gap-3">
              <UIcon
                :name="isAchievable ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-triangle'"
                class="w-5 h-5 flex-shrink-0 mt-0.5"
                :class="isAchievable ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'"
              />
              <div>
                <h4
                  class="text-sm font-semibold mb-1"
                  :class="isAchievable ? 'text-green-900 dark:text-green-300' : 'text-amber-900 dark:text-amber-300'"
                >
                  Target Date Analysis
                </h4>
                <div
                  class="text-sm space-y-1"
                  :class="isAchievable ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'"
                >
                  <p>Target date: {{ formatDate(form.targetDate) }} ({{ targetDateMonths }} months)</p>
                  <p v-if="isAchievable" class="font-medium">
                    ✅ Goal is achievable with current contribution!
                  </p>
                  <p v-else class="font-medium">
                    💡 Need ₦{{ requiredMonthlyContribution.toLocaleString() }}/month to meet target date
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
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
          {{ isEditing ? 'Update Goal' : 'Create Goal' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Component-specific styles can be added here */
</style>
