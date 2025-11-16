<script setup lang="ts">
const { completeIncomeStep, skipOnboarding, refreshUserState } = useOnboarding()
const toast = useToast()

const isLoading = ref(false)
const isSkipping = ref(false)
const error = ref<string | null>(null)

const formData = reactive({
  monthlyIncome: '',
  currency: 'NGN',
})

const currencies = [
  { code: 'NGN', name: 'Nigerian Naira (₦)' },
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'ZAR', name: 'South African Rand (R)' },
]

// Validation
const isFormValid = computed(() => {
  const income = Number(formData.monthlyIncome)
  return income > 0 && formData.currency && formData.currency.length === 3
})

// Format income input to ensure valid number
function formatIncome(value: string) {
  // Remove non-numeric characters except decimal point
  return value.replace(/[^\d.]/g, '')
}

function handleIncomeInput(event: Event) {
  const input = event.target as HTMLInputElement
  input.value = formatIncome(input.value)
  formData.monthlyIncome = input.value
}

async function handleSubmit() {
  if (!isFormValid.value) { return }

  isLoading.value = true
  error.value = null

  try {
    const monthlyIncome = Number(formData.monthlyIncome)
    console.warn('[IncomeCollectionForm] Starting income submission...', { monthlyIncome, currency: formData.currency })

    const result = await completeIncomeStep(monthlyIncome, formData.currency)
    console.warn('[IncomeCollectionForm] Income submission response:', result)

    if (result.success) {
      // Show success toast
      toast.add({
        title: 'Success',
        description: 'Your income has been saved successfully',
        color: 'success',
      })

      console.warn('[IncomeCollectionForm] Refreshing user state from server...')
      await refreshUserState()

      console.warn('[IncomeCollectionForm] Waiting before redirect to dashboard...')
      // Redirect to dashboard after a brief delay to let toast show
      await new Promise(resolve => setTimeout(resolve, 500))

      console.warn('[IncomeCollectionForm] Redirecting to /dashboard...')
      await navigateTo('/dashboard')
      console.warn('[IncomeCollectionForm] Redirect completed')
    }
    else {
      const errorMsg = result.message || 'Failed to save income information'
      error.value = errorMsg
      console.error('[IncomeCollectionForm] API returned success: false', { message: errorMsg })
      toast.add({
        title: 'Error',
        description: errorMsg,
        color: 'error',
      })
    }
  }
  catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to save income information'
    console.error('[IncomeCollectionForm] Error during submission:', err)
    error.value = errorMsg

    // Show error toast
    toast.add({
      title: 'Error',
      description: errorMsg,
      color: 'error',
    })
  }
  finally {
    isLoading.value = false
  }
}

async function handleSkip() {
  isSkipping.value = true
  error.value = null

  try {
    console.warn('[IncomeCollectionForm] Starting skip onboarding...')
    const result = await skipOnboarding()
    console.warn('[IncomeCollectionForm] Skip onboarding response:', result)

    // Show success toast
    toast.add({
      title: 'Success',
      description: 'Onboarding skipped. You can update your income later in settings.',
      color: 'success',
    })

    console.warn('[IncomeCollectionForm] Refreshing user state from server...')
    await refreshUserState()

    // Redirect to dashboard after a brief delay
    console.warn('[IncomeCollectionForm] Waiting before redirect to dashboard...')
    await new Promise(resolve => setTimeout(resolve, 500))

    console.warn('[IncomeCollectionForm] Redirecting to /dashboard...')
    await navigateTo('/dashboard')
    console.warn('[IncomeCollectionForm] Redirect completed')
  }
  catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to skip onboarding'
    console.error('[IncomeCollectionForm] Error during skip:', err)
    error.value = errorMsg

    // Show error toast
    toast.add({
      title: 'Error',
      description: errorMsg,
      color: 'error',
    })
  }
  finally {
    isSkipping.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md">
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Monthly Income
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        Help us provide personalized insights by sharing your monthly income
      </p>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
    >
      <p class="text-sm text-red-700 dark:text-red-400">
        {{ error }}
      </p>
    </div>

    <!-- Form -->
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Monthly Income Input -->
      <div>
        <label
          for="monthlyIncome"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Monthly Income
        </label>
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {{ formData.currency === 'NGN' ? '₦' : '$' }}
          </span>
          <input
            id="monthlyIncome"
            v-model="formData.monthlyIncome"
            type="text"
            inputmode="decimal"
            placeholder="0.00"
            class="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            @input="handleIncomeInput"
          >
        </div>
        <p v-if="formData.monthlyIncome" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {{ formData.currency }} {{ parseFloat(formData.monthlyIncome).toLocaleString() }}
        </p>
      </div>

      <!-- Currency Select -->
      <div>
        <label
          for="currency"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Currency
        </label>
        <select
          id="currency"
          v-model="formData.currency"
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        >
          <option v-for="currency in currencies" :key="currency.code" :value="currency.code">
            {{ currency.name }}
          </option>
        </select>
      </div>

      <!-- Info Box -->
      <div class="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <p class="text-sm text-blue-700 dark:text-blue-400">
          <Icon name="heroicons:information-circle" class="inline w-4 h-4 mr-2" />
          This helps us provide budget recommendations and spending insights tailored to your income level.
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-col gap-3">
        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="!isFormValid || isLoading || isSkipping"
          class="w-full py-2 px-4 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="isLoading" class="flex items-center justify-center gap-2">
            <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
            Saving...
          </span>
          <span v-else>Continue</span>
        </button>

        <!-- Skip Button -->
        <button
          type="button"
          :disabled="isLoading || isSkipping"
          class="w-full py-2 px-4 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-600 transition-colors disabled:cursor-not-allowed"
          @click="handleSkip"
        >
          <span v-if="isSkipping" class="flex items-center justify-center gap-2">
            <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
            Skipping...
          </span>
          <span v-else>Skip for now</span>
        </button>
      </div>
    </form>
  </div>
</template>
